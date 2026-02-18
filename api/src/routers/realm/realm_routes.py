"""Realm CRUD, info, and platform log routes."""

from fastapi import APIRouter, HTTPException, status

from src.core.dependencies import SafeRealm, SessionDep
from src.models.realm import RealmCreate, RealmResponse
from src.services.platform_admin import get_platform_admin_service

realm_service = get_platform_admin_service()

router = APIRouter()


@router.get("/realms/tenants")
def list_tenants():
    """List all tenant realms from Keycloak (excluding master and platform)."""
    return realm_service.list_realms()


@router.get("/logs")
def get_platform_logs(max_results: int = 100):
    """Get platform logs/events from all tenant realms."""
    return realm_service.get_platform_logs(max_results)


@router.get(
    "/realms",
    responses={404: {"description": "Realm not found for this domain"}}, 
    response_model=RealmResponse
)
def get_realms_by_domain(domain: str):
    realm = realm_service.find_realm_by_domain(domain)
    if not realm:
        raise HTTPException(status_code=404, detail="Realm not found for this domain")
    return {"realm": realm}


@router.post("/realms")
def create_realm(realm: RealmCreate, session: SessionDep):
    return realm_service.create_realm_in_keycloak(realm, session)


@router.delete("/realms/{realm}", status_code=status.HTTP_204_NO_CONTENT)
def delete_realm(realm: SafeRealm, session: SessionDep):
    """Delete a tenant realm from Keycloak."""
    realm_service.delete_realm_from_keycloak(realm, session)
    return None


@router.get(
    "/realms/{realm}/info",
    responses={404: {"description": "Realm not found"}},
    response_model=RealmResponse
)
def get_realm_info(realm: SafeRealm):
    """Return realm metadata including domain and feature flags."""
    realm = realm_service.get_realm_info(realm)
    if not realm:
        raise HTTPException(status_code=404, detail="Realm not found")
    return {"realm": realm}
