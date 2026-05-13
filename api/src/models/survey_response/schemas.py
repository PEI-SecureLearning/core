from datetime import datetime

from sqlmodel import SQLModel


class SurveyResponseCreate(SQLModel):
    user_id: str
    course_id: str
    realm_name: str | None = None
    answers: list[dict]


class SurveyResponseRead(SurveyResponseCreate):
    id: int
    normalized_score: float
    submitted_at: datetime
