"""Compliance quiz business logic — versioning, scoring, cooldowns, evaluation."""

import hashlib
import json
import random
from datetime import UTC, datetime
from typing import Dict, List, Tuple

from fastapi import HTTPException, status
from sqlmodel import Session, select

from src.models import ComplianceAcceptance, TenantComplianceQuiz
from src.models.compliance_schemas import (
    Answer,
    ComplianceDocumentResponse,
    ComplianceStatusResponse,
    Question,
    QuestionFeedback,
    QuizQuestionResponse,
    QuizResponse,
    SubmitResponse,
)
from src.services.compliance import DEFAULT_PASSING_SCORE
from src.services.compliance import ensure_tenant_policy, ensure_tenant_quiz


COOLDOWN_SECONDS = 60

# Simple in-memory cooldown tracker: (user_id, version) -> last_failed_at
_cooldowns: Dict[Tuple[str, str], datetime] = {}


def compute_version(
    content: str, quiz_bank: list[dict], passing_score: int, question_count: int
) -> str:
    payload = {
        "content": content,
        "quiz": quiz_bank,
        "passing_score": passing_score,
        "question_count": question_count,
    }
    serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def extract_title(content: str) -> str:
    for line in content.splitlines():
        if line.startswith("#"):
            return line.lstrip("#").strip()
    return "Compliance Policy"


def _utcnow() -> datetime:
    """Return a naive UTC datetime (backwards compatible with existing schema)."""
    return datetime.now(UTC).replace(tzinfo=None)


def question_bank_from_record(record: TenantComplianceQuiz) -> List[Question]:
    try:
        return [Question(**q) for q in (record.question_bank or [])]
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail="Invalid quiz data stored for tenant."
        ) from exc


def select_questions(
    question_bank: List[Question], question_count: int
) -> List[Question]:
    if len(question_bank) <= question_count:
        return question_bank.copy()
    return random.SystemRandom().sample(question_bank, question_count)


def score_options(question_count: int) -> list[int]:
    return sorted({int((i / question_count) * 100) for i in range(question_count + 1)})


def normalize_quiz_settings(
    question_count: int | None, passing_score: int | None, bank_len: int
) -> tuple[int, int]:
    effective_count = max(1, min(question_count or 1, max(1, bank_len)))
    options = score_options(effective_count)
    base_score = passing_score if passing_score is not None else DEFAULT_PASSING_SCORE
    if base_score in options:
        return effective_count, base_score
    closest = min(options, key=lambda s: abs(s - base_score))
    return effective_count, closest


def enforce_version(expected: str, provided: str) -> None:
    if provided != expected:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Outdated compliance version. Refresh and retry.",
        )


def enforce_cooldown(user_id: str, version: str) -> datetime:
    cooldown_key = (user_id, version)
    now = _utcnow()
    last_failed_at = _cooldowns.get(cooldown_key)
    if last_failed_at:
        remaining = COOLDOWN_SECONDS - int((now - last_failed_at).total_seconds())
        if remaining > 0:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining} seconds before retrying the quiz.",
            )
    return now


def evaluate_answers(
    answers: List[Answer], question_map: dict[str, Question], required_count: int
) -> tuple[int, int, List[QuestionFeedback]]:
    if len(answers) < required_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not enough answers provided.",
        )

    correct = 0
    feedback: List[QuestionFeedback] = []
    evaluated_questions: set[str] = set()

    for ans in answers:
        question = question_map.get(ans.id)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown question id: {ans.id}",
            )
        if ans.id in evaluated_questions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Duplicate answer for question id: {ans.id}",
            )
        evaluated_questions.add(ans.id)

        is_correct = ans.choice == question.answer_index
        if is_correct:
            correct += 1
        feedback.append(
            QuestionFeedback(id=ans.id, correct=is_correct, feedback=question.feedback)
        )

    total = len(answers)
    return correct, total, feedback


def record_cooldown(user_id: str, version: str, now: datetime) -> None:
    """Record a failed quiz attempt for cooldown tracking."""
    _cooldowns[(user_id, version)] = now


def clear_cooldown(user_id: str, version: str) -> None:
    """Clear cooldown after a successful quiz attempt."""
    _cooldowns.pop((user_id, version), None)


# ======================================================================
# High-level operations used directly by the router
# ======================================================================


