"""Validation helpers for org manager operations."""

from fastapi import HTTPException

from src.models.org_manager_schemas import QuizQuestionPayload
from src.services.platform_admin import get_platform_admin_service


def validate_realm_access(token: str, realm: str) -> None:
    """Validate that the token's realm matches the requested realm."""
    token_realm = get_platform_admin_service()._realm_from_token(token)
    if token_realm and token_realm != realm:
        raise HTTPException(
            status_code=403,
            detail="Realm mismatch: token realm does not match requested realm.",
        )


def validate_question_bank(questions: list[QuizQuestionPayload]) -> list[dict]:
    if not questions:
        raise HTTPException(
            status_code=400, detail="Quiz question bank cannot be empty."
        )
    seen_ids: set[str] = set()
    for question in questions:
        if not question.id.strip():
            raise HTTPException(status_code=400, detail="Question id is required.")
        if question.id in seen_ids:
            raise HTTPException(
                status_code=400, detail=f"Duplicate question id: {question.id}"
            )
        seen_ids.add(question.id)
        if not question.prompt.strip():
            raise HTTPException(
                status_code=400, detail=f"Question '{question.id}' is missing a prompt."
            )
        if len(question.options) < 2:
            raise HTTPException(
                status_code=400,
                detail=f"Question '{question.id}' must have at least two options.",
            )
        if question.answer_index < 0 or question.answer_index >= len(question.options):
            raise HTTPException(
                status_code=400,
                detail=f"Question '{question.id}' has an invalid answer_index.",
            )
        if not question.feedback.strip():
            raise HTTPException(
                status_code=400,
                detail=f"Question '{question.id}' is missing feedback text.",
            )
    return [q.model_dump() for q in questions]


def quiz_score_options(question_count: int) -> list[int]:
    return sorted({int((i / question_count) * 100) for i in range(question_count + 1)})


def validate_quiz_settings(
    question_count: int | None, passing_score: int | None, bank_len: int
) -> tuple[int | None, int | None]:
    if question_count is not None and question_count <= 0:
        raise HTTPException(
            status_code=400, detail="Question count must be a positive integer."
        )
    if question_count is not None and question_count > bank_len:
        raise HTTPException(
            status_code=400,
            detail="Question count cannot exceed the number of questions in the bank.",
        )
    if passing_score is not None and not (0 <= passing_score <= 100):
        raise HTTPException(
            status_code=400, detail="Passing score must be between 0 and 100."
        )
    if (
        passing_score is not None
        and question_count is not None
        and passing_score not in quiz_score_options(question_count)
    ):
        raise HTTPException(
            status_code=400,
            detail="Passing score must match possible quiz outcomes.",
        )
    return question_count, passing_score
