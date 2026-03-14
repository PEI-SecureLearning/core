from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field

from src.core.mongo import (
    get_content_collection,
    get_content_folders_collection,
    serialize_content_document,
    serialize_content_folder_document,
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
ROOT_FOLDER_ID = "fld_root"
ROOT_FOLDER_NAME = "content"
ROOT_FOLDER_PATH = "content"
CONTENT_DIR = "content/"
CONTENT_NOT_FOUND = "Content not found"
FILE_NOT_FOUND = "File not found"
FOLDER_NOT_FOUND = "Folder not found"


class ContentPieceCreate(BaseModel):
    path: str | None = Field(None, min_length=1, max_length=500)
    folder_id: str | None = Field(None, min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(None, max_length=500)
    content_format: Literal["text", "markdown", "html", "link"] = "text"
    body: str | None = None
    source_url: str | None = None
    tags: list[str] = Field(default_factory=list)


class ContentPieceUpdate(BaseModel):
    folder_id: str | None = Field(None, min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(None, max_length=500)
    body: str | None = None
    source_url: str | None = None
    tags: list[str] = Field(default_factory=list)


class ContentFolderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    parent_folder_id: str | None = Field(default=ROOT_FOLDER_ID, min_length=1, max_length=100)


class ContentFolderOut(BaseModel):
    id: str
    kind: Literal["content_folder"]
    folder_id: str
    name: str
    parent_folder_id: str | None = None
    file_ids: list[str] = Field(default_factory=list)
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
    folder_id: str | None = None
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


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _new_content_piece_id() -> str:
    return f"cnt_{uuid4().hex}"


def _new_folder_id() -> str:
    return f"fld_{uuid4().hex}"


def _normalize_folder_path(path: str) -> str:
    normalized = path.strip().strip("/")
    if not normalized:
        return ROOT_FOLDER_PATH
    if normalized == ROOT_FOLDER_NAME:
        return ROOT_FOLDER_PATH
    if normalized.startswith(f"{ROOT_FOLDER_NAME}/"):
        return normalized
    return f"{ROOT_FOLDER_NAME}/{normalized}"


def _normalize_content_path(path: str) -> str:
    normalized = _normalize_folder_path(path)
    return CONTENT_DIR if normalized == ROOT_FOLDER_PATH else normalized


def _root_folder_document() -> dict[str, Any]:
    now = _utcnow()
    return {
        "id": ROOT_FOLDER_ID,
        "kind": "content_folder",
        "folder_id": ROOT_FOLDER_ID,
        "name": ROOT_FOLDER_NAME,
        "parent_folder_id": None,
        "file_ids": [],
        "path": ROOT_FOLDER_PATH,
        "created_at": now,
        "updated_at": now,
    }


async def _ensure_root_folder() -> dict[str, Any]:
    collection = get_content_folders_collection()
    doc = await collection.find_one({"folder_id": ROOT_FOLDER_ID})
    if doc:
        return doc

    document = {
        "kind": "content_folder",
        "folder_id": ROOT_FOLDER_ID,
        "name": ROOT_FOLDER_NAME,
        "parent_folder_id": None,
        "file_ids": [],
        "path": ROOT_FOLDER_PATH,
        "created_at": _utcnow(),
        "updated_at": _utcnow(),
    }
    await collection.update_one(
        {"folder_id": ROOT_FOLDER_ID},
        {"$setOnInsert": document},
        upsert=True,
    )
    doc = await collection.find_one({"folder_id": ROOT_FOLDER_ID})
    return doc or _root_folder_document()


def _content_file_url(file_meta: dict[str, Any] | None) -> str | None:
    if not isinstance(file_meta, dict):
        return None
    if file_meta.get("storage") != "garage":
        return None

    object_key = file_meta.get("object_key")
    if not isinstance(object_key, str) or not object_key:
        return None

    return generate_presigned_get_url(bucket=settings.GARAGE_BUCKET_CONTENT, key=object_key)


async def _load_folders_by_id() -> dict[str, dict[str, Any]]:
    await _ensure_root_folder()
    collection = get_content_folders_collection()
    cursor = collection.find({"kind": "content_folder"})
    folders: dict[str, dict[str, Any]] = {}
    async for doc in cursor:
        folder_id = doc.get("folder_id")
        if isinstance(folder_id, str) and folder_id:
            folders[folder_id] = doc
    if ROOT_FOLDER_ID not in folders:
        folders[ROOT_FOLDER_ID] = _root_folder_document()
    return folders


def _build_folder_path(folder_id: str | None, folders_by_id: dict[str, dict[str, Any]]) -> str:
    if not folder_id:
        return CONTENT_DIR
    current = folders_by_id.get(folder_id)
    if current:
        path = current.get("path")
        if isinstance(path, str) and path:
            return CONTENT_DIR if path == ROOT_FOLDER_PATH else path

    if folder_id == ROOT_FOLDER_ID:
        return CONTENT_DIR
    return CONTENT_DIR


def _to_content_out(
    doc: dict[str, Any],
    *,
    folders_by_id: dict[str, dict[str, Any]] | None = None,
    include_file_url: bool = True,
) -> ContentPieceOut:
    payload = serialize_content_document(doc)
    payload["path"] = _build_folder_path(payload.get("folder_id"), folders_by_id or {})
    file_meta = payload.get("file")
    if isinstance(file_meta, dict):
        file_meta["file_url"] = _content_file_url(file_meta) if include_file_url else None
    return ContentPieceOut.model_validate(payload)


def _to_folder_out(doc: dict[str, Any]) -> ContentFolderOut:
    payload = serialize_content_folder_document(doc)
    return ContentFolderOut.model_validate(payload)


async def _get_folder_doc_or_400(folder_id: str) -> dict[str, Any]:
    await _ensure_root_folder()
    collection = get_content_folders_collection()
    doc = await collection.find_one({"kind": "content_folder", "folder_id": folder_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=FOLDER_NOT_FOUND)
    return doc


async def _ensure_folder_path(path: str) -> str:
    await _ensure_root_folder()
    normalized = _normalize_folder_path(path)
    if normalized == ROOT_FOLDER_PATH:
        return ROOT_FOLDER_ID

    collection = get_content_folders_collection()
    parent_folder_id = ROOT_FOLDER_ID
    current_path = ROOT_FOLDER_PATH
    for segment in normalized.split("/")[1:]:
        current_path = f"{current_path}/{segment}"
        existing = await collection.find_one(
            {
                "kind": "content_folder",
                "parent_folder_id": parent_folder_id,
                "name": segment,
            }
        )
        if existing:
            parent_folder_id = existing["folder_id"]
            continue

        folder_id = _new_folder_id()
        now = _utcnow()
        await collection.insert_one(
            {
                "kind": "content_folder",
                "folder_id": folder_id,
                "name": segment,
                "parent_folder_id": parent_folder_id,
                "file_ids": [],
                "path": current_path,
                "created_at": now,
                "updated_at": now,
            }
        )
        parent_folder_id = folder_id

    return parent_folder_id


async def _resolve_folder_id(*, folder_id: str | None, path: str | None) -> str:
    if folder_id:
        await _get_folder_doc_or_400(folder_id)
        return folder_id
    if path:
        return await _ensure_folder_path(path)
    return ROOT_FOLDER_ID


async def _store_content_bytes(*, content_piece_id: str, filename: str, content_type: str, raw: bytes) -> dict[str, Any]:
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


async def _add_file_to_folder(folder_id: str, content_piece_id: str) -> None:
    folders = get_content_folders_collection()
    await folders.update_one(
        {"kind": "content_folder", "folder_id": folder_id},
        {
            "$addToSet": {"file_ids": content_piece_id},
            "$set": {"updated_at": _utcnow()},
        },
    )


async def _remove_file_from_folder(folder_id: str | None, content_piece_id: str) -> None:
    if not folder_id:
        return
    folders = get_content_folders_collection()
    await folders.update_one(
        {"kind": "content_folder", "folder_id": folder_id},
        {
            "$pull": {"file_ids": content_piece_id},
            "$set": {"updated_at": _utcnow()},
        },
    )


async def list_content_pieces() -> list[ContentPieceOut]:
    folders_by_id = await _load_folders_by_id()
    collection = get_content_collection()
    cursor = collection.find({"kind": "content_piece"}).sort("updated_at", -1)
    results: list[ContentPieceOut] = []
    async for doc in cursor:
        try:
            results.append(_to_content_out(doc, folders_by_id=folders_by_id, include_file_url=False))
        except ObjectStorageError as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    return results


async def list_content_folders() -> list[ContentFolderOut]:
    await _ensure_root_folder()
    collection = get_content_folders_collection()
    cursor = collection.find({"kind": "content_folder"}).sort("path", 1)
    results: list[ContentFolderOut] = []
    async for doc in cursor:
        results.append(_to_folder_out(doc))
    return results


async def get_content_piece(content_piece_id: str) -> ContentPieceOut:
    collection = get_content_collection()
    doc = await collection.find_one({"kind": "content_piece", "content_piece_id": content_piece_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=CONTENT_NOT_FOUND)
    try:
        return _to_content_out(doc, folders_by_id=await _load_folders_by_id())
    except ObjectStorageError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


async def create_content_folder(payload: ContentFolderCreate) -> ContentFolderOut:
    await _ensure_root_folder()
    parent_folder_id = payload.parent_folder_id or ROOT_FOLDER_ID
    parent_doc = await _get_folder_doc_or_400(parent_folder_id)

    name = payload.name.strip().strip("/")
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Folder name is required")
    if "/" in name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Folder name cannot contain '/'")

    folders = get_content_folders_collection()
    existing = await folders.find_one(
        {
            "kind": "content_folder",
            "parent_folder_id": parent_folder_id,
            "name": name,
        }
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Folder already exists")

    now = _utcnow()
    document = {
        "kind": "content_folder",
        "folder_id": _new_folder_id(),
        "name": name,
        "parent_folder_id": parent_folder_id,
        "file_ids": [],
        "path": f"{parent_doc['path']}/{name}",
        "created_at": now,
        "updated_at": now,
    }
    result = await folders.insert_one(document)
    doc = await folders.find_one({"_id": result.inserted_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create folder")
    return _to_folder_out(doc)


async def create_content_piece(payload: ContentPieceCreate) -> ContentPieceOut:
    if payload.content_format == "link" and not payload.source_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="source_url is required when content_format is 'link'")
    if payload.content_format != "link" and not payload.body:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="body is required for text/markdown/html content")

    folder_id = await _resolve_folder_id(folder_id=payload.folder_id, path=payload.path)
    now = _utcnow()
    document: dict[str, Any] = {
        "kind": "content_piece",
        "content_piece_id": _new_content_piece_id(),
        "folder_id": folder_id,
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
    await _add_file_to_folder(folder_id, document["content_piece_id"])
    doc = await collection.find_one({"_id": result.inserted_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create content")
    try:
        return _to_content_out(doc, folders_by_id=await _load_folders_by_id())
    except ObjectStorageError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


async def update_content_piece(content_piece_id: str, payload: ContentPieceUpdate) -> ContentPieceOut:
    collection = get_content_collection()
    existing = await collection.find_one({"kind": "content_piece", "content_piece_id": content_piece_id})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=CONTENT_NOT_FOUND)

    content_format = existing.get("content_format")
    if content_format == "link":
        if not payload.source_url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="source_url is required when content_format is 'link'",
            )
    elif content_format != "file" and not payload.body:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="body is required for text/markdown/html content",
        )

    resolved_folder_id = await _resolve_folder_id(
        folder_id=payload.folder_id or existing.get("folder_id"),
        path=None,
    )
    previous_folder_id = existing.get("folder_id")

    await collection.update_one(
        {"_id": existing["_id"]},
        {
            "$set": {
                "folder_id": resolved_folder_id,
                "title": payload.title.strip(),
                "description": payload.description,
                "body": None if content_format in {"file", "link"} else payload.body,
                "source_url": payload.source_url if content_format == "link" else None,
                "tags": payload.tags,
                "updated_at": _utcnow(),
            }
        },
    )

    if previous_folder_id != resolved_folder_id:
        await _remove_file_from_folder(previous_folder_id, content_piece_id)
        await _add_file_to_folder(resolved_folder_id, content_piece_id)

    doc = await collection.find_one({"_id": existing["_id"]})
    if not doc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update content")
    try:
        return _to_content_out(doc, folders_by_id=await _load_folders_by_id())
    except ObjectStorageError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


async def upload_content_piece(
    path: str | None,
    title: str,
    file: UploadFile,
    folder_id: str | None = None,
    description: str | None = None,
    tags: list[str] | None = None,
) -> ContentPieceOut:
    resolved_folder_id = await _resolve_folder_id(folder_id=folder_id, path=path)

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    now = _utcnow()
    content_piece_id = _new_content_piece_id()
    filename = file.filename or "uploaded-content"
    content_type = file.content_type or "application/octet-stream"

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
        "folder_id": resolved_folder_id,
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
        await _add_file_to_folder(resolved_folder_id, content_piece_id)
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
        return _to_content_out(doc, folders_by_id=await _load_folders_by_id())
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

    await _remove_file_from_folder(doc.get("folder_id"), content_piece_id)
    result = await collection.delete_one({"kind": "content_piece", "content_piece_id": content_piece_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=CONTENT_NOT_FOUND)


async def delete_content_folder(folder_id: str) -> None:
    if folder_id == ROOT_FOLDER_ID:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Root folder cannot be deleted")

    folders = get_content_folders_collection()
    folder_doc = await folders.find_one({"kind": "content_folder", "folder_id": folder_id})
    if not folder_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=FOLDER_NOT_FOUND)

    child = await folders.find_one({"kind": "content_folder", "parent_folder_id": folder_id})
    if child:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Folder is not empty")

    if folder_doc.get("file_ids"):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Folder is not empty")

    result = await folders.delete_one({"kind": "content_folder", "folder_id": folder_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=FOLDER_NOT_FOUND)