def get_latest_compliance(session: Session, tenant: str) -> ComplianceDocumentResponse:
    policy = ensure_tenant_policy(session, tenant)
    quiz = ensure_tenant_quiz(session, tenant)
    content = policy.content_md
    question_count, passing_score = normalize_quiz_settings(
        quiz.question_count, quiz.passing_score, len(quiz.question_bank or [])
    )
    version = compute_version(
        content, quiz.question_bank or [], passing_score, question_count
    )
    title = extract_title(content)
    word_count = len(content.split())
    return ComplianceDocumentResponse(
        version=version,
        title=title,
        updated_at=policy.updated_at,
        word_count=word_count,
        content=content,
    )


def get_latest_quiz(session: Session, tenant: str) -> QuizResponse:
    policy = ensure_tenant_policy(session, tenant)
    quiz = ensure_tenant_quiz(session, tenant)
    bank = question_bank_from_record(quiz)
    question_count, passing_score = normalize_quiz_settings(
        quiz.question_count, quiz.passing_score, len(bank)
    )
    selected = select_questions(bank, question_count)
    version = compute_version(
        policy.content_md, quiz.question_bank or [], passing_score, question_count
    )
    return QuizResponse(
        version=version,
        required_score=passing_score,
        question_count=len(selected),
        cooldown_seconds=COOLDOWN_SECONDS,
        questions=[
            QuizQuestionResponse(id=q.id, prompt=q.prompt, options=q.options)
            for q in selected
        ],
    )


def submit_quiz(
    session: Session, tenant: str, user_id: str, version: str, answers: List[Answer]
) -> SubmitResponse:
    policy = ensure_tenant_policy(session, tenant)
    quiz = ensure_tenant_quiz(session, tenant)
    question_count, passing_score = normalize_quiz_settings(
        quiz.question_count, quiz.passing_score, len(quiz.question_bank or [])
    )
    expected_version = compute_version(
        policy.content_md, quiz.question_bank or [], passing_score, question_count
    )
    enforce_version(expected_version, version)
    now = enforce_cooldown(user_id, version)

    bank = question_bank_from_record(quiz)
    question_map = {q.id: q for q in bank}
    required_answers = min(question_count, len(bank))
    correct, total, feedback = evaluate_answers(answers, question_map, required_answers)
    score_val = int((correct / total) * 100) if total else 0
    passed = score_val >= passing_score

    if not passed:
        record_cooldown(user_id, version, now)
    else:
        clear_cooldown(user_id, version)

    remaining_cooldown = COOLDOWN_SECONDS if not passed else 0

    return SubmitResponse(
        passed=passed,
        score=score_val,
        required_score=passing_score,
        cooldown_seconds_remaining=remaining_cooldown,
        feedback=feedback,
    )


def get_compliance_status(
    session: Session, tenant: str, user_id: str
) -> ComplianceStatusResponse:
    policy = ensure_tenant_policy(session, tenant)
    quiz = ensure_tenant_quiz(session, tenant)
    question_count, passing_score = normalize_quiz_settings(
        quiz.question_count, quiz.passing_score, len(quiz.question_bank or [])
    )
    version = compute_version(
        policy.content_md, quiz.question_bank or [], passing_score, question_count
    )

    stmt = select(ComplianceAcceptance).where(
        ComplianceAcceptance.user_identifier == user_id,
        ComplianceAcceptance.tenant == tenant,
        ComplianceAcceptance.version == version,
    )
    record = session.exec(stmt).first()

    return ComplianceStatusResponse(
        required_version=version,
        accepted=record is not None,
        accepted_at=record.accepted_at if record else None,
        score=record.score if record else None,
    )


def accept_compliance(
    session: Session, tenant: str, user_id: str, version: str, score: int
) -> dict:
    policy = ensure_tenant_policy(session, tenant)
    quiz = ensure_tenant_quiz(session, tenant)
    question_count, passing_score = normalize_quiz_settings(
        quiz.question_count, quiz.passing_score, len(quiz.question_bank or [])
    )
    expected_version = compute_version(
        policy.content_md, quiz.question_bank or [], passing_score, question_count
    )
    if version != expected_version:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Outdated compliance version. Refresh and retry.",
        )

    if score < passing_score:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz must be passed before acceptance.",
        )

    stmt = select(ComplianceAcceptance).where(
        ComplianceAcceptance.user_identifier == user_id,
        ComplianceAcceptance.tenant == tenant,
        ComplianceAcceptance.version == version,
    )
    existing = session.exec(stmt).first()
    now = _utcnow()

    if existing:
        existing.accepted_at = now
        existing.score = score
        session.add(existing)
    else:
        record = ComplianceAcceptance(
            user_identifier=user_id,
            tenant=tenant,
            version=version,
            score=score,
            accepted_at=now,
        )
        session.add(record)

    session.commit()
    return {"status": "accepted", "version": version, "accepted_at": now}
