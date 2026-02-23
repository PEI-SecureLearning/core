import base64
from datetime import datetime
from typing import Any, Literal
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from src.core.mongo import get_content_collection, serialize_content_document


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


async def list_content_pieces() -> list[ContentPieceOut]:
    collection = get_content_collection()
    cursor = collection.find({"kind": "content_piece"}).sort("updated_at", -1)
    results: list[ContentPieceOut] = []
    async for doc in cursor:
        results.append(ContentPieceOut.model_validate(serialize_content_document(doc)))
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
    return ContentPieceOut.model_validate(serialize_content_document(doc))


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
    return ContentPieceOut.model_validate(serialize_content_document(doc))


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
    file_doc = {
        "filename": file.filename or "uploaded-content",
        "content_type": file.content_type or "application/octet-stream",
        "size": len(raw),
        "data_base64": base64.b64encode(raw).decode("ascii"),
    }
    document: dict[str, Any] = {
        "kind": "content_piece",
        "content_piece_id": _new_content_piece_id(),
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
    result = await collection.insert_one(document)
    doc = await collection.find_one({"_id": result.inserted_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload content",
        )
    return ContentPieceOut.model_validate(serialize_content_document(doc))


async def delete_content_piece(content_piece_id: str) -> None:
    collection = get_content_collection()
    result = await collection.delete_one(
        {
            "kind": "content_piece",
            "content_piece_id": content_piece_id,
        }
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
