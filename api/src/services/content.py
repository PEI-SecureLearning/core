import base64
import binascii
from io import BytesIO
from datetime import datetime
from typing import Any, Literal
from uuid import uuid4

from bson import ObjectId
from fastapi import HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from src.core.mongo import (
    get_content_collection,
    get_content_gridfs_bucket,
    serialize_content_document,
)
from src.core.settings import settings


ContentFormat = Literal["text", "markdown", "html", "link", "file"]


def _normalize_content_path(path: str) -> str:
    normalized = path.strip().lstrip("/")
    if not normalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Path is required",
        )
    if normalized in {"content", "content/"}:
        return "content/"
    if not normalized.startswith("content/"):
        normalized = f"content/{normalized}"
    return normalized


class ContentPieceCreate(BaseModel):
    path: str = Field(..., min_length=1, max_length=500)
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(None, max_length=500)
    content_format: Literal["text", "markdown", "html", "link"] = "text"
    body: str | None = None
    source_url: str | None = None
    tags: list[str] = Field(default_factory=list)


class ContentFileMeta(BaseModel):
    filename: str
    content_type: str
    size: int
    storage: Literal["inline", "gridfs"] = "inline"
    gridfs_file_id: str | None = None
    file_url: str | None = None
    data_base64: str | None = None


class ContentPieceOut(BaseModel):
    id: str
    kind: Literal["content_piece"]
    content_piece_id: str
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


def _to_content_out(doc: dict[str, Any]) -> ContentPieceOut:
    payload = serialize_content_document(doc)
    file_meta = payload.get("file")
    if isinstance(file_meta, dict):
        file_meta["file_url"] = f"/api/content/{payload.get('content_piece_id')}/file"
    return ContentPieceOut.model_validate(payload)


async def list_content_pieces() -> list[ContentPieceOut]:
    collection = get_content_collection()
    cursor = collection.find({"kind": "content_piece"}).sort("updated_at", -1)
    results: list[ContentPieceOut] = []
    async for doc in cursor:
        results.append(_to_content_out(doc))
    return results


async def get_content_piece(content_piece_id: str) -> ContentPieceOut:
    collection = get_content_collection()
    doc = await collection.find_one(
        {
            "kind": "content_piece",
            "content_piece_id": content_piece_id,
        }
    )
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
    return _to_content_out(doc)


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

    normalized_path = _normalize_content_path(payload.path)

    now = datetime.utcnow()
    document: dict[str, Any] = {
        "kind": "content_piece",
        "content_piece_id": _new_content_piece_id(),
        "path": normalized_path,
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create content",
        )
    return _to_content_out(doc)


async def upload_content_piece(
    path: str,
    title: str,
    file: UploadFile,
    description: str | None = None,
    tags: list[str] | None = None,
) -> ContentPieceOut:
    normalized_path = _normalize_content_path(path)

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    now = datetime.utcnow()
    content_piece_id = _new_content_piece_id()
    filename = file.filename or "uploaded-content"
    content_type = file.content_type or "application/octet-stream"
    is_inline = len(raw) <= settings.MONGODB_INLINE_FILE_MAX_BYTES

    file_doc: dict[str, Any]
    gridfs_file_id: ObjectId | None = None
    if is_inline:
        file_doc = {
            "filename": filename,
            "content_type": content_type,
            "size": len(raw),
            "storage": "inline",
            "gridfs_file_id": None,
            "data_base64": base64.b64encode(raw).decode("ascii"),
        }
    else:
        bucket = get_content_gridfs_bucket()
        gridfs_file_id = await bucket.upload_from_stream(
            filename=filename,
            source=raw,
            metadata={"content_piece_id": content_piece_id, "content_type": content_type},
        )
        file_doc = {
            "filename": filename,
            "content_type": content_type,
            "size": len(raw),
            "storage": "gridfs",
            "gridfs_file_id": str(gridfs_file_id),
            "data_base64": None,
        }

    document: dict[str, Any] = {
        "kind": "content_piece",
        "content_piece_id": content_piece_id,
        "path": normalized_path,
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
        if gridfs_file_id is not None:
            bucket = get_content_gridfs_bucket()
            await bucket.delete(gridfs_file_id)
        raise
    doc = await collection.find_one({"_id": result.inserted_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload content",
        )
    return _to_content_out(doc)


async def download_content_file(content_piece_id: str) -> StreamingResponse:
    collection = get_content_collection()
    doc = await collection.find_one(
        {"kind": "content_piece", "content_piece_id": content_piece_id}
    )
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

    file_meta = doc.get("file")
    if not isinstance(file_meta, dict):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    content_type = file_meta.get("content_type") or "application/octet-stream"
    filename = file_meta.get("filename") or f"{content_piece_id}.bin"
    headers = {"Content-Disposition": f'inline; filename="{filename}"'}
    storage = file_meta.get("storage", "inline")

    if storage == "gridfs":
        gridfs_file_id = file_meta.get("gridfs_file_id")
        if not gridfs_file_id or not ObjectId.is_valid(gridfs_file_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
        bucket = get_content_gridfs_bucket()
        grid_out = await bucket.open_download_stream(ObjectId(gridfs_file_id))
        raw = await grid_out.read()
        return StreamingResponse(BytesIO(raw), media_type=content_type, headers=headers)

    data_base64 = file_meta.get("data_base64")
    if not isinstance(data_base64, str):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    try:
        raw = base64.b64decode(data_base64)
    except (ValueError, binascii.Error) as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stored file data is corrupted",
        ) from exc
    return StreamingResponse(BytesIO(raw), media_type=content_type, headers=headers)


async def delete_content_piece(content_piece_id: str) -> None:
    collection = get_content_collection()
    doc = await collection.find_one(
        {
            "kind": "content_piece",
            "content_piece_id": content_piece_id,
        }
    )
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

    file_meta = doc.get("file")
    if isinstance(file_meta, dict) and file_meta.get("storage") == "gridfs":
        gridfs_file_id = file_meta.get("gridfs_file_id")
        if isinstance(gridfs_file_id, str) and ObjectId.is_valid(gridfs_file_id):
            bucket = get_content_gridfs_bucket()
            try:
                await bucket.delete(ObjectId(gridfs_file_id))
            except Exception:
                # Keep deletion resilient even if binary is already gone.
                pass

    result = await collection.delete_one(
        {
            "kind": "content_piece",
            "content_piece_id": content_piece_id,
        }
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
