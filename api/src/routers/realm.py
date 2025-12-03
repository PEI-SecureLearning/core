import secrets
import jwt
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from src.models.realm import RealmCreate
from src.core.admin import Admin
from src.core.security import oauth_2_scheme

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
        response = admin.create_realm(realm.name, realm.domain)
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

    # Enforce that the user email belongs to the tenant domain.
    allowed_domain = _domain_from_token_or_realm(token)
    if not allowed_domain:
        raise HTTPException(status_code=404, detail="Tenant domain not configured for this realm.")
    email_domain = user.email.split("@")[-1].lower() if "@" in user.email else ""
    if email_domain != allowed_domain.lower():
        raise HTTPException(
            status_code=400,
            detail=f"Email must belong to tenant domain '{allowed_domain}'.",
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

    return {
        "realm": user.realm,
        "username": user.username,
        "status": "created",
        "temporary_password": temporary_password,
    }
