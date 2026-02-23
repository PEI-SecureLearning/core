from __future__ import annotations

from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection

from src.core.settings import settings

_client: AsyncIOMotorClient | None = None


def _get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.MONGODB_URI)
    return _client


def get_templates_collection() -> AsyncIOMotorCollection:
    client = _get_client()
    db = client[settings.MONGODB_DB]
    return db[settings.MONGODB_COLLECTION_TEMPLATES]


def get_tenant_logos_collection() -> AsyncIOMotorCollection:
    client = _get_client()
    db = client[settings.MONGODB_DB]
    return db[settings.MONGODB_COLLECTION_TENANT_LOGOS]


def get_content_collection() -> AsyncIOMotorCollection:
    client = _get_client()
    db = client[settings.MONGODB_DB]
    return db[settings.MONGODB_COLLECTION_CONTENT]


async def close_mongo_client() -> None:
    """Close the Mongo client when the app shuts down."""
    global _client
    if _client is not None:
        _client.close()
        _client = None


def to_object_id(id_str: str) -> ObjectId:
    if not ObjectId.is_valid(id_str):
        raise ValueError("Invalid template id")
    return ObjectId(id_str)


def serialize_document(doc: dict[str, Any]) -> dict[str, Any]:
    """Convert Mongo document into a JSON-serializable dict."""
    return {
        "id": str(doc.get("_id", "")),
        "name": doc.get("name"),
        "path": doc.get("path"),
        "subject": doc.get("subject"),
        "category": doc.get("category"),
        "description": doc.get("description"),
        "html": doc.get("html"),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }


def serialize_logo_document(doc: dict[str, Any]) -> dict[str, Any]:
    """Convert tenant logo document into a JSON-serializable dict."""
    return {
        "id": str(doc.get("_id", "")),
        "realm": doc.get("realm"),
        "filename": doc.get("filename"),
        "content_type": doc.get("content_type"),
        "size": doc.get("size"),
        "updated_at": doc.get("updated_at"),
    }


def serialize_content_document(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(doc.get("_id", "")),
        "kind": doc.get("kind"),
        "content_piece_id": doc.get("content_piece_id"),
        "path": doc.get("path"),
        "title": doc.get("title"),
        "description": doc.get("description"),
        "content_format": doc.get("content_format"),
        "body": doc.get("body"),
        "source_url": doc.get("source_url"),
        "tags": doc.get("tags", []),
        "file": doc.get("file"),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }
