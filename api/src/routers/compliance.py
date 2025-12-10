import hashlib
import random
from datetime import datetime, timedelta
from importlib import resources
from typing import Dict, List, Tuple

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from src.core.deps import SessionDep
from src.core.security import oauth_2_scheme
from src.models import ComplianceAcceptance

router = APIRouter()

# Constants
RESOURCE_PACKAGE = "src.resources"
RESOURCE_NAME = "compliance.md"
PASSING_SCORE = 80
QUESTION_COUNT = 5
COOLDOWN_SECONDS = 60

# Simple in-memory cooldown tracker: (user_id, version) -> last_failed_at
_cooldowns: Dict[Tuple[str, str], datetime] = {}


# Question bank derived from Compliance1.md
class Question(BaseModel):
    id: str
    prompt: str
    options: List[str]
    answer_index: int  # kept server-side
    feedback: str


QUESTION_BANK: List[Question] = [
    Question(
        id="device-auth",
        prompt="Which control is mandatory for devices used for company work?",
        options=[
            "Guest Wi-Fi access",
            "Strong authentication (passwords/PIN/biometric)",
            "No lock screen",
            "Public hotspot auto-connect",
        ],
        answer_index=1,
        feedback="Devices must be protected with strong authentication (password, PIN, biometrics).",
    ),
    Question(
        id="vpn-public",
        prompt="When on public or untrusted networks, what is required?",
        options=[
            "Nothing special, public Wi‑Fi is fine",
            "Use a company-approved VPN at all times",
            "Disable the lock screen",
            "Share credentials over email",
        ],
        answer_index=1,
        feedback="Always use the company-approved VPN when on public/untrusted networks.",
    ),
    Question(
        id="auto-wifi",
        prompt="What should be disabled regarding Wi‑Fi on public hotspots?",
        options=[
            "Wi‑Fi entirely",
            "Automatic connection to known public hotspots",
            "VPN",
            "Antivirus updates",
        ],
        answer_index=1,
        feedback="Disable automatic connection to known public hotspots to avoid unsafe access.",
    ),
    Question(
        id="data-storage",
        prompt="Where is it forbidden to store company data?",
        options=[
            "Approved cloud platforms or VPN-protected servers",
            "Local folders on unapproved personal devices",
            "Company servers via VPN",
            "Authorized web portals",
        ],
        answer_index=1,
        feedback="Do not store company data on unapproved personal devices or local folders.",
    ),
    Question(
        id="personal-cloud",
        prompt="What is the rule about syncing company data to personal cloud accounts?",
        options=[
            "Allowed if password-protected",
            "Allowed with manager approval only",
            "Not allowed unless explicitly approved",
            "Always allowed",
        ],
        answer_index=2,
        feedback="Syncing to personal cloud (e.g., Dropbox/iCloud) is not allowed without explicit approval.",
    ),
    Question(
        id="incident-report",
        prompt="What must you do if a device is lost or information is suspected compromised?",
        options=[
            "Wait 24 hours",
            "Report immediately to the Information Security team",
            "Try to fix it yourself",
            "Ignore unless confirmed breach",
        ],
        answer_index=1,
        feedback="Incidents must be reported immediately to the Information Security team.",
    ),
    Question(
        id="screen-visibility",
        prompt="What is required for a secure workspace setup at home?",
        options=[
            "Screens visible to family/guests",
            "Use open/public Wi‑Fi",
            "Screens not visible to unauthorized people",
            "Disable VPN",
        ],
        answer_index=2,
        feedback="Maintain a dedicated workspace where screens are not visible to unauthorized people.",
    ),
]


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


def _read_compliance_content() -> str:
    # Primary: packaged resource (works in production builds)
    try:
        with resources.files(RESOURCE_PACKAGE).joinpath(RESOURCE_NAME).open(
            "r", encoding="utf-8"
        ) as f:
            content = f.read()
            if content:
                return content
    except FileNotFoundError:
        pass

    # Fallback: local file in src/resources for dev runs
    fallback_path = Path(__file__).resolve().parents[1] / "resources" / RESOURCE_NAME
    if fallback_path.exists():
        content = fallback_path.read_text(encoding="utf-8")
        if content:
            return content

    raise HTTPException(
        status_code=500, detail="Compliance document not found or empty."
    )


