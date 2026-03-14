from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field

from src.core.mongo import (
    get_content_collection,
    get_content_collections_collection,
    serialize_content_collection_document,
    serialize_content_document,
)
from src.core.object_storage import (
    ObjectStorageError,
    build_object_key,
    delete_object,
    ensure_bucket,
    garage_enabled,
    generate_presigned_get_url,
    put_bytes,
)
from src.core.settings import settings


ContentFormat = Literal["text", "markdown", "html", "link", "file"]
CONTENT_DIR = "content/"
CONTENT_COLLECTION_ROOT_ID = "col_root"
CONTENT_COLLECTION_ROOT_NAME = "content"
CONTENT_NOT_FOUND = "Content not found"
FILE_NOT_FOUND = "File not found"
COLLECTION_NOT_FOUND = "Collection not found"


def _normalize_collection_path(path: str) -> str:
    normalized = path.strip().strip("/")
    if not normalized:
        return CONTENT_COLLECTION_ROOT_NAME
    if normalized == CONTENT_COLLECTION_ROOT_NAME:
        return CONTENT_COLLECTION_ROOT_NAME
    if normalized.startswith(f"{CONTENT_COLLECTION_ROOT_NAME}/"):
        return normalized
    return f"{CONTENT_COLLECTION_ROOT_NAME}/{normalized}"


def _normalize_content_path(path: str) -> str:
    normalized = _normalize_collection_path(path)
    return CONTENT_DIR if normalized == CONTENT_COLLECTION_ROOT_NAME else normalized


