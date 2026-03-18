from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from src.core.security import Roles, Resource, Scope
from src.core.dependencies import CurrentRealm, SessionDep
from src.models import SendingProfileCreate, SendingProfileDisplayInfo, SendingProfileRead
from src.services.sending_profile import SendingProfileService


router = APIRouter()

service = SendingProfileService()


@router.post("/sending-profiles/test", description="Test sending profile configuration", dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))])
def test_sending_profile_configuration(
    profile_data: SendingProfileCreate
):
    is_valid, message = service._test_sending_profile_configuration(profile_data)
    return Response(content=message, status_code=200 if is_valid else 400)


@router.post(
    "/sending-profiles", description="Create a new sending profile", status_code=201, response_model=SendingProfileRead, dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))]
)
def create_sending_profile(
    profile_data: SendingProfileCreate,
    current_realm: CurrentRealm,
    session: SessionDep,
):
    return service.create_sending_profile(profile_data, current_realm, session)


@router.get(
    "/sending-profiles", description="Fetch all sending profiles", status_code=200, response_model=list[SendingProfileDisplayInfo], dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.VIEW))]
)
def get_sending_profiles(
    current_realm: CurrentRealm,
    session: SessionDep,
):
    profiles = service.get_sending_profiles_by_realm(current_realm, session)
    return profiles


@router.delete(
    "/sending-profiles/{id}", description="Delete a sending profile", status_code=200, dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))]
)
def delete_sending_profile(
    id: int,
    session: SessionDep,
):
    service.delete_sending_profile(id, session)
    return {"message": "Sending profile deleted successfully"}


@router.put(
    "/sending-profiles/{id}", description="Update a sending profile", status_code=200, response_model=SendingProfileRead, dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))]
)
def update_sending_profile(
    id: int,
    profile_data: SendingProfileCreate,
    session: SessionDep,
):
    updated_profile = service.update_sending_profile(id, profile_data, session)
    if not updated_profile:
        raise HTTPException(status_code=404, detail="Sending profile not found")
    return updated_profile


@router.get(
    "/sending-profiles/{id}", description="Fetch sending profile by ID", status_code=200, response_model=SendingProfileRead, dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.VIEW))]
)
def get_sending_profile_by_id(
    id: int,
    session: SessionDep,
):
    profile = service.get_sending_profile(id, session)
    if not profile:
        raise HTTPException(status_code=404, detail="Sending profile not found")
    return profile
