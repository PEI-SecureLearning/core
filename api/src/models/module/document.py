"""
Pydantic models for the Learning Module document stored in MongoDB.

Collection  : modules
Primary key : _id  (ObjectId, serialised as `id: str` in API responses)
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


Block = Annotated[
    Union[TextBlock, RichContentBlock, QuestionBlock],
    Field(discriminator="kind"),
]


class Section(BaseModel):
    id:                      str          = Field(..., min_length=1)
    title:                   str          = ""
    order:                   int          = Field(..., ge=0)
    collapsed:               bool         = False
    require_correct_answers: bool         = False
    is_optional:             bool         = False
    min_time_spent:          int          = Field(0, ge=0)
    blocks:                  list[Block]  = Field(default_factory=list)
