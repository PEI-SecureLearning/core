"""Compliance policy and quiz management routes for org managers."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile

from src.core.dependencies import SessionDep, OAuth2Scheme
from src.core.security import Roles
from src.models.org_manager_schemas import (
    CompliancePolicyPayload,
    CompliancePolicyResponse,
    ComplianceQuizPayload,
    ComplianceQuizResponse,
)
from src.services.org_manager import compliance_handler as compliance_handler
from src.services.org_manager.validation_handler import validate_realm_access

router = APIRouter()


@router.get(
    "/{realm}/compliance/policy",
    response_model=CompliancePolicyResponse,
    dependencies=[Depends(Roles("org_manager", "manage"))],
)
def get_compliance_policy(
    realm: str, session: SessionDep, token: OAuth2Scheme
):
    validate_realm_access(token, realm)
    return compliance_handler.get_compliance_policy(session, realm)


@router.put(
    "/{realm}/compliance/policy",
    response_model=CompliancePolicyResponse,
    dependencies=[Depends(Roles("org_manager", "manage"))],
)
def update_compliance_policy(
    realm: str,
    payload: CompliancePolicyPayload,
    session: SessionDep,
    token: OAuth2Scheme,
):
    validate_realm_access(token, realm)
    return compliance_handler.update_compliance_policy(
        session, realm, payload.content_md, token
    )


@router.post(
    "/{realm}/compliance/policy/import",
    dependencies=[Depends(Roles("org_manager", "manage"))],
)
async def import_compliance_policy(
    realm: str,
    token: OAuth2Scheme,
    file: Annotated[UploadFile, File(...)],
):
    validate_realm_access(token, realm)
    return await compliance_handler.import_compliance_policy(file)


@router.get(
    "/{realm}/compliance/quiz",
    response_model=ComplianceQuizResponse,
    dependencies=[Depends(Roles("org_manager", "manage"))],
)
def get_compliance_quiz(
    realm: str, session: SessionDep, token: OAuth2Scheme
):
    validate_realm_access(token, realm)
    return compliance_handler.get_compliance_quiz(session, realm)


@router.put(
    "/{realm}/compliance/quiz",
    response_model=ComplianceQuizResponse,
    dependencies=[Depends(Roles("org_manager", "manage"))],
)
def update_compliance_quiz(
    realm: str,
    payload: ComplianceQuizPayload,
    session: SessionDep,
    token: OAuth2Scheme,
):
    validate_realm_access(token, realm)
    return compliance_handler.update_compliance_quiz(session, realm, payload, token)