def _compute_version(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


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


def _select_questions() -> List[Question]:
    if len(QUESTION_BANK) <= QUESTION_COUNT:
        return QUESTION_BANK.copy()
    return random.sample(QUESTION_BANK, QUESTION_COUNT)


@router.get("/compliance/latest", response_model=ComplianceDocumentResponse)
def get_latest_compliance():
    content = _read_compliance_content()
    version = _compute_version(content)
    title = _extract_title(content)
    try:
        updated_at = datetime.utcfromtimestamp(
            resources.files(RESOURCE_PACKAGE).joinpath(RESOURCE_NAME).stat().st_mtime
        )
    except FileNotFoundError:
        try:
            fallback_path = (
                Path(__file__).resolve().parents[1] / "resources" / RESOURCE_NAME
            )
            updated_at = datetime.utcfromtimestamp(fallback_path.stat().st_mtime)
        except FileNotFoundError:
            updated_at = datetime.utcnow()
    word_count = len(content.split())
    return ComplianceDocumentResponse(
        version=version,
        title=title,
        updated_at=updated_at,
        word_count=word_count,
        content=content,
    )


@router.get("/compliance/latest/quiz", response_model=QuizResponse)
def get_latest_quiz():
    content = _read_compliance_content()
    version = _compute_version(content)
    selected = _select_questions()
    return QuizResponse(
        version=version,
        required_score=PASSING_SCORE,
        question_count=len(selected),
        cooldown_seconds=COOLDOWN_SECONDS,
        questions=[
            QuizQuestionResponse(id=q.id, prompt=q.prompt, options=q.options)
            for q in selected
        ],
    )


@router.post("/compliance/submit", response_model=SubmitResponse)
def submit_quiz(payload: SubmitRequest, token: str = Depends(oauth_2_scheme)):
    content = _read_compliance_content()
    version = _compute_version(content)
    if payload.version != version:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Outdated compliance version. Refresh and retry.",
        )

    user_id, _ = _get_user_and_tenant(token)
    cooldown_key = (user_id, version)
    now = datetime.utcnow()
    last_failed_at = _cooldowns.get(cooldown_key)
    if last_failed_at:
        remaining = COOLDOWN_SECONDS - int((now - last_failed_at).total_seconds())
        if remaining > 0:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining} seconds before retrying the quiz.",
            )

    question_map = {q.id: q for q in QUESTION_BANK}
    if len(payload.answers) < min(QUESTION_COUNT, len(QUESTION_BANK)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not enough answers provided.",
        )

    correct = 0
    feedback: List[QuestionFeedback] = []
    evaluated_questions = set()

    for ans in payload.answers:
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

    total = len(payload.answers)
    score = int((correct / total) * 100) if total else 0
    passed = score >= PASSING_SCORE

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
        required_score=PASSING_SCORE,
        cooldown_seconds_remaining=remaining_cooldown,
        feedback=feedback,
    )


@router.get("/compliance/status", response_model=ComplianceStatusResponse)
def get_compliance_status(session: SessionDep, token: str = Depends(oauth_2_scheme)):
    content = _read_compliance_content()
    version = _compute_version(content)
    user_id, tenant = _get_user_and_tenant(token)

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
    content = _read_compliance_content()
    version = _compute_version(content)
    if payload.version != version:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Outdated compliance version. Refresh and retry.",
        )

    if payload.score < PASSING_SCORE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz must be passed before acceptance.",
        )

    user_id, tenant = _get_user_and_tenant(token)

    stmt = select(ComplianceAcceptance).where(
        ComplianceAcceptance.user_identifier == user_id,
        ComplianceAcceptance.tenant == tenant,
        ComplianceAcceptance.version == version,
    )
    existing = session.exec(stmt).first()
    now = datetime.utcnow()

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