class ContentPieceCreate(BaseModel):
    path: str | None = Field(None, min_length=1, max_length=500)
    collection_id: str | None = Field(None, min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(None, max_length=500)
    content_format: Literal["text", "markdown", "html", "link"] = "text"
    body: str | None = None
    source_url: str | None = None
    tags: list[str] = Field(default_factory=list)


class ContentCollectionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    parent_id: str | None = Field(default=CONTENT_COLLECTION_ROOT_ID, min_length=1, max_length=100)


class ContentCollectionOut(BaseModel):
    id: str
    kind: Literal["content_collection"]
    collection_id: str
    name: str
    parent_id: str | None = None
    path: str
    created_at: datetime
    updated_at: datetime


class ContentFileMeta(BaseModel):
    filename: str
    content_type: str
    size: int
    storage: Literal["garage"] = "garage"
    object_key: str | None = None
    etag: str | None = None
    file_url: str | None = None


class ContentPieceOut(BaseModel):
    id: str
    kind: Literal["content_piece"]
    content_piece_id: str
    collection_id: str | None = None
    path: str
    title: str
    description: str | None = None
    content_format: ContentFormat
    body: str | None = None
    source_url: str | None = None
    tags: list[str] = Field(default_factory=list)
    file: ContentFileMeta | None = None
    created_at: datetime
    updated_at: datetime


def _new_content_piece_id() -> str:
    return f"cnt_{uuid4().hex}"


def _new_collection_id() -> str:
    return f"col_{uuid4().hex}"


def _root_collection_payload() -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    return {
        "id": CONTENT_COLLECTION_ROOT_ID,
        "kind": "content_collection",
        "collection_id": CONTENT_COLLECTION_ROOT_ID,
        "name": CONTENT_COLLECTION_ROOT_NAME,
        "parent_id": None,
        "path": CONTENT_COLLECTION_ROOT_NAME,
        "created_at": now,
        "updated_at": now,
    }


def _content_file_url(file_meta: dict[str, Any] | None) -> str | None:
    if not isinstance(file_meta, dict):
        return None
    if file_meta.get("storage") != "garage":
        return None

    object_key = file_meta.get("object_key")
    if not isinstance(object_key, str) or not object_key:
        return None

    return generate_presigned_get_url(
        bucket=settings.GARAGE_BUCKET_CONTENT,
        key=object_key,
    )


def _build_collection_path(
    collection_id: str | None,
    collections_by_id: dict[str, dict[str, Any]],
) -> str:
    if not collection_id or collection_id == CONTENT_COLLECTION_ROOT_ID:
        return CONTENT_DIR

    parts: list[str] = []
    current_id = collection_id
    visited: set[str] = set()
    while current_id and current_id != CONTENT_COLLECTION_ROOT_ID:
        if current_id in visited:
            break
        visited.add(current_id)
        current = collections_by_id.get(current_id)
        if not current:
            break
        name = current.get("name")
        if isinstance(name, str) and name:
            parts.append(name)
        current_id = current.get("parent_id")

    if not parts:
        return CONTENT_DIR
    return "/".join([CONTENT_COLLECTION_ROOT_NAME, *reversed(parts)])


def _to_content_out(
    doc: dict[str, Any],
    *,
    collections_by_id: dict[str, dict[str, Any]] | None = None,
    include_file_url: bool = True,
) -> ContentPieceOut:
    payload = serialize_content_document(doc)
    payload["path"] = _build_collection_path(payload.get("collection_id"), collections_by_id or {})
    file_meta = payload.get("file")
    if isinstance(file_meta, dict):
        file_meta["file_url"] = _content_file_url(file_meta) if include_file_url else None
    return ContentPieceOut.model_validate(payload)


def _to_collection_out(doc: dict[str, Any]) -> ContentCollectionOut:
    payload = serialize_content_collection_document(doc)
    return ContentCollectionOut.model_validate(payload)


async def _load_collections_by_id() -> dict[str, dict[str, Any]]:
    collection = get_content_collections_collection()
    cursor = collection.find({"kind": "content_collection"})
    collections_by_id: dict[str, dict[str, Any]] = {}
    async for doc in cursor:
        collection_id = doc.get("collection_id")
        if isinstance(collection_id, str) and collection_id:
            collections_by_id[collection_id] = doc
    return collections_by_id


async def _get_collection_doc_or_400(collection_id: str) -> dict[str, Any]:
    if collection_id == CONTENT_COLLECTION_ROOT_ID:
        return _root_collection_payload()

    collection = get_content_collections_collection()
    doc = await collection.find_one({"kind": "content_collection", "collection_id": collection_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=COLLECTION_NOT_FOUND)
    return doc


async def _ensure_collection_path(path: str) -> str:
    normalized = _normalize_collection_path(path)
    if normalized == CONTENT_COLLECTION_ROOT_NAME:
        return CONTENT_COLLECTION_ROOT_ID

    collection = get_content_collections_collection()
    parent_id = CONTENT_COLLECTION_ROOT_ID
    current_path = CONTENT_COLLECTION_ROOT_NAME
    for segment in normalized.split("/")[1:]:
        current_path = f"{current_path}/{segment}"
        existing = await collection.find_one(
            {
                "kind": "content_collection",
                "parent_id": parent_id,
                "name": segment,
            }
        )
        if existing:
            parent_id = existing["collection_id"]
            continue

        now = datetime.now(timezone.utc)
        collection_id = _new_collection_id()
        await collection.insert_one(
            {
                "kind": "content_collection",
                "collection_id": collection_id,
                "name": segment,
                "parent_id": parent_id,
                "path": current_path,
                "created_at": now,
                "updated_at": now,
            }
        )
        parent_id = collection_id

    return parent_id


async def _resolve_collection_id(*, collection_id: str | None, path: str | None) -> str:
    if collection_id:
        await _get_collection_doc_or_400(collection_id)
        return collection_id
    if path:
        return await _ensure_collection_path(path)
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="collection_id or path is required")


async def _store_content_bytes(
    *,
    content_piece_id: str,
    filename: str,
    content_type: str,
    raw: bytes,
) -> dict[str, Any]:
    if not garage_enabled():
        raise ObjectStorageError("Content storage backend must be Garage")

    await ensure_bucket(settings.GARAGE_BUCKET_CONTENT)
    object_key = build_object_key(settings.GARAGE_CONTENT_PREFIX, content_piece_id, filename)
    etag = await put_bytes(
        bucket=settings.GARAGE_BUCKET_CONTENT,
        key=object_key,
        data=raw,
        content_type=content_type,
    )
    return {
        "filename": filename,
        "content_type": content_type,
        "size": len(raw),
        "storage": "garage",
        "object_key": object_key,
        "etag": etag,
    }


async def list_content_pieces() -> list[ContentPieceOut]:
    collection = get_content_collection()
    cursor = collection.find({"kind": "content_piece"}).sort("updated_at", -1)
    collections_by_id = await _load_collections_by_id()
    results: list[ContentPieceOut] = []
    async for doc in cursor:
        try:
            results.append(_to_content_out(doc, collections_by_id=collections_by_id, include_file_url=False))
        except ObjectStorageError as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    return results


async def list_content_collections() -> list[ContentCollectionOut]:
    collection = get_content_collections_collection()
    cursor = collection.find({"kind": "content_collection"}).sort("path", 1)
    results = [ContentCollectionOut.model_validate(_root_collection_payload())]
    async for doc in cursor:
        results.append(_to_collection_out(doc))
    return results


async def get_content_piece(content_piece_id: str) -> ContentPieceOut:
    collection = get_content_collection()
    doc = await collection.find_one({"kind": "content_piece", "content_piece_id": content_piece_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=CONTENT_NOT_FOUND)
    try:
        return _to_content_out(doc, collections_by_id=await _load_collections_by_id())
    except ObjectStorageError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


async def create_content_collection(payload: ContentCollectionCreate) -> ContentCollectionOut:
    parent_id = payload.parent_id or CONTENT_COLLECTION_ROOT_ID
    parent_doc = await _get_collection_doc_or_400(parent_id)

    name = payload.name.strip().strip("/")
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Collection name is required")
    if "/" in name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Collection name cannot contain '/'")

    collection = get_content_collections_collection()
    existing = await collection.find_one(
        {"kind": "content_collection", "parent_id": parent_id, "name": name}
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Collection already exists")

    parent_path = parent_doc.get("path") or CONTENT_COLLECTION_ROOT_NAME
    now = datetime.now(timezone.utc)
    document = {
        "kind": "content_collection",
        "collection_id": _new_collection_id(),
        "name": name,
        "parent_id": parent_id,
        "path": f"{parent_path}/{name}",
        "created_at": now,
        "updated_at": now,
    }
    result = await collection.insert_one(document)
    doc = await collection.find_one({"_id": result.inserted_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create collection")
    return _to_collection_out(doc)


async def create_content_piece(payload: ContentPieceCreate) -> ContentPieceOut:
    if payload.content_format == "link" and not payload.source_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="source_url is required when content_format is 'link'",
        )
    if payload.content_format != "link" and not payload.body:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="body is required for text/markdown/html content",
        )

    resolved_collection_id = await _resolve_collection_id(collection_id=payload.collection_id, path=payload.path)

    now = datetime.now(timezone.utc)
    document: dict[str, Any] = {
        "kind": "content_piece",
        "content_piece_id": _new_content_piece_id(),
        "collection_id": resolved_collection_id,
        "title": payload.title.strip(),
        "description": payload.description,
        "content_format": payload.content_format,
        "body": payload.body,
        "source_url": payload.source_url,
        "tags": payload.tags,
        "file": None,
        "created_at": now,
        "updated_at": now,
    }

    collection = get_content_collection()
    result = await collection.insert_one(document)
    doc = await collection.find_one({"_id": result.inserted_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create content")
    try:
        return _to_content_out(doc, collections_by_id=await _load_collections_by_id())
    except ObjectStorageError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


async def upload_content_piece(
    path: str | None,
    title: str,
    file: UploadFile,
    collection_id: str | None = None,
    description: str | None = None,
    tags: list[str] | None = None,
) -> ContentPieceOut:
    resolved_collection_id = await _resolve_collection_id(collection_id=collection_id, path=path)

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    now = datetime.now(timezone.utc)
    content_piece_id = _new_content_piece_id()
    filename = file.filename or "uploaded-content"
    content_type = file.content_type or "application/octet-stream"

    file_doc: dict[str, Any]
    try:
        file_doc = await _store_content_bytes(
            content_piece_id=content_piece_id,
            filename=filename,
            content_type=content_type,
            raw=raw,
        )
    except ObjectStorageError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    document: dict[str, Any] = {
        "kind": "content_piece",
        "content_piece_id": content_piece_id,
        "collection_id": resolved_collection_id,
        "title": title.strip(),
        "description": description,
        "content_format": "file",
        "body": None,
        "source_url": None,
        "tags": tags or [],
        "file": file_doc,
        "created_at": now,
        "updated_at": now,
    }

    collection = get_content_collection()
    try:
        result = await collection.insert_one(document)
    except Exception:
        object_key = file_doc.get("object_key")
        if isinstance(object_key, str) and object_key:
            try:
                await delete_object(bucket=settings.GARAGE_BUCKET_CONTENT, key=object_key)
            except ObjectStorageError:
                pass
        raise

    doc = await collection.find_one({"_id": result.inserted_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload content")
    try:
        return _to_content_out(doc, collections_by_id=await _load_collections_by_id())
    except ObjectStorageError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


async def download_content_file(content_piece_id: str) -> RedirectResponse:
    url = await get_content_file_url(content_piece_id)
    if not url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=FILE_NOT_FOUND)
    return RedirectResponse(url=url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)


async def get_content_file_url(content_piece_id: str) -> str | None:
    collection = get_content_collection()
    doc = await collection.find_one(
        {"kind": "content_piece", "content_piece_id": content_piece_id},
        {"file": 1},
    )
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=CONTENT_NOT_FOUND)

    file_meta = doc.get("file")
    if not isinstance(file_meta, dict):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=FILE_NOT_FOUND)

    try:
        return _content_file_url(file_meta)
    except ObjectStorageError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


async def delete_content_piece(content_piece_id: str) -> None:
    collection = get_content_collection()
    doc = await collection.find_one({"kind": "content_piece", "content_piece_id": content_piece_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=CONTENT_NOT_FOUND)

    file_meta = doc.get("file")
    if isinstance(file_meta, dict) and file_meta.get("storage") == "garage":
        object_key = file_meta.get("object_key")
        if isinstance(object_key, str) and object_key:
            try:
                await delete_object(bucket=settings.GARAGE_BUCKET_CONTENT, key=object_key)
            except ObjectStorageError:
                pass

    result = await collection.delete_one({"kind": "content_piece", "content_piece_id": content_piece_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=CONTENT_NOT_FOUND)


async def delete_content_collection(collection_id: str) -> None:
    if collection_id == CONTENT_COLLECTION_ROOT_ID:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Root collection cannot be deleted")

    collections = get_content_collections_collection()
    collection_doc = await collections.find_one({"kind": "content_collection", "collection_id": collection_id})
    if not collection_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=COLLECTION_NOT_FOUND)

    child = await collections.find_one({"kind": "content_collection", "parent_id": collection_id})
    if child:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Collection is not empty")

    content = get_content_collection()
    piece = await content.find_one({"kind": "content_piece", "collection_id": collection_id})
    if piece:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Collection is not empty")

    result = await collections.delete_one({"kind": "content_collection", "collection_id": collection_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=COLLECTION_NOT_FOUND)
