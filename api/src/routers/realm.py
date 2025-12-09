from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel

from src.models.realm import RealmCreate
from src.core.security import oauth_2_scheme
from src.services import realm as realm_service

router = APIRouter()


class RealmResponse(BaseModel):
    realm: str


class UserCreateRequest(BaseModel):
    realm: str
    username: str
    name: str
    email: str
    role: str
    group_id: str | None = None


class GroupCreateRequest(BaseModel):
    name: str


@router.get("/realms", response_model=RealmResponse)
def get_realms_by_domain(domain: str):
    realm = realm_service.find_realm_by_domain(domain)
    if not realm:
        raise HTTPException(status_code=404, detail="Realm not found for this domain")
    return {"realm": realm}


@router.post("/realms")
def create_realm(realm: RealmCreate):
    return realm_service.create_realm_in_keycloak(realm)


@router.post("/realms/users")
def create_user_in_realm(user: UserCreateRequest, token: str = Depends(oauth_2_scheme)):
    """Create a new user inside the specified Keycloak realm/tenant."""
    realm_service.validate_realm_access(token, user.realm)
    return realm_service.create_user_in_realm(
        realm=user.realm,
        username=user.username,
        name=user.name,
        email=user.email,
        role=user.role,
        group_id=user.group_id,
    )


@router.get("/realms/{realm}/users")
def list_users_in_realm(realm: str, token: str = Depends(oauth_2_scheme)):
    """List users inside the specified Keycloak realm/tenant."""
    realm_service.validate_realm_access(token, realm)
    return realm_service.list_users_in_realm(realm)


@router.get("/realms/{realm}/users/{user_id}")
def get_user_in_realm(realm: str, user_id: str, token: str = Depends(oauth_2_scheme)):
    realm_service.validate_realm_access(token, realm)
    return realm_service.get_user_in_realm(realm, user_id)


@router.delete(
    "/realms/{realm}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_user_in_realm(
    realm: str, user_id: str, token: str = Depends(oauth_2_scheme)
):
    realm_service.validate_realm_access(token, realm)
    realm_service.delete_user_in_realm(realm, user_id)
    return None


@router.get("/realms/{realm}/groups")
def list_groups_in_realm(realm: str, token: str = Depends(oauth_2_scheme)):
    realm_service.validate_realm_access(token, realm)
    return realm_service.list_groups_in_realm(realm)


@router.post("/realms/{realm}/groups", status_code=status.HTTP_201_CREATED)
def create_group_in_realm(
    realm: str, group: GroupCreateRequest, token: str = Depends(oauth_2_scheme)
):
    realm_service.validate_realm_access(token, realm)
    return realm_service.create_group_in_realm(realm, group.name)


@router.post(
    "/realms/{realm}/groups/{group_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def add_user_to_group(
    realm: str, group_id: str, user_id: str, token: str = Depends(oauth_2_scheme)
):
    realm_service.validate_realm_access(token, realm)
    realm_service.add_user_to_group_in_realm(realm, user_id, group_id)
    return None


@router.get("/realms/{realm}/groups/{group_id}/members")
def list_group_members(realm: str, group_id: str, token: str = Depends(oauth_2_scheme)):
    realm_service.validate_realm_access(token, realm)
    return realm_service.list_group_members_in_realm(realm, group_id)


@router.delete(
    "/realms/{realm}/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_group_in_realm(
    realm: str, group_id: str, token: str = Depends(oauth_2_scheme)
):
    realm_service.validate_realm_access(token, realm)
    realm_service.delete_group_in_realm(realm, group_id)
    return None


@router.put("/realms/{realm}/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def update_group_in_realm(
    realm: str,
    group_id: str,
    group: GroupCreateRequest,
    token: str = Depends(oauth_2_scheme),
):
    realm_service.validate_realm_access(token, realm)
    realm_service.update_group_in_realm(realm, group_id, group.name)
    return None


@router.delete(
    "/realms/{realm}/groups/{group_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_user_from_group(
    realm: str, group_id: str, user_id: str, token: str = Depends(oauth_2_scheme)
):
    realm_service.validate_realm_access(token, realm)
    realm_service.remove_user_from_group_in_realm(realm, user_id, group_id)
    return None
