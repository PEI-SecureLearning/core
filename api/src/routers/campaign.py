from fastapi import APIRouter, Depends, HTTPException

from src.core.deps import SessionDep
from src.models.campaign import CampaignCreate
from src.services.campaign import CampaignService


router = APIRouter()

service = CampaignService()


@router.post("/campaigns", description="Create a new campaign", status_code=201)
def create_campaign(campaign: CampaignCreate, session: SessionDep):
    if not service.create_campaign(campaign, session):
        raise HTTPException(status_code=400, detail="Failed to create campaign")
    return {"message": "Campaign created successfully"}


@router.get("/campaigns", description="Fetch all campaigns", status_code=200)
def get_campaigns(session: SessionDep):
    campaigns = service.get_all_campaigns(session)
    return campaigns
