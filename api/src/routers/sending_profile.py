from fastapi import APIRouter
from fastapi.responses import RedirectResponse, Response

from src.core.dependencies import CurrentRealm, SessionDep
from src.models.sending_profile import SendingProfileCreate
from src.services.sending_profile import SendingProfileService


router = APIRouter()

service = SendingProfileService()


@router.post(
    "/sending-profiles", description="Create a new sending profile", status_code=201
)
def create_sending_profile(
    profile_data: SendingProfileCreate,
    current_realm: CurrentRealm,
    session: SessionDep,
):
    service.create_sending_profile(profile_data, current_realm, session)
    return {"message": "Sending profile created successfully"}


@router.get(
    "/sending-profiles", description="Fetch all sending profiles", status_code=200
)
def get_sending_profiles(
    current_realm: CurrentRealm,
    session: SessionDep,
):
    profiles = service.get_sending_profiles_by_realm(current_realm, session)
    return profiles


@router.delete(
    "/sending-profiles/{id}", description="Delete a sending profile", status_code=200
)
def delete_sending_profile(
    id: int,
    session: SessionDep,
):
    service.delete_sending_profile(id, session)
    return {"message": "Sending profile deleted successfully"}


@router.put(
    "/sending-profiles/{id}", description="Update a sending profile", status_code=200
)
def update_sending_profile(
    id: int,
    profile_data: SendingProfileCreate,
    session: SessionDep,
):
    updated_profile = service.update_sending_profile(id, profile_data, session)
    if not updated_profile:
        return {"message": "Sending profile not found"}
    return {"message": "Sending profile updated successfully"}


@router.get(
    "/sending-profiles/{id}", description="Fetch sending profile by ID", status_code=200
)
def get_sending_profile_by_id(
    id: int,
    session: SessionDep,
):
    profile = service.get_sending_profile(id, session)
    if not profile:
        return {"message": "Sending profile not found"}
    return profile
