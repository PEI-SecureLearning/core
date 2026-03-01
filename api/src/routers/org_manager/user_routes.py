"""User management routes for org managers."""

import csv
import codecs
from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile, status

from src.core.dependencies import SessionDep, OAuth2Scheme
from src.models.org_manager_schemas import UserCreateRequest
from src.core.security import Roles
from src.services.org_manager import get_org_manager_service
from src.services.org_manager.validation_handler import validate_realm_access

org_manager_service = get_org_manager_service()

router = APIRouter()


@router.get(
    "/{realm}/users", dependencies=[Depends(Roles("org_manager", "view"))]
)
def list_users(realm: str, token: OAuth2Scheme):
    """List users in the realm using the user's token."""
    validate_realm_access(token, realm)
    return org_manager_service.list_users(realm, token)


@router.post(
    "/{realm}/users", dependencies=[Depends(Roles("org_manager", "manage"))]
)
def create_user(
    realm: str,
    user: UserCreateRequest,
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
    dependencies=[Depends(Roles("org_manager", "manage"))],
)
def delete_user(
    realm: str, user_id: str, session: SessionDep, token: OAuth2Scheme
):
    """Delete a user from the realm using the user's token."""
    validate_realm_access(token, realm)
    org_manager_service.delete_user(realm, token, user_id, session)
    return None


@router.post("/upload", dependencies=[Depends(Roles("org_manager", "manage"))])
def upload_user_csv(file: Annotated[UploadFile, File(...)]):
    """Upload CSV with user data; accessible to org managers (and admins via policy)."""
    reader = csv.DictReader(codecs.iterdecode(file.file, "utf-8"))
    data = list(reader)
    file.file.close()
    return data
