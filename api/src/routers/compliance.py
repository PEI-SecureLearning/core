from fastapi import APIRouter, Depends, status

from src.core.dependencies import SessionDep
from src.core.security import oauth_2_scheme
from src.models.compliance_schemas import (
    AcceptRequest,
    ComplianceDocumentResponse,
    ComplianceStatusResponse,
    QuizResponse,
    SubmitRequest,
    SubmitResponse,
)
from src.services.compliance.token_helpers import get_user_and_tenant, require_tenant
from src.services.compliance import quiz_handler

router = APIRouter()


@router.get("/compliance/latest", response_model=ComplianceDocumentResponse)
def get_latest_compliance(
    session: SessionDep, token: str = Depends(oauth_2_scheme)
):
    _, tenant = get_user_and_tenant(token)
    tenant = require_tenant(tenant)
    return quiz_handler.get_latest_compliance(session, tenant)


@router.get("/compliance/latest/quiz", response_model=QuizResponse)
def get_latest_quiz(session: SessionDep, token: str = Depends(oauth_2_scheme)):
    _, tenant = get_user_and_tenant(token)
    tenant = require_tenant(tenant)
    return quiz_handler.get_latest_quiz(session, tenant)


@router.post("/compliance/submit", response_model=SubmitResponse)
def submit_quiz(
    payload: SubmitRequest, session: SessionDep, token: str = Depends(oauth_2_scheme)
):
    user_id, tenant = get_user_and_tenant(token)
    tenant = require_tenant(tenant)
    return quiz_handler.submit_quiz(
        session, tenant, user_id, payload.version, payload.answers
    )


@router.get("/compliance/status", response_model=ComplianceStatusResponse)
def get_compliance_status(session: SessionDep, token: str = Depends(oauth_2_scheme)):
    user_id, tenant = get_user_and_tenant(token)
    tenant = require_tenant(tenant)
    return quiz_handler.get_compliance_status(session, tenant, user_id)


@router.post("/compliance/accept", status_code=status.HTTP_201_CREATED)
def accept_compliance(
    payload: AcceptRequest, session: SessionDep, token: str = Depends(oauth_2_scheme)
):
    user_id, tenant = get_user_and_tenant(token)
    tenant = require_tenant(tenant)
    return quiz_handler.accept_compliance(
        session, tenant, user_id, payload.version, payload.score
    )
