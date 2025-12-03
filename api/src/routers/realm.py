import secrets
import jwt
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from src.models.realm import RealmCreate
from src.core.admin import Admin
from src.core.security import oauth_2_scheme
from fastapi import status

router = APIRouter()
admin = Admin()

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
    realm = admin.find_realm_by_domain(domain)
    if not realm:
        raise HTTPException(status_code=404, detail="Realm not found for this domain")
        
    return {"realm": realm}

@router.post("/realms")
def create_realm(realm: RealmCreate):
    # Create realm in Keycloak with tenant-domain attribute
    try:
        response = admin.create_realm(
            realm_name=realm.name,
            admin_email=realm.adminEmail,
            user_count=realm.userCount,
            domain=realm.domain,
            bundle=realm.bundle,
            features=realm.features
        )
        if response.status_code != 201:
            raise HTTPException(status_code=response.status_code, detail=f"Failed to create realm in Keycloak: {response.text}")
    except Exception as e:
        # If it's already an HTTPException, re-raise it
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to communicate with Keycloak: {str(e)}")
    
    return realm


def _realm_from_token(access_token: str) -> str | None:
    """Parse realm from token issuer without verifying signature (Keycloak managed)."""
    try:
        decoded = jwt.decode(access_token, options={"verify_signature": False, "verify_aud": False})
        iss = decoded.get("iss")
        if iss:
            print(f"[realm:_realm_from_token] access token iss={iss}")
        if not iss:
            return None
        parts = iss.split("/realms/")
        return parts[1] if len(parts) > 1 else None
    except Exception:
        return None
        
def _domain_from_token_or_realm(access_token: str) -> str | None:
    """Get tenant-domain from token or realm info."""
    realm_name = _realm_from_token(access_token)
    if not realm_name:
        return None
    domain = admin.get_domain_for_realm(realm_name)
    return domain

@router.post("/realms/users")
def create_user_in_realm(user: UserCreateRequest, token: str = Depends(oauth_2_scheme)):
    """Create a new user inside the specified Keycloak realm/tenant."""

    token_realm = _realm_from_token(token)
    if token_realm and token_realm != user.realm:
        raise HTTPException(
            status_code=403,
            detail="Realm mismatch: token realm does not match requested realm.",
        )

    # Generate a one-time password for first login.
    temporary_password = secrets.token_urlsafe(12)

    try:
        response = admin.add_user(
            user.realm,
            user.username,
            temporary_password,
            full_name=user.name,
            email=user.email,
            role=user.role,
        )
    except Exception as e:
        # If it's already an HTTPException, re-raise it
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to communicate with Keycloak: {str(e)}")

    if response.status_code not in (201, 204):
        raise HTTPException(status_code=response.status_code, detail=f"Failed to create user in Keycloak: {response.text}")

    # Optionally add user to a group if provided
    user_id = None
    location = response.headers.get("Location")
    if location:
        user_id = location.rstrip("/").split("/")[-1]
    if user.group_id and user_id:
        try:
            admin.add_user_to_group(user.realm, user_id, user.group_id)
        except Exception:
            # Ignore group assignment errors for now but log detail
            pass

    return {
        "realm": user.realm,
        "username": user.username,
        "status": "created",
        "temporary_password": temporary_password,
    }


@router.get("/realms/{realm}/users")
def list_users_in_realm(realm: str, token: str = Depends(oauth_2_scheme)):
    """List users inside the specified Keycloak realm/tenant."""
    token_realm = _realm_from_token(token)
    if token_realm and token_realm != realm:
        raise HTTPException(
            status_code=403,
            detail="Realm mismatch: token realm does not match requested realm.",
        )
    try:
        users = admin.list_users(realm)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to communicate with Keycloak: {str(e)}")

    # Return simplified fields
    simplified = []
    for u in users:
        simplified.append(
            {
                "id": u.get("id"),
                "username": u.get("username"),
                "email": u.get("email"),
                "firstName": u.get("firstName"),
                "lastName": u.get("lastName"),
                "enabled": u.get("enabled"),
            }
        )
    return {"realm": realm, "users": simplified}


@router.get("/realms/{realm}/users/{user_id}")
def get_user_in_realm(realm: str, user_id: str, token: str = Depends(oauth_2_scheme)):
    token_realm = _realm_from_token(token)
    if token_realm and token_realm != realm:
        raise HTTPException(
            status_code=403,
            detail="Realm mismatch: token realm does not match requested realm.",
        )
    try:
        users = admin.list_users(realm)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to communicate with Keycloak: {str(e)}")

    for u in users:
        if u.get("id") == user_id:
            return {
                "id": u.get("id"),
                "username": u.get("username"),
                "email": u.get("email"),
                "firstName": u.get("firstName"),
                "lastName": u.get("lastName"),
                "enabled": u.get("enabled"),
            }

    raise HTTPException(status_code=404, detail="User not found in realm")


