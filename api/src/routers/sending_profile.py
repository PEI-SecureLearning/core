from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from src.core.security import Roles, Resource, Scope
from src.core.dependencies import CurrentRealm, SessionDep
from src.models import (
    SendingProfileCreate,
    SendingProfileDisplayInfo,
    SendingProfileRead,
)
from src.services.sending_profile import SendingProfileService


router = APIRouter()

service = SendingProfileService()


def _to_http_exception(error: Exception) -> HTTPException:
    if isinstance(error, LookupError):
        return HTTPException(status_code=404, detail=str(error))
    if isinstance(error, ValueError):
        return HTTPException(status_code=400, detail=str(error))
    if isinstance(error, RuntimeError):
        return HTTPException(status_code=500, detail=str(error))
    return HTTPException(status_code=500, detail="Unexpected sending profile error")


@router.post(
    "/sending-profiles/test",
    description="Test sending profile configuration",
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))],
)
def test_sending_profile_configuration(profile_data: SendingProfileCreate):
    try:
        message = service.test_sending_profile_configuration(profile_data)
        return Response(content=message, status_code=200)
    except (LookupError, ValueError, RuntimeError) as e:
        raise _to_http_exception(e)


@router.post(
    "/sending-profiles",
    description="Create a new sending profile",
    status_code=201,
    response_model=SendingProfileRead,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))],
)
def create_sending_profile(
    profile_data: SendingProfileCreate,
    current_realm: CurrentRealm,
    session: SessionDep,
):
    try:
        return service.create_sending_profile(profile_data, current_realm, session)
    except (LookupError, ValueError, RuntimeError) as e:
        raise _to_http_exception(e)


@router.get(
    "/sending-profiles",
    description="Fetch all sending profiles",
    status_code=200,
    response_model=list[SendingProfileDisplayInfo],
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.VIEW))],
)
def get_sending_profiles(
    current_realm: CurrentRealm,
    session: SessionDep,
):
    try:
        profiles = service.get_sending_profiles_by_realm(current_realm, session)
        return profiles
    except (LookupError, ValueError, RuntimeError) as e:
        raise _to_http_exception(e)


@router.delete(
    "/sending-profiles/{id}",
    description="Delete a sending profile",
    status_code=200,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))],
)
def delete_sending_profile(
    id: int,
    session: SessionDep,
):
    try:
        service.delete_sending_profile(id, session)
        return {"message": "Sending profile deleted successfully"}
    except (LookupError, ValueError, RuntimeError) as e:
        raise _to_http_exception(e)


@router.put(
    "/sending-profiles/{id}",
    description="Update a sending profile",
    status_code=200,
    response_model=SendingProfileRead,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))],
)
def update_sending_profile(
    id: int,
    profile_data: SendingProfileCreate,
    session: SessionDep,
):
    try:
        updated_profile = service.update_sending_profile(id, profile_data, session)
        return updated_profile
    except (LookupError, ValueError, RuntimeError) as e:
        raise _to_http_exception(e)


@router.get(
    "/sending-profiles/{id}",
    description="Fetch sending profile by ID",
    status_code=200,
    response_model=SendingProfileRead,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.VIEW))],
    responses={404: {"description": "Sending profile not found"}},
)
def get_sending_profile_by_id(
    id: int,
    session: SessionDep,
):
    try:
        profile = service.get_sending_profile(id, session)
    except (LookupError, ValueError, RuntimeError) as e:
        raise _to_http_exception(e)
    return profile
