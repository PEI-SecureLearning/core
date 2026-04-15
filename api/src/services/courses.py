"""
Service layer for Course CRUD operations.

All DB access goes through Motor (async MongoDB driver). Service functions
are intentionally thin — no HTTP concerns, no FastAPI imports.
"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from src.core.mongo import get_courses_collection
from src.models import (
    CourseCreate,
    CourseOut,
    CoursePatch,
    CourseUpdate,
    PaginatedCourses,
)

COURSE_NOT_FOUND = "Course not found"
_DEFAULT_PAGE_LIMIT = 20
_MAX_PAGE_LIMIT = 100


def _to_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Invalid course id: {id_str}",
        ) from exc


def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _doc_to_out(doc: dict[str, Any]) -> CourseOut:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return CourseOut.model_validate(doc)


# ── Query helpers ─────────────────────────────────────────────────────────────


def _apply_search(query: dict[str, Any], search: str | None) -> None:
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]


def _apply_category(query: dict[str, Any], category: str | None) -> None:
    if category:
        query["category"] = {"$regex": f"^{category}$", "$options": "i"}


def _apply_difficulty(query: dict[str, Any], difficulty: str | None) -> None:
    if difficulty:
        query["difficulty"] = difficulty


# ── Service functions ─────────────────────────────────────────────────────────


async def create_course(payload: CourseCreate, created_by: str) -> CourseOut:
    """Insert a new course document and return it."""
    now = _now()
    data = payload.model_dump()
    data.update(created_by=created_by, created_at=now, updated_at=now)

    col = get_courses_collection()
    result = await col.insert_one(data)
    data["_id"] = result.inserted_id
    print(_doc_to_out(data))
    return _doc_to_out(data)


async def list_courses(
    search: str | None = None,
    category: str | None = None,
    difficulty: str | None = None,
    page: int = 1,
    limit: int = _DEFAULT_PAGE_LIMIT,
) -> PaginatedCourses:
    """Return a paginated, filtered list of courses."""
    limit = min(limit, _MAX_PAGE_LIMIT)
    skip = (page - 1) * limit

    query: dict[str, Any] = {}
    _apply_search(query, search)
    _apply_category(query, category)
    _apply_difficulty(query, difficulty)

    col = get_courses_collection()
    total: int = await col.count_documents(query)
    cursor = col.find(query).sort("updated_at", -1).skip(skip).limit(limit)
    items = [_doc_to_out(doc) async for doc in cursor]

    return PaginatedCourses(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total else 0,
    )


async def list_enrolled_courses(course_ids: list[str]) -> list[CourseOut]:
    """Return a list of courses by their ObjectIds."""
    if not course_ids:
        return []

    oids = []
    for cid in course_ids:
        try:
            oids.append(ObjectId(cid))
        except (InvalidId, TypeError):
            pass

    if not oids:
        return []

    col = get_courses_collection()
    cursor = col.find({"_id": {"$in": oids}})
    items = [_doc_to_out(doc) async for doc in cursor]
    return items


async def get_course(course_id: str) -> CourseOut:
    """Fetch a single course by its ObjectId string."""
    col = get_courses_collection()
    doc = await col.find_one({"_id": _to_object_id(course_id)})
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=COURSE_NOT_FOUND
        )
    return _doc_to_out(doc)


async def update_course(course_id: str, payload: CourseUpdate) -> CourseOut:
    """Full replacement update (PUT)."""
    oid = _to_object_id(course_id)
    col = get_courses_collection()

    existing = await col.find_one({"_id": oid})
    if existing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=COURSE_NOT_FOUND
        )

    data = payload.model_dump()
    data["updated_at"] = _now()

    await col.update_one({"_id": oid}, {"$set": data})
    updated = await col.find_one({"_id": oid})
    return _doc_to_out(updated)  # type: ignore[arg-type]


async def patch_course(course_id: str, payload: CoursePatch) -> CourseOut:
    """Partial update (PATCH) — only sets fields present in the payload."""
    oid = _to_object_id(course_id)
    col = get_courses_collection()

    existing = await col.find_one({"_id": oid})
    if existing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=COURSE_NOT_FOUND
        )

    delta = payload.model_dump(exclude_unset=True)
    if not delta:
        return _doc_to_out(existing)

    delta["updated_at"] = _now()
    await col.update_one({"_id": oid}, {"$set": delta})
    updated = await col.find_one({"_id": oid})
    return _doc_to_out(updated)  # type: ignore[arg-type]


async def delete_course(course_id: str) -> None:
    """Hard-delete a course document."""
    oid = _to_object_id(course_id)
    col = get_courses_collection()

    existing = await col.find_one({"_id": oid})
    if existing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=COURSE_NOT_FOUND
        )

    await col.delete_one({"_id": oid})
