"""Group management and membership routes for org managers."""

from fastapi import APIRouter, Depends, status

from src.core.dependencies import SessionDep
from src.core.security import oauth_2_scheme, Roles
from src.models.org_manager_schemas import GroupCreateRequest
from src.services.org_manager import get_org_manager_service
from src.services.org_manager.Validation_handler import validate_realm_access

org_manager_service = get_org_manager_service()

router = APIRouter()


@router.get(
    "/{realm}/groups", dependencies=[Depends(Roles("org_manager", "view"))]
)
def list_groups(realm: str, token: str = Depends(oauth_2_scheme)):
    """List groups in the realm using the user's token."""
    validate_realm_access(token, realm)
    return org_manager_service.list_groups(realm, token)


@router.post(
    "/{realm}/groups",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(Roles("org_manager", "manage"))],
)
def create_group(
    realm: str,
    group: GroupCreateRequest,
    session: SessionDep,
    token: str = Depends(oauth_2_scheme),
):
    """Create a group in the realm using the user's token."""
    validate_realm_access(token, realm)
    return org_manager_service.create_group(session, realm, token, group.name)


@router.delete(
    "/{realm}/groups/{group_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(Roles("org_manager", "manage"))],
)
def delete_group(
    realm: str, group_id: str, session: SessionDep, token: str = Depends(oauth_2_scheme)
):
    """Delete a group from the realm using the user's token."""
    validate_realm_access(token, realm)
    org_manager_service.delete_group(session, realm, token, group_id)
    return None


@router.put(
    "/{realm}/groups/{group_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(Roles("org_manager", "manage"))],
)
def update_group(
    realm: str,
    group_id: str,
    group: GroupCreateRequest,
    token: str = Depends(oauth_2_scheme),
):
    """Update a group in the realm using the user's token."""
    validate_realm_access(token, realm)
    org_manager_service.update_group(realm, token, group_id, group.name)
    return None


@router.post(
    "/{realm}/groups/{group_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(Roles("org_manager", "manage"))],
)
def add_user_to_group(
    realm: str, group_id: str, user_id: str, token: str = Depends(oauth_2_scheme)
):
    """Add a user to a group using the user's token."""
    validate_realm_access(token, realm)
    org_manager_service.add_user_to_group(realm, token, user_id, group_id)
    return None


@router.get(
    "/{realm}/groups/{group_id}/members",
    dependencies=[Depends(Roles("org_manager", "view"))],
)
def list_group_members(realm: str, group_id: str, token: str = Depends(oauth_2_scheme)):
    """List members of a group using the user's token."""
    validate_realm_access(token, realm)
    return org_manager_service.list_group_members(realm, token, group_id)


@router.delete(
    "/{realm}/groups/{group_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_user_from_group(
    realm: str, group_id: str, user_id: str, token: str = Depends(oauth_2_scheme)
):
    """Remove a user from a group using the user's token."""
    validate_realm_access(token, realm)
    org_manager_service.remove_user_from_group(realm, token, user_id, group_id)
    return None
