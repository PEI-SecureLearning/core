"""User management routes within a realm (platform admin scope)."""

from fastapi import APIRouter, Depends, status

from src.core.dependencies import SessionDep
from src.core.security import oauth_2_scheme
from src.models.realm import UserCreateRequest
from src.services.platform_admin import get_platform_admin_service

realm_service = get_platform_admin_service()

router = APIRouter()


@router.post("/realms/users")
def create_user_in_realm(
    session: SessionDep, user: UserCreateRequest, token: str = Depends(oauth_2_scheme)
):
    """Create a new user inside the specified Keycloak realm/tenant."""
    realm_service.validate_realm_access(token, user.realm)
    return realm_service.create_user_in_realm(
        session,
        realm=user.realm,
        username=user.username,
        name=user.name,
        email=user.email,
        role=user.role,
        group_id=user.group_id,
    )


@router.get("/realms/{realm}/users")
def list_users_in_realm(session: SessionDep, realm: str, token: str = Depends(oauth_2_scheme)):
    """List users inside the specified Keycloak realm/tenant."""
    realm_service.validate_realm_access(token, realm)
    return realm_service.list_users_in_realm(session, realm)


@router.get("/realms/{realm}/users/{user_id}")
def get_user_in_realm(realm: str, user_id: str, token: str = Depends(oauth_2_scheme)):
    realm_service.validate_realm_access(token, realm)
    return realm_service.get_user_in_realm(realm, user_id)


@router.delete(
    "/realms/{realm}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_user_in_realm(
    realm: str, user_id: str, session: SessionDep, token: str = Depends(oauth_2_scheme)
):
    realm_service.validate_realm_access(token, realm)
    realm_service.delete_user_in_realm(realm, user_id, session)
    return None


@router.put(
    "/realms/{realm}/role/{user_id}", status_code=status.HTTP_204_NO_CONTENT
)
def update_user_role_in_realm(
    realm: str, user_id: str, role: str, token: str = Depends(oauth_2_scheme)
):
    realm_service.update_user_role_in_realm(realm, user_id, role)
    return None


@router.delete(
    "/realms/admin/{realm}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT
)
def admin_delete_user_in_realm(
    realm: str, user_id: str, session: SessionDep, token: str = Depends(oauth_2_scheme)
):
    realm_service.delete_user_in_realm(realm, user_id, session)
    return None
