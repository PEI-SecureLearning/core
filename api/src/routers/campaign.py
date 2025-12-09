from fastapi import APIRouter, Depends, HTTPException

from core.deps import CurrentRealm, SessionDep
from models.campaign import CampaignCreate
from services.campaign import CampaignService


router = APIRouter()

service = CampaignService()


@router.post("/campaigns", description="Create a new campaign", status_code=201)
def create_campaign(
    campaign: CampaignCreate, current_realm: CurrentRealm, session: SessionDep
):
    if not service.create_campaign(campaign, current_realm, session):
        raise HTTPException(status_code=400, detail="Failed to create campaign")
    return {"message": "Campaign created successfully"}


@router.get("/campaigns", description="Fetch all campaigns", status_code=200)
def get_campaigns(current_realm: CurrentRealm, session: SessionDep):
    campaigns = service.get_campaigns(current_realm, session)
    return campaigns


@router.get("/campaigns/{id}", description="Fetch campaign by ID", status_code=200)
def get_campaign_by_id(id: int, current_realm: CurrentRealm, session: SessionDep):
    campaign = service.get_campaign_by_id(id, current_realm, session)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign
