from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from .document import Section, Difficulty


class ModuleCreate(BaseModel):
    """Body accepted by POST /modules."""
    title:              str                  = Field("",  max_length=300)
    category:           str                  = Field("",  max_length=100)
    description:        str                  = Field("",  max_length=2000)
    cover_image:        Optional[str]        = None
    estimated_time:     str                  = Field("",  max_length=10)
    difficulty:         Optional[Difficulty] = None
    has_refresh_module: bool                 = False
    sections:           list[Section]        = Field(default_factory=list)
    refresh_sections:   list[Section]        = Field(default_factory=list)


class ModuleUpdate(ModuleCreate):
    """Body accepted by PUT /modules/{id} — full replacement."""
    pass


class ModulePatch(BaseModel):
    """Body accepted by PATCH /modules/{id} — every field is optional."""
    title:              Optional[str]            = None
    category:           Optional[str]            = None
    description:        Optional[str]            = None
    cover_image:        Optional[str]            = None
    estimated_time:     Optional[str]            = None
    difficulty:         Optional[Difficulty]     = None
    has_refresh_module: Optional[bool]           = None
    sections:           Optional[list[Section]]  = None
    refresh_sections:   Optional[list[Section]]  = None


class ModuleOut(ModuleCreate):
    """Serialised form of a persisted module document."""
    id:          str                    # str(ObjectId)
    version:     int                    = 1
    realm:       Optional[str]          = None
    created_by:  Optional[str]          = None
    created_at:  datetime
    updated_at:  datetime


class PaginatedModules(BaseModel):
    items:   list[ModuleOut]
    total:   int
    page:    int
    limit:   int
    pages:   int
