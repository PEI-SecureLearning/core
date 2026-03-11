from fastapi import APIRouter, Depends, HTTPException

from src.core.security import Roles, Resource, Scope
from src.core.dependencies import CurrentRealm, SessionDep
from src.models import PhishingKitCreate
from src.services.phishing_kit import PhishingKitService


router = APIRouter()

service = PhishingKitService()


@router.post(
    "/phishing-kits",
    description="Create a new phishing kit",
    status_code=201,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))],
)
def create_phishing_kit(
    data: PhishingKitCreate, current_realm: CurrentRealm, session: SessionDep
):
    service.create_phishing_kit(data, current_realm, session)
    return {"message": "Phishing kit created successfully"}


@router.get(
    "/phishing-kits",
    description="Fetch all phishing kits for current realm",
    status_code=200,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.VIEW))],
)
def get_phishing_kits(current_realm: CurrentRealm, session: SessionDep):
    return service.get_phishing_kits_by_realm(current_realm, session)


@router.get(
    "/phishing-kits/{id}",
    description="Fetch a phishing kit by ID",
    status_code=200,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.VIEW))],
)
def get_phishing_kit_by_id(id: int, session: SessionDep):
    kit = service.get_phishing_kit(id, session)
    if not kit:
        raise HTTPException(status_code=404, detail="Phishing kit not found")
    return kit


@router.put(
    "/phishing-kits/{id}",
    description="Update a phishing kit",
    status_code=200,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))],
)
def update_phishing_kit(id: int, data: PhishingKitCreate, session: SessionDep):
    updated = service.update_phishing_kit(id, data, session)
    if not updated:
        raise HTTPException(status_code=404, detail="Phishing kit not found")
    return {"message": "Phishing kit updated successfully"}


@router.delete(
    "/phishing-kits/{id}",
    description="Delete a phishing kit",
    status_code=200,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))],
)
def delete_phishing_kit(id: int, session: SessionDep):
    service.delete_phishing_kit(id, session)
    return {"message": "Phishing kit deleted successfully"}
