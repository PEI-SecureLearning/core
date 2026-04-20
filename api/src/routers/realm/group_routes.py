"""Group management and membership routes within a realm (platform admin scope)."""

from fastapi import APIRouter, Depends, status

from src.core.security import Roles, Resource, Scope
from src.core.dependencies import SessionDep, OAuth2Scheme
from src.models import (
    RealmGroupCreate,
    KeycloakGroupDTO,
    UserDTO,
)
from src.services.platform_admin import get_platform_admin_service

realm_service = get_platform_admin_service()

router = APIRouter()


@router.get(
    "/realms/{realm}/groups",
    response_model=list[KeycloakGroupDTO],
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))],
)
def list_groups_in_realm(realm: str, token: OAuth2Scheme):
    realm_service.validate_realm_access(token, realm)
    return realm_service.list_groups_in_realm(realm)


@router.post(
    "/realms/{realm}/groups",
    status_code=status.HTTP_201_CREATED,
    response_model=KeycloakGroupDTO,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))],
)
def create_group_in_realm(
    session: SessionDep,
    realm: str,
    group: RealmGroupCreate,
    token: OAuth2Scheme,
):
    realm_service.validate_realm_access(token, realm)
    return realm_service.create_group_in_realm(realm, group.name, session)


@router.post(
    "/realms/{realm}/groups/{group_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))],
)
def add_user_to_group(realm: str, group_id: str, user_id: str, token: OAuth2Scheme):
    realm_service.validate_realm_access(token, realm)
    realm_service.add_user_to_group_in_realm(realm, user_id, group_id)
    return None


@router.get(
    "/realms/{realm}/groups/{group_id}/members",
    response_model=list[UserDTO],
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.VIEW))],
)
def list_group_members(realm: str, group_id: str, token: OAuth2Scheme):
    realm_service.validate_realm_access(token, realm)
    return realm_service.list_group_members_in_realm(realm, group_id)


@router.delete(
    "/realms/{realm}/groups/{group_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))],
)
def delete_group_in_realm(
    realm: str, group_id: str, session: SessionDep, token: OAuth2Scheme
):
    realm_service.validate_realm_access(token, realm)
    realm_service.delete_group_in_realm(realm, group_id, session)
    return None


@router.put(
    "/realms/{realm}/groups/{group_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))],
)
def update_group_in_realm(
    realm: str,
    group_id: str,
    group: RealmGroupCreate,
    token: OAuth2Scheme,
):
    realm_service.validate_realm_access(token, realm)
    realm_service.update_group_in_realm(realm, group_id, group.name)
    return None


@router.delete(
    "/realms/{realm}/groups/{group_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))],
)
def remove_user_from_group(
    realm: str, group_id: str, user_id: str, token: OAuth2Scheme
):
    realm_service.validate_realm_access(token, realm)
    realm_service.remove_user_from_group_in_realm(realm, user_id, group_id)
    return None
