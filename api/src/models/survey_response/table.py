from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from sqlalchemy import Column, JSON
from sqlalchemy.dialects import postgresql
from sqlmodel import Field, SQLModel


class SurveyResponse(SQLModel, table=True):
    __tablename__ = "survey_response"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    course_id: str = Field(index=True)
    realm_name: Optional[str] = Field(default=None, index=True)
    answers: list[dict[str, Any]] = Field(
        default_factory=list,
        sa_column=Column(JSON().with_variant(postgresql.JSONB(), "postgresql")),
    )
    normalized_score: float = Field(default=0.0)
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
