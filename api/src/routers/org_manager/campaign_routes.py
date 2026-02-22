"""Campaign routes for org managers."""

from fastapi import APIRouter, Depends, HTTPException, status

from src.core.dependencies import SessionDep, OAuth2Scheme
from src.core.security import Roles
from src.models.phishing_kit import PhishingKitDisplayInfo
from src.services import templates as template_service
from src.services.campaign import CampaignService
from src.services.org_manager.validation_handler import validate_realm_access

router = APIRouter()


@router.get("/{realm}/campaigns", dependencies=[Depends(Roles("org_manager", "view"))])
def list_realm_campaigns(realm: str, session: SessionDep, token: OAuth2Scheme):
    """List campaigns for the specified realm (org manager scope)."""
    validate_realm_access(token, realm)
    service = CampaignService()
    campaigns = service.get_campaigns(realm, session)
    return {"campaigns": campaigns}


@router.get(
    "/{realm}/campaigns/{campaign_id}",
    dependencies=[Depends(Roles("org_manager", "view"))],
    responses={404: {"description": "Campaign not found"}},
)
async def get_realm_campaign_detail(
    realm: str, campaign_id: int, session: SessionDep, token: OAuth2Scheme
):
    """Get campaign detail including linked phishing kits for the specified realm."""
    validate_realm_access(token, realm)
    service = CampaignService()
    detail = service.get_campaign_by_id(campaign_id, realm, session)
    if not detail:
        raise HTTPException(status_code=404, detail="Campaign not found")

    return {
        "campaign": detail,
    }


@router.delete(
    "/{realm}/campaigns/{campaign_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(Roles("org_manager", "manage"))],
)
def delete_realm_campaign(
    realm: str, campaign_id: int, session: SessionDep, token: OAuth2Scheme
):
    """Delete a campaign from the realm using the user's token."""
    validate_realm_access(token, realm)
    service = CampaignService()
    service.delete_campaign(campaign_id, realm, session)
    return None
