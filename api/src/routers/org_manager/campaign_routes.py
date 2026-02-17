"""Campaign routes for org managers."""

from fastapi import APIRouter, Depends, HTTPException, status

from src.core.dependencies import SessionDep
from src.core.security import oauth_2_scheme, Roles
from src.models.email_template import EmailTemplate
from src.models.landing_page_template import LandingPageTemplate
from src.services import templates as template_service
from src.services.campaign import CampaignService
from src.services.org_manager.Validation_handler import validate_realm_access

router = APIRouter()


@router.get("/{realm}/campaigns", dependencies=[Depends(Roles("org_manager", "view"))])
def list_realm_campaigns(realm: str, session: SessionDep, token: str = Depends(oauth_2_scheme)):
    """List campaigns for the specified realm (org manager scope)."""
    validate_realm_access(token, realm)
    service = CampaignService()
    campaigns = service.get_campaigns(realm, session)
    return {"campaigns": campaigns}


@router.get(
    "/{realm}/campaigns/{campaign_id}",
    dependencies=[Depends(Roles("org_manager", "view"))],
)
async def get_realm_campaign_detail(
    realm: str, campaign_id: int, session: SessionDep, token: str = Depends(oauth_2_scheme)
):
    """Get campaign detail including linked templates for the specified realm."""
    validate_realm_access(token, realm)
    service = CampaignService()
    detail = service.get_campaign_by_id(campaign_id, realm, session)
    if not detail:
        raise HTTPException(status_code=404, detail="Campaign not found")

    email_template = None
    landing_page_template = None

    tmpl = session.get(EmailTemplate, detail.email_template_id) if detail.email_template_id else None
    if tmpl and tmpl.content_link:
        try:
            doc = await template_service.get_template(str(tmpl.content_link))
            email_template = doc.model_dump()  # type: ignore[assignment]
            email_template["content_link"] = tmpl.content_link
        except Exception:
            email_template = None

    ltmpl = session.get(LandingPageTemplate, detail.landing_page_template_id) if detail.landing_page_template_id else None
    if ltmpl and ltmpl.content_link:
        try:
            doc = await template_service.get_template(str(ltmpl.content_link))
            landing_page_template = doc.model_dump()  # type: ignore[assignment]
            landing_page_template["content_link"] = ltmpl.content_link
        except Exception:
            landing_page_template = None

    return {
        "campaign": detail,
        "email_template": email_template,
        "landing_page_template": landing_page_template,
    }


@router.delete(
    "/{realm}/campaigns/{campaign_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(Roles("org_manager", "manage"))],
)
def delete_realm_campaign(
    realm: str, campaign_id: int, session: SessionDep, token: str = Depends(oauth_2_scheme)
):
    """Delete a campaign from the realm using the user's token."""
    validate_realm_access(token, realm)
    service = CampaignService()
    service.delete_campaign(campaign_id, realm, session)
    return None
