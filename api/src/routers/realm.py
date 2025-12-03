from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.models.realm import RealmCreate, Realm
from src.core.deps import SessionDep
from src.services import realm as realm_service

router = APIRouter()

class RealmResponse(BaseModel):
    realm: str

@router.get("/realms", response_model=RealmResponse)
def get_realms_by_domain(session: SessionDep, domain: str):
    realm = realm_service.get_realm_by_domain(session, domain)
    if not realm:
        raise HTTPException(status_code=404, detail="Realm not found for this domain")
        
    return {"realm": realm.name}

@router.post("/realms")
def create_realm(session: SessionDep, realm: RealmCreate):
    return realm_service.create_realm(session, realm)
