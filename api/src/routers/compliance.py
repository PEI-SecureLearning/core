from fastapi import APIRouter, Depends, status

from src.core.security import Roles
from src.core.dependencies import SessionDep, OAuth2Scheme
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


@router.get("/compliance/latest", response_model=ComplianceDocumentResponse, dependencies=[Depends(Roles("org_manager", "view"))])
def get_latest_compliance(
    session: SessionDep, token: OAuth2Scheme
):
    _, tenant = get_user_and_tenant(token)
    tenant = require_tenant(tenant)
    return quiz_handler.get_latest_compliance(session, tenant)


@router.get("/compliance/latest/quiz", response_model=QuizResponse, dependencies=[Depends(Roles("org_manager", "view"))])
def get_latest_quiz(session: SessionDep, token: OAuth2Scheme):
    _, tenant = get_user_and_tenant(token)
    tenant = require_tenant(tenant)
    return quiz_handler.get_latest_quiz(session, tenant)


@router.post("/compliance/submit", response_model=SubmitResponse, dependencies=[Depends(Roles("org_manager", "manage"))])
def submit_quiz(
    payload: SubmitRequest, session: SessionDep, token: OAuth2Scheme
):
    user_id, tenant = get_user_and_tenant(token)
    tenant = require_tenant(tenant)
    return quiz_handler.submit_quiz(
        session, tenant, user_id, payload.version, payload.answers
    )


@router.get("/compliance/status", response_model=ComplianceStatusResponse, dependencies=[Depends(Roles("org_manager", "view"))])
def get_compliance_status(session: SessionDep, token: OAuth2Scheme):
    user_id, tenant = get_user_and_tenant(token)
    tenant = require_tenant(tenant)
    return quiz_handler.get_compliance_status(session, tenant, user_id)


@router.post("/compliance/accept", status_code=status.HTTP_201_CREATED, dependencies=[Depends(Roles("org_manager", "manage"))])
def accept_compliance(
    payload: AcceptRequest, session: SessionDep, token: OAuth2Scheme
):
    user_id, tenant = get_user_and_tenant(token)
    tenant = require_tenant(tenant)
    return quiz_handler.accept_compliance(
        session, tenant, user_id, payload.version, payload.score
    )
