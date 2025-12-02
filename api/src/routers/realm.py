from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.models.realm import RealmCreate
from src.core.admin import Admin

router = APIRouter()

class RealmResponse(BaseModel):
    realm: str

# Mock logic for now
mock_db = {
    "example.com": "tenant-1",
    "test.com": "tenant-2",
    "pei.com": "pei-realm"
}

@router.get("/realms", response_model=RealmResponse)
def get_realms_by_domain(domain: str):
    realm = mock_db.get(domain)
    if not realm:
        raise HTTPException(status_code=404, detail="Realm not found for this domain")
        
    return {"realm": realm}

@router.post("/realms")
def create_realm(realm: RealmCreate):
    if realm.domain in mock_db:
        raise HTTPException(status_code=400, detail="Domain already exists")
    
    # Create realm in Keycloak
    admin = Admin()
    try:
        response = admin.create_realm(realm.name)
        if response.status_code != 201:
            raise HTTPException(status_code=response.status_code, detail=f"Failed to create realm in Keycloak: {response.text}")
    except Exception as e:
        # If it's already an HTTPException, re-raise it
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to communicate with Keycloak: {str(e)}")
    
    mock_db[realm.domain] = realm.name
    return realm
