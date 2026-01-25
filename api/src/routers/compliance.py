import hashlib
import json
import random
from datetime import UTC, datetime
from typing import Dict, List, Tuple

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import select

from src.core.deps import SessionDep
from src.core.security import oauth_2_scheme
from src.models import ComplianceAcceptance, TenantComplianceQuiz
from src.services.compliance_defaults import DEFAULT_PASSING_SCORE
from src.services.compliance_store import ensure_tenant_policy, ensure_tenant_quiz

router = APIRouter()

# Constants
COOLDOWN_SECONDS = 60

# Simple in-memory cooldown tracker: (user_id, version) -> last_failed_at
_cooldowns: Dict[Tuple[str, str], datetime] = {}


# Question bank derived from Compliance1.md (stored in DB per tenant)
class Question(BaseModel):
    id: str
    prompt: str
    options: List[str]
    answer_index: int  # kept server-side
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


def _compute_version(
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


def _extract_title(content: str) -> str:
    for line in content.splitlines():
        if line.startswith("#"):
            return line.lstrip("#").strip()
    return "Compliance Policy"


def _get_user_and_tenant(token: str) -> Tuple[str, str | None]:
    try:
        claims = jwt.decode(
            token, options={"verify_signature": False, "verify_aud": False}
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from exc

    user_identifier = (
        claims.get("preferred_username") or claims.get("email") or claims.get("sub")
    )
    if not user_identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to resolve user identifier from token",
        )

    iss = claims.get("iss")
    tenant = None
    if iss and "/realms/" in iss:
        tenant = iss.split("/realms/")[-1]
    tenant = claims.get("tenant", tenant)
    return user_identifier, tenant


def _require_tenant(tenant: str | None) -> str:
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant could not be resolved from token.",
        )
    return tenant


def _utcnow() -> datetime:
    """Return a naive UTC datetime (backwards compatible with existing schema)."""
    return datetime.now(UTC).replace(tzinfo=None)


def _question_bank_from_record(record: TenantComplianceQuiz) -> List[Question]:
    try:
        return [Question(**q) for q in (record.question_bank or [])]
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail="Invalid quiz data stored for tenant."
        ) from exc


def _select_questions(
    question_bank: List[Question], question_count: int
) -> List[Question]:
    if len(question_bank) <= question_count:
        return question_bank.copy()
    return random.sample(question_bank, question_count)


def _score_options(question_count: int) -> list[int]:
    return sorted({int((i / question_count) * 100) for i in range(question_count + 1)})


def _normalize_quiz_settings(
    question_count: int | None, passing_score: int | None, bank_len: int
) -> tuple[int, int]:
    effective_count = max(1, min(question_count or 1, max(1, bank_len)))
    options = _score_options(effective_count)
    base_score = passing_score if passing_score is not None else DEFAULT_PASSING_SCORE
    if base_score in options:
        return effective_count, base_score
    # Choose the closest allowed score to avoid unexpected failures
    closest = min(options, key=lambda score: abs(score - base_score))
    return effective_count, closest


def _enforce_version(expected: str, provided: str) -> None:
    if provided != expected:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Outdated compliance version. Refresh and retry.",
        )


def _enforce_cooldown(user_id: str, version: str) -> datetime:
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


