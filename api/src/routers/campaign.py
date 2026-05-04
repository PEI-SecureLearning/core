from fastapi import APIRouter, Depends, HTTPException

from src.core.security import Roles, Resource, Scope
from src.core.dependencies import CurrentRealm, SessionDep, CurrentUserID
from src.models import CampaignCreate, CampaignUpdate
from src.models.campaign.schemas import UserCampaignStatsResponse
from src.services.campaign import CampaignService
from src.services.campaign.stats_handler import get_stats_handler


router = APIRouter()

service = CampaignService()


@router.post(
    "/campaigns",
    description="Create a new campaign",
    status_code=201,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))],
)
def create_campaign(
    campaign: CampaignCreate, current_realm: CurrentRealm, session: SessionDep
):
    if not service.create_campaign(campaign, current_realm, session):
        raise HTTPException(status_code=400, detail="Failed to create campaign")
    return {"message": "Campaign created successfully"}


@router.get(
    "/campaigns",
    description="Fetch all campaigns",
    status_code=200,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.VIEW))],
)
def get_campaigns(current_realm: CurrentRealm, session: SessionDep):
    campaigns = service.get_campaigns(current_realm, session)
    return campaigns


@router.get(
    "/campaigns/stats",
    description="Fetch global stats about all campaigns",
    status_code=200,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.VIEW))],
)
def get_global_campaign_stats(current_realm: CurrentRealm, session: SessionDep):
    return service.get_global_stats(current_realm, session)


@router.get(
    "/campaigns/{id}",
    description="Fetch campaign by ID",
    status_code=200,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.VIEW))],
)
def get_campaign_by_id(id: int, current_realm: CurrentRealm, session: SessionDep):
    campaign = service.get_campaign_by_id(id, current_realm, session)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@router.post(
    "/campaigns/{id}/cancel",
    description="Cancel a campaign and all its pending email sendings",
    status_code=200,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))],
)
def cancel_campaign(id: int, current_realm: CurrentRealm, session: SessionDep):
    campaign = service.cancel_campaign(id, current_realm, session)
    return {"message": f"Campaign '{campaign.name}' has been canceled"}


@router.put(
    "/campaigns/{id}",
    description="Update a campaign. Only for SCHEDULED campaigns.",
    status_code=200,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))],
)
def update_campaign(
    id: int,
    campaign_update: CampaignUpdate,
    current_realm: CurrentRealm,
    session: SessionDep,
):
    campaign = service.update_campaign(id, campaign_update, current_realm, session)
    return {"message": f"Campaign '{campaign.name}' has been updated"}

@router.get(
    "/campaigns/user/me/stats",
    description="Fetch detailed interaction stats about all campaigns for the current user",
    status_code=200,
    response_model=UserCampaignStatsResponse,
)
def get_my_campaign_stats(user_id: CurrentUserID, session: SessionDep):
    handler = get_stats_handler()
    return handler.get_user_campaign_stats(user_id, session)


@router.get(
    "/campaigns/user/{user_id}/stats",
    description="Fetch detailed interaction stats about all campaigns for a specific user",
    status_code=200,
    response_model=UserCampaignStatsResponse,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.VIEW))],
)
def get_user_campaign_stats(user_id: str, session: SessionDep):
    handler = get_stats_handler()
    return handler.get_user_campaign_stats(user_id, session)


