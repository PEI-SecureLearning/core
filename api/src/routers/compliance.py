from fastapi import APIRouter, Depends, status, BackgroundTasks

from src.core.security import Roles
from src.core.dependencies import SessionDep, OAuth2Scheme
from src.models import (
    AcceptRequest,
    ComplianceDocumentResponse,
    ComplianceStatusResponse,
    QuizResponse,
    SubmitRequest,
    SubmitResponse,
)
from src.services.compliance.token_helpers import require_tenant_learner_context
from src.services.compliance import quiz_handler
from src.services.risk import risk_service

router = APIRouter()


@router.get("/compliance/latest", response_model=ComplianceDocumentResponse, )
def get_latest_compliance(
    session: SessionDep, token: OAuth2Scheme
):
    _, tenant = require_tenant_learner_context(token)
    return quiz_handler.get_latest_compliance(session, tenant)


@router.get("/compliance/latest/quiz", response_model=QuizResponse)
def get_latest_quiz(session: SessionDep, token: OAuth2Scheme):
    _, tenant = require_tenant_learner_context(token)
    return quiz_handler.get_latest_quiz(session, tenant)


@router.post("/compliance/submit", response_model=SubmitResponse)
def submit_quiz(
    payload: SubmitRequest, session: SessionDep, token: OAuth2Scheme, background_tasks: BackgroundTasks
):
    user_id, tenant = require_tenant_learner_context(token)
    result = quiz_handler.submit_quiz(
        session, tenant, user_id, payload.version, payload.answers
    )
    background_tasks.add_task(risk_service.recalculate_k_factor, user_id, session)
    background_tasks.add_task(risk_service.recalculate_total_risk, user_id, session)
    return result


@router.get("/compliance/status", response_model=ComplianceStatusResponse)
def get_compliance_status(session: SessionDep, token: OAuth2Scheme):
    user_id, tenant = require_tenant_learner_context(token)
    return quiz_handler.get_compliance_status(session, tenant, user_id)


@router.post("/compliance/accept", status_code=status.HTTP_201_CREATED)
def accept_compliance(
    payload: AcceptRequest, session: SessionDep, token: OAuth2Scheme, background_tasks: BackgroundTasks
):
    user_id, tenant = require_tenant_learner_context(token)
    result = quiz_handler.accept_compliance(
        session, tenant, user_id, payload.version, payload.score
    )
    background_tasks.add_task(risk_service.recalculate_k_factor, user_id, session)
    background_tasks.add_task(risk_service.recalculate_total_risk, user_id, session)
    return result