def _evaluate_answers(
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


@router.get("/compliance/latest", response_model=ComplianceDocumentResponse)
def get_latest_compliance(
    session: SessionDep, token: str = Depends(oauth_2_scheme)
):
    _, tenant = _get_user_and_tenant(token)
    tenant = _require_tenant(tenant)

    policy = ensure_tenant_policy(session, tenant)
    quiz = ensure_tenant_quiz(session, tenant)
    content = policy.content_md
    question_count, passing_score = _normalize_quiz_settings(
        quiz.question_count, quiz.passing_score, len(quiz.question_bank or [])
    )
    version = _compute_version(
        content,
        quiz.question_bank or [],
        passing_score,
        question_count,
    )
    title = _extract_title(content)
    word_count = len(content.split())
    return ComplianceDocumentResponse(
        version=version,
        title=title,
        updated_at=policy.updated_at,
        word_count=word_count,
        content=content,
    )


@router.get("/compliance/latest/quiz", response_model=QuizResponse)
def get_latest_quiz(session: SessionDep, token: str = Depends(oauth_2_scheme)):
    _, tenant = _get_user_and_tenant(token)
    tenant = _require_tenant(tenant)

    policy = ensure_tenant_policy(session, tenant)
    quiz = ensure_tenant_quiz(session, tenant)
    question_bank = _question_bank_from_record(quiz)
    question_count, passing_score = _normalize_quiz_settings(
        quiz.question_count, quiz.passing_score, len(question_bank)
    )
    selected = _select_questions(question_bank, question_count)
    version = _compute_version(
        policy.content_md,
        quiz.question_bank or [],
        passing_score,
        question_count,
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


@router.post("/compliance/submit", response_model=SubmitResponse)
def submit_quiz(
    payload: SubmitRequest, session: SessionDep, token: str = Depends(oauth_2_scheme)
):
    user_id, tenant = _get_user_and_tenant(token)
    tenant = _require_tenant(tenant)

    policy = ensure_tenant_policy(session, tenant)
    quiz = ensure_tenant_quiz(session, tenant)
    question_count, passing_score = _normalize_quiz_settings(
        quiz.question_count, quiz.passing_score, len(quiz.question_bank or [])
    )
    version = _compute_version(
        policy.content_md,
        quiz.question_bank or [],
        passing_score,
        question_count,
    )
    _enforce_version(version, payload.version)
    now = _enforce_cooldown(user_id, version)

    question_bank = _question_bank_from_record(quiz)
    question_map = {q.id: q for q in question_bank}
    required_answers = min(question_count, len(question_bank))
    correct, total, feedback = _evaluate_answers(
        payload.answers, question_map, required_answers
    )
    score = int((correct / total) * 100) if total else 0
    passed = score >= passing_score

    cooldown_key = (user_id, version)
    if not passed:
        _cooldowns[cooldown_key] = now
    else:
        _cooldowns.pop(cooldown_key, None)

    remaining_cooldown = 0
    if not passed:
        remaining_cooldown = COOLDOWN_SECONDS

    return SubmitResponse(
        passed=passed,
        score=score,
        required_score=passing_score,
        cooldown_seconds_remaining=remaining_cooldown,
        feedback=feedback,
    )


@router.get("/compliance/status", response_model=ComplianceStatusResponse)
def get_compliance_status(session: SessionDep, token: str = Depends(oauth_2_scheme)):
    user_id, tenant = _get_user_and_tenant(token)
    tenant = _require_tenant(tenant)
    policy = ensure_tenant_policy(session, tenant)
    quiz = ensure_tenant_quiz(session, tenant)
    question_count, passing_score = _normalize_quiz_settings(
        quiz.question_count, quiz.passing_score, len(quiz.question_bank or [])
    )
    version = _compute_version(
        policy.content_md,
        quiz.question_bank or [],
        passing_score,
        question_count,
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


@router.post("/compliance/accept", status_code=status.HTTP_201_CREATED)
def accept_compliance(
    payload: AcceptRequest, session: SessionDep, token: str = Depends(oauth_2_scheme)
):
    user_id, tenant = _get_user_and_tenant(token)
    tenant = _require_tenant(tenant)
    policy = ensure_tenant_policy(session, tenant)
    quiz = ensure_tenant_quiz(session, tenant)
    question_count, passing_score = _normalize_quiz_settings(
        quiz.question_count, quiz.passing_score, len(quiz.question_bank or [])
    )
    version = _compute_version(
        policy.content_md,
        quiz.question_bank or [],
        passing_score,
        question_count,
    )
    if payload.version != version:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Outdated compliance version. Refresh and retry.",
        )

    if payload.score < passing_score:
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
        existing.score = payload.score
        session.add(existing)
    else:
        record = ComplianceAcceptance(
            user_identifier=user_id,
            tenant=tenant,
            version=version,
            score=payload.score,
            accepted_at=now,
        )
        session.add(record)

    session.commit()
    return {"status": "accepted", "version": version, "accepted_at": now}