@router.delete("/realms/{realm}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_in_realm(realm: str, user_id: str, token: str = Depends(oauth_2_scheme)):
    token_realm = _realm_from_token(token)
    if token_realm and token_realm != realm:
        raise HTTPException(
            status_code=403,
            detail="Realm mismatch: token realm does not match requested realm.",
        )
    try:
        admin.delete_user(realm, user_id)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to delete user in Keycloak: {str(e)}")
    return None


@router.get("/realms/{realm}/groups")
def list_groups_in_realm(realm: str, token: str = Depends(oauth_2_scheme)):
    token_realm = _realm_from_token(token)
    if token_realm and token_realm != realm:
        raise HTTPException(
            status_code=403,
            detail="Realm mismatch: token realm does not match requested realm.",
        )
    try:
        groups = admin.list_groups(realm)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to communicate with Keycloak: {str(e)}")

    simplified = []
    for g in groups:
        simplified.append({"id": g.get("id"), "name": g.get("name"), "path": g.get("path")})
    return {"realm": realm, "groups": simplified}


@router.post("/realms/{realm}/groups", status_code=status.HTTP_201_CREATED)
def create_group_in_realm(realm: str, group: GroupCreateRequest, token: str = Depends(oauth_2_scheme)):
    token_realm = _realm_from_token(token)
    if token_realm and token_realm != realm:
        raise HTTPException(
            status_code=403,
            detail="Realm mismatch: token realm does not match requested realm.",
        )
    try:
        response = admin.create_group(realm, group.name)
        if response.status_code not in (201, 204):
            raise HTTPException(status_code=response.status_code, detail="Failed to create group in Keycloak")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to communicate with Keycloak: {str(e)}")
    return {"realm": realm, "name": group.name}


@router.post("/realms/{realm}/groups/{group_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def add_user_to_group(realm: str, group_id: str, user_id: str, token: str = Depends(oauth_2_scheme)):
    token_realm = _realm_from_token(token)
    if token_realm and token_realm != realm:
        raise HTTPException(
            status_code=403,
            detail="Realm mismatch: token realm does not match requested realm.",
        )
    try:
        admin.add_user_to_group(realm, user_id, group_id)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to add user to group: {str(e)}")
    return None


@router.get("/realms/{realm}/groups/{group_id}/members")
def list_group_members(realm: str, group_id: str, token: str = Depends(oauth_2_scheme)):
    token_realm = _realm_from_token(token)
    if token_realm and token_realm != realm:
        raise HTTPException(
            status_code=403,
            detail="Realm mismatch: token realm does not match requested realm.",
        )
    try:
        members = admin.list_group_members(realm, group_id)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to fetch group members: {str(e)}")

    simplified = []
    for m in members:
        simplified.append(
            {
                "id": m.get("id"),
                "username": m.get("username"),
                "email": m.get("email"),
                "firstName": m.get("firstName"),
                "lastName": m.get("lastName"),
            }
        )
    return {"realm": realm, "groupId": group_id, "members": simplified}


@router.delete("/realms/{realm}/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group_in_realm(realm: str, group_id: str, token: str = Depends(oauth_2_scheme)):
    token_realm = _realm_from_token(token)
    if token_realm and token_realm != realm:
        raise HTTPException(
            status_code=403,
            detail="Realm mismatch: token realm does not match requested realm.",
        )
    try:
        admin.delete_group(realm, group_id)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to delete group: {str(e)}")
    return None


@router.put("/realms/{realm}/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def update_group_in_realm(realm: str, group_id: str, group: GroupCreateRequest, token: str = Depends(oauth_2_scheme)):
    token_realm = _realm_from_token(token)
    if token_realm and token_realm != realm:
        raise HTTPException(
            status_code=403,
            detail="Realm mismatch: token realm does not match requested realm.",
        )
    try:
        admin.update_group(realm, group_id, group.name)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to update group: {str(e)}")
    return None


@router.delete("/realms/{realm}/groups/{group_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user_from_group(realm: str, group_id: str, user_id: str, token: str = Depends(oauth_2_scheme)):
    token_realm = _realm_from_token(token)
    if token_realm and token_realm != realm:
        raise HTTPException(
            status_code=403,
            detail="Realm mismatch: token realm does not match requested realm.",
        )
    try:
        admin.remove_user_from_group(realm, user_id, group_id)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to remove user from group: {str(e)}")
    return None
