from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class SurveyQuestion(BaseModel):
    id: str
    prompt: str
    options: list[str]
    reverse_scored: bool = False
    weight: float = Field(default=1.0, ge=0.0)


class SurveyTemplateOut(BaseModel):
    id: str | None = None
    survey_type: str
    realm_name: str | None = None
    course_id: str | None = None
    title: str
    description: str | None = None
    questions: list[SurveyQuestion]
    updated_at: datetime | None = None


class SurveyAnswer(BaseModel):
    id: str
    choice: int = Field(ge=0)


class SurveySubmissionResult(BaseModel):
    normalized_score: float
    survey_response_id: int | None = None
    user_id: str
    course_id: str
    realm_name: str | None = None
