"""
Pydantic models for the Course document stored in MongoDB.

Collection  : courses
Primary key : _id  (ObjectId, serialised as `id: str` in API responses)
"""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Optional

from pydantic import BaseModel, Field


class CourseDifficulty(StrEnum):
    EASY   = "Easy"
    MEDIUM = "Medium"
    HARD   = "Hard"


# ── Request models ────────────────────────────────────────────────────────────

class CourseCreate(BaseModel):
    title:         str             = Field(..., min_length=1, max_length=200)
    description:   str             = Field(..., max_length=1000)
    category:      str             = Field(..., min_length=1, max_length=100)
    difficulty:    CourseDifficulty
    expected_time: str             = Field(..., min_length=1, max_length=50)
    cover_image:   Optional[str]   = Field(None, description="content_piece_id of the cover image")
    modules:       list[str]       = Field(default_factory=list, description="Ordered list of module ObjectId hex strings")


class CourseUpdate(CourseCreate):
    """Full replacement — same shape as create."""


class CoursePatch(BaseModel):
    """Partial update — all fields optional."""
    title:         Optional[str]             = None
    description:   Optional[str]             = None
    category:      Optional[str]             = None
    difficulty:    Optional[CourseDifficulty] = None
    expected_time: Optional[str]             = None
    cover_image:   Optional[str]             = None
    modules:       Optional[list[str]]       = None


# ── Response model ────────────────────────────────────────────────────────────

class CourseOut(BaseModel):
    id:              str
    title:           str
    description:     str
    category:        str
    difficulty:      CourseDifficulty
    expected_time:   str
    cover_image:     Optional[str]   = None   # content_piece_id — frontend resolves presigned URL
    modules:         list[str]       = Field(default_factory=list)
    created_by:      Optional[str]   = None
    created_at:      datetime
    updated_at:      datetime


class PaginatedCourses(BaseModel):
    items: list[CourseOut]
    total: int
    page:  int
    limit: int
    pages: int
