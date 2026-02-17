from datetime import datetime
from typing import List

from pydantic import BaseModel


class Question(BaseModel):
    id: str
    prompt: str
    options: List[str]
    answer_index: int
    feedback: str


class ComplianceDocumentResponse(BaseModel):
    version: str
    title: str
    updated_at: datetime
    word_count: int
    content: str


class QuizQuestionResponse(BaseModel):
    id: str
    prompt: str
    options: List[str]


class QuizResponse(BaseModel):
    version: str
    required_score: int
    question_count: int
    cooldown_seconds: int
    questions: List[QuizQuestionResponse]


class Answer(BaseModel):
    id: str
    choice: int


class SubmitRequest(BaseModel):
    version: str
    answers: List[Answer]


class QuestionFeedback(BaseModel):
    id: str
    correct: bool
    feedback: str


class SubmitResponse(BaseModel):
    passed: bool
    score: int
    required_score: int
    cooldown_seconds_remaining: int
    feedback: List[QuestionFeedback]


class AcceptRequest(BaseModel):
    version: str
    score: int


class ComplianceStatusResponse(BaseModel):
    required_version: str
    accepted: bool
    accepted_at: datetime | None
    score: int | None
