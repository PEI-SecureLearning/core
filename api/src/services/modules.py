"""
Service layer for Learning Module CRUD operations.

All DB access goes through Motor (async MongoDB driver).  The service
functions are intentionally thin — no HTTP concerns, no FastAPI imports.
They raise plain Python exceptions when something goes wrong; the router
converts those to HTTPExceptions.
"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from src.core.mongo import get_modules_collection
from src.models.module import (
    ModuleCreate,
    ModuleOut,
    ModulePatch,
    ModuleStatus,
    ModuleUpdate,
    PaginatedModules,
)

MODULE_NOT_FOUND = "Module not found"
_DEFAULT_PAGE_LIMIT = 20
_MAX_PAGE_LIMIT = 100


def _to_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid module id: {id_str}",
        ) from exc


def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _doc_to_out(doc: dict[str, Any]) -> ModuleOut:
    """Convert a raw MongoDB document into a ModuleOut instance."""
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return ModuleOut.model_validate(doc)


def _build_mongo_doc(payload: ModuleCreate, realm: str, created_by: str) -> dict[str, Any]:
    """Serialise a ModuleCreate payload into the shape stored in Mongo."""
    now = _now()
    data = payload.model_dump()
    data.update(
        status=ModuleStatus.DRAFT,
        version=1,
        realm=realm,
        created_by=created_by,
        created_at=now,
        updated_at=now,
    )
    return data


_SORT_MAP: dict[str, list[tuple[str, int]]] = {
    "title_asc":  [("title", 1)],
    "title_desc": [("title", -1)],
    "newest":     [("updated_at", -1)],
    "oldest":     [("updated_at", 1)],
}
_DEFAULT_SORT = "newest"


async def list_modules(
    realm: str,
    status_filter: ModuleStatus | None = None,
    search: str | None = None,
    sort: str | None = None,
    page: int = 1,
    limit: int = _DEFAULT_PAGE_LIMIT,
) -> PaginatedModules:
    """Return a paginated list of modules scoped to a realm."""
    limit = min(limit, _MAX_PAGE_LIMIT)
    skip  = (page - 1) * limit

    query: dict[str, Any] = {"realm": realm}
    if status_filter is not None:
        query["status"] = status_filter
    if search:
        # Case-insensitive substring match on title or category
        query["$or"] = [
            {"title":    {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}},
        ]

    sort_spec = _SORT_MAP.get(sort or _DEFAULT_SORT, _SORT_MAP[_DEFAULT_SORT])

    col = get_modules_collection()
    total: int = await col.count_documents(query)
    cursor = (
        col.find(query, {"sections": 0, "refresh_sections": 0})   # skip heavy arrays in list view
        .sort(sort_spec)
        .skip(skip)
        .limit(limit)
    )
    # Re-attach empty lists so ModuleOut validates correctly
    items = [_doc_to_out({**doc, "sections": [], "refresh_sections": []}) async for doc in cursor]

    return PaginatedModules(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total else 0,
    )


async def get_module(module_id: str) -> ModuleOut:
    """Fetch a single module by its ObjectId string."""
    col = get_modules_collection()
    doc = await col.find_one({"_id": _to_object_id(module_id)})
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=MODULE_NOT_FOUND)
    return _doc_to_out(doc)


async def create_module(payload: ModuleCreate, realm: str, created_by: str) -> ModuleOut:
    """Insert a new module document and return it with its generated id."""
    col = get_modules_collection()
    doc = _build_mongo_doc(payload, realm=realm, created_by=created_by)
    result = await col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_out(doc)


async def update_module(module_id: str, payload: ModuleUpdate, realm: str) -> ModuleOut:
    """Full replacement update (PUT).  Bumps version counter."""
    oid = _to_object_id(module_id)
    col = get_modules_collection()

    existing = await col.find_one({"_id": oid, "realm": realm})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=MODULE_NOT_FOUND)

    data = payload.model_dump()
    data.update(
        updated_at=_now(),
        version=existing.get("version", 1) + 1,
    )

    await col.update_one({"_id": oid}, {"$set": data})
    updated = await col.find_one({"_id": oid})
    return _doc_to_out(updated)  # type: ignore[arg-type]


async def patch_module(module_id: str, payload: ModulePatch, realm: str) -> ModuleOut:
    """Partial update (PATCH) — only sets fields that are present in the payload."""
    oid = _to_object_id(module_id)
    col = get_modules_collection()

    existing = await col.find_one({"_id": oid, "realm": realm})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=MODULE_NOT_FOUND)

    # Only include fields that were explicitly provided (exclude_unset)
    delta = payload.model_dump(exclude_unset=True)
    if not delta:
        # Nothing to change — return as-is to avoid a spurious DB round-trip
        return _doc_to_out(existing)

    delta["updated_at"] = _now()
    delta["version"]    = existing.get("version", 1) + 1

    await col.update_one({"_id": oid}, {"$set": delta})
    updated = await col.find_one({"_id": oid})
    return _doc_to_out(updated)  # type: ignore[arg-type]


async def publish_module(module_id: str, realm: str) -> ModuleOut:
    """Transition a module from draft → published.

    Validates that all required fields are filled before allowing the transition.
    This is the enforcement point for fields that are optional on create (draft-first).
    """
    oid = _to_object_id(module_id)
    col = get_modules_collection()

    existing = await col.find_one({"_id": oid, "realm": realm})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=MODULE_NOT_FOUND)
    if existing.get("status") == ModuleStatus.ARCHIVED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Archived modules cannot be published directly. Un-archive first.",
        )

    # ── Readiness checks (draft-first: required fields validated here, not on create) ──
    missing: list[str] = []
    if not existing.get("title", "").strip():
        missing.append("title")
    if not existing.get("category", "").strip():
        missing.append("category")
    if not existing.get("estimated_time", "").strip():
        missing.append("estimated_time")
    if not existing.get("difficulty"):
        missing.append("difficulty")
    if not existing.get("sections"):
        missing.append("sections (at least one required)")
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Module is not ready to publish", "missing_fields": missing},
        )

    await col.update_one(
        {"_id": oid},
        {"$set": {"status": ModuleStatus.PUBLISHED, "updated_at": _now()}},
    )
    updated = await col.find_one({"_id": oid})
    return _doc_to_out(updated)  # type: ignore[arg-type]


async def archive_module(module_id: str, realm: str) -> ModuleOut:
    """Transition a module to archived status."""
    oid = _to_object_id(module_id)
    col = get_modules_collection()

    existing = await col.find_one({"_id": oid, "realm": realm})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=MODULE_NOT_FOUND)

    await col.update_one(
        {"_id": oid},
        {"$set": {"status": ModuleStatus.ARCHIVED, "updated_at": _now()}},
    )
    updated = await col.find_one({"_id": oid})
    return _doc_to_out(updated)  # type: ignore[arg-type]


async def delete_module(module_id: str, realm: str) -> None:
    """Hard-delete a module document.  Only drafts and archived modules may be deleted."""
    oid = _to_object_id(module_id)
    col = get_modules_collection()

    existing = await col.find_one({"_id": oid, "realm": realm})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=MODULE_NOT_FOUND)
    if existing.get("status") == ModuleStatus.PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Published modules cannot be deleted. Archive them first.",
        )

    await col.delete_one({"_id": oid})
