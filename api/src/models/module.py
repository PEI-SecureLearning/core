"""
Pydantic models for the Learning Module document stored in MongoDB.

Collection  : modules
Primary key : _id  (ObjectId, serialised as `id: str` in API responses)

Document shape (abridged):
    {
      "_id":            ObjectId,
      "title":          str,
      "category":       str,
      "description":    str,
      "cover_image":    str | None,
      "estimated_time": str,          # "45" → minutes as a string (matches frontend)
      "difficulty":     "Easy" | "Medium" | "Hard",
      "status":         "draft" | "published" | "archived",
      "version":        int,          # optimistic concurrency counter
      "realm":          str,          # Keycloak realm — multi-tenancy key
      "created_by":     str,          # Keycloak user sub
      "created_at":     datetime,
      "updated_at":     datetime,
      "has_refresh_module": bool,
      "sections":        [ Section ],
      "refresh_sections":[ Section ],
    }

Block discriminator field : `kind`  ("text" | "rich_content" | "question")
"""

from datetime import datetime
from enum import StrEnum
from typing import Annotated, Literal, Optional, Union

from pydantic import BaseModel, Field


class ModuleStatus(StrEnum):
    DRAFT     = "draft"
    PUBLISHED = "published"
    ARCHIVED  = "archived"


class Difficulty(StrEnum):
    EASY   = "Easy"
    MEDIUM = "Medium"
    HARD   = "Hard"


class QuestionType(StrEnum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE      = "true_false"
    SHORT_ANSWER    = "short_answer"


class RichMediaType(StrEnum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    FILE  = "file"


class Choice(BaseModel):
    id:         str = Field(..., min_length=1)
    text:       str = Field(..., min_length=1)
    is_correct: bool


class QuestionModel(BaseModel):
    id:      str         = Field(..., min_length=1)
    type:    QuestionType
    text:    str         = Field(..., min_length=1)
    choices: list[Choice] = Field(default_factory=list)
    # For short_answer blocks the expected answer is stored here.
    # For true/false and multiple_choice it is left empty — correctness
    # is determined by the `is_correct` flag on the choices.
    answer:  str         = ""


class TextBlock(BaseModel):
    id:      str             = Field(..., min_length=1)
    kind:    Literal["text"]
    order:   int             = Field(..., ge=0)
    content: str             = ""


class RichContentBlock(BaseModel):
    id:         str                    = Field(..., min_length=1)
    kind:       Literal["rich_content"]
    order:      int                    = Field(..., ge=0)
    media_type: RichMediaType
    url:        str                    = ""
    caption:    str                    = ""


class QuestionBlock(BaseModel):
    id:       str               = Field(..., min_length=1)
    kind:     Literal["question"]
    order:    int               = Field(..., ge=0)
    question: QuestionModel


# Annotated union — FastAPI / Pydantic uses `kind` to pick the right model.
Block = Annotated[
    Union[TextBlock, RichContentBlock, QuestionBlock],
    Field(discriminator="kind"),
]


class Section(BaseModel):
    id:                      str          = Field(..., min_length=1)
    title:                   str          = ""
    order:                   int          = Field(..., ge=0)
    # `collapsed` is a pure UI hint; stored so the frontend can restore
    # the last open/closed state, but never used by backend logic.
    collapsed:               bool         = False
    require_correct_answers: bool         = False
    is_optional:             bool         = False
    # Minimum number of seconds the user must spend on this section.
    min_time_spent:          int          = Field(0, ge=0)
    blocks:                  list[Block]  = Field(default_factory=list)


class ModuleCreate(BaseModel):
    """Body accepted by POST /modules.

    All fields are optional so the frontend can create a bare draft document
    on the first auto-save keystroke without requiring the user to have filled
    in every field first.  Validation that required fields are present before
    publish is enforced by the `publish_module` service function.
    """
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
    status:             Optional[ModuleStatus]   = None
    has_refresh_module: Optional[bool]           = None
    sections:           Optional[list[Section]]  = None
    refresh_sections:   Optional[list[Section]]  = None


class ModuleOut(ModuleCreate):
    """Serialised form of a persisted module document."""
    id:          str                    # str(ObjectId)
    status:      ModuleStatus           = ModuleStatus.DRAFT
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
