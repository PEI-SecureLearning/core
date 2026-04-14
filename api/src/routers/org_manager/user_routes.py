"""User management routes for org managers."""

import csv
import codecs
from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile, status

from src.core.dependencies import SessionDep, OAuth2Scheme
from src.models import OrgUserCreate, CourseEnrollmentPayload
from src.models.org_manager.schemas import UserDetailsDTO
from src.core.security import Roles, Resource, Scope
from src.services.org_manager import get_org_manager_service
from src.services.org_manager.validation_handler import validate_realm_access
from src.services.campaign import get_campaign_service

org_manager_service = get_org_manager_service()
campaign_service = get_campaign_service()


router = APIRouter()


@router.get(
    "/{realm}/users", dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.VIEW))]
)
def list_users(realm: str, token: OAuth2Scheme):
    """List users in the realm using the user's token."""
    validate_realm_access(token, realm)
    return org_manager_service.list_users(realm, token)


@router.post(
    "/{realm}/users", dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))]
)
def create_user(
    realm: str,
    user: OrgUserCreate,
    session: SessionDep,
    token: OAuth2Scheme,
):
    """Create a user in the realm using the user's token."""
    validate_realm_access(token, realm)
    return org_manager_service.create_user(
        session,
        realm=realm,
        token=token,
        username=user.username,
        name=user.name,
        email=user.email,
        role=user.role,
        group_id=user.group_id,
    )


@router.delete(
    "/{realm}/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))],
)
def delete_user(realm: str, user_id: str, session: SessionDep, token: OAuth2Scheme):
    """Delete a user from the realm using the user's token."""
    validate_realm_access(token, realm)
    org_manager_service.delete_user(realm, token, user_id, session)
    return None


@router.post(
    "/upload", dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))]
)
def upload_user_csv(file: Annotated[UploadFile, File(...)]):
    """Upload CSV with user data; accessible to org managers (and admins via policy)."""
    reader = csv.DictReader(codecs.iterdecode(file.file, "utf-8"))
    data = list(reader)
    file.file.close()
    return data


@router.post(
    "/{realm}/users/{user_id}/enroll",
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))],
)
def enroll_user_endpoint(
    realm: str,
    user_id: str,
    payload: CourseEnrollmentPayload,
    session: SessionDep,
    token: OAuth2Scheme,
):
    """Enroll a user in one or more courses."""
    validate_realm_access(token, realm)
    return org_manager_service.enroll_user(
        session,
        user_id=user_id,
        course_ids=payload.course_ids,
        start_date=payload.start_date,
        deadline=payload.deadline,
        cert_valid_days=payload.cert_valid_days,
    )


@router.get(
    "/{realm}/users/{user_id}",
    response_model=UserDetailsDTO,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.VIEW))],
)
def list_user_details(realm: str, user_id: str, token: OAuth2Scheme) -> UserDetailsDTO:
    """List details for a specific user."""
    validate_realm_access(token, realm)
    return org_manager_service.list_user_details(realm, token, user_id)


@router.get(
    "/{realm}/users/{user_id}/sendings",
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.VIEW))],
)
def list_user_sendings(
    realm: str, user_id: str, session: SessionDep, token: OAuth2Scheme
):
    """List email sendings for a specific user."""
    validate_realm_access(token, realm)
    return campaign_service.list_user_sendings(session, user_id)
