from datetime import datetime

from pydantic import BaseModel


class CourseEnrollmentPayload(BaseModel):
    course_ids: list[str]
    start_date: datetime | None = None
    deadline: datetime | None = None


class OrgUserCreate(BaseModel):
    username: str
    name: str
    email: str
    role: str
    group_id: str | None = None


class OrgGroupCreate(BaseModel):
    name: str


class CompliancePolicyPayload(BaseModel):
    content_md: str


class QuizQuestionPayload(BaseModel):
    id: str
    prompt: str
    options: list[str]
    answer_index: int
    feedback: str


class ComplianceQuizPayload(BaseModel):
    question_bank: list[QuizQuestionPayload]
    question_count: int | None = None
    passing_score: int | None = None


class CompliancePolicyResponse(BaseModel):
    tenant: str
    content_md: str
    updated_at: datetime
    updated_by: str | None = None


class ComplianceQuizResponse(BaseModel):
    tenant: str
    question_bank: list[QuizQuestionPayload]
    question_count: int
    passing_score: int
    updated_at: datetime
    updated_by: str | None = None
