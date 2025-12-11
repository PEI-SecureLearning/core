"""
Org Manager Router - API endpoints for org manager operations.

These endpoints use the user's access token for Keycloak authorization
instead of the admin service account.
"""
from fastapi import APIRouter, HTTPException, Depends, status, File, UploadFile
import csv
import codecs
from pydantic import BaseModel

from src.core.security import oauth_2_scheme, valid_resource_access
from src.core.deps import SessionDep
from src.services import org_manager as org_manager_service
from src.services.campaign import CampaignService
from src.services.realm import realm_from_token
from src.models.email_template import EmailTemplate
from src.models.landing_page_template import LandingPageTemplate
from src.routers import templates as templates_router

router = APIRouter()


class UserCreateRequest(BaseModel):
    username: str
    name: str
    email: str
    role: str
    group_id: str | None = None


class GroupCreateRequest(BaseModel):
    name: str


def _validate_realm_access(token: str, realm: str) -> None:
    """Validate that the token's realm matches the requested realm."""
    token_realm = realm_from_token(token)
    if token_realm and token_realm != realm:
        raise HTTPException(
            status_code=403,
            detail="Realm mismatch: token realm does not match requested realm."
        )


# ============ User Endpoints ============

@router.get("/{realm}/users", dependencies=[Depends(valid_resource_access("org_manager"))])
def list_users(realm: str, token: str = Depends(oauth_2_scheme)):
    """List users in the realm using the user's token."""
    _validate_realm_access(token, realm)
    return org_manager_service.list_users(realm, token)


@router.post("/{realm}/users", dependencies=[Depends(valid_resource_access("org_manager"))])
def create_user(realm: str, user: UserCreateRequest, token: str = Depends(oauth_2_scheme)):
    """Create a user in the realm using the user's token."""
    _validate_realm_access(token, realm)
    return org_manager_service.create_user(
        realm=realm,
        token=token,
        username=user.username,
        name=user.name,
        email=user.email,
        role=user.role,
        group_id=user.group_id,
    )


@router.delete("/{realm}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(valid_resource_access("org_manager"))])
def delete_user(realm: str, user_id: str, token: str = Depends(oauth_2_scheme)):
    """Delete a user from the realm using the user's token."""
    _validate_realm_access(token, realm)
    org_manager_service.delete_user(realm, token, user_id)
    return None


@router.get("/{realm}/campaigns", dependencies=[Depends(valid_resource_access("org_manager"))])
def list_realm_campaigns(realm: str, session: SessionDep, token: str = Depends(oauth_2_scheme)):
    """List campaigns for the specified realm (org manager scope)."""
    _validate_realm_access(token, realm)
    service = CampaignService()
    campaigns = service.get_campaigns(realm, session)
    return {"campaigns": campaigns}


@router.get(
    "/{realm}/campaigns/{campaign_id}",
    dependencies=[Depends(valid_resource_access("org_manager"))],
)
async def get_realm_campaign_detail(
    realm: str, campaign_id: int, session: SessionDep, token: str = Depends(oauth_2_scheme)
):
    """Get campaign detail including linked templates for the specified realm."""
    _validate_realm_access(token, realm)
    service = CampaignService()
    detail = service.get_campaign_by_id(campaign_id, realm, session)
    if not detail:
        raise HTTPException(status_code=404, detail="Campaign not found")

    email_template = None
    landing_page_template = None

    tmpl = session.get(EmailTemplate, detail.email_template_id) if detail.email_template_id else None
    if tmpl and tmpl.content_link:
        try:
            doc = await templates_router.get_template(str(tmpl.content_link))
            email_template = doc.model_dump()  # type: ignore[assignment]
            email_template["content_link"] = tmpl.content_link
        except Exception:
            email_template = None

    ltmpl = session.get(LandingPageTemplate, detail.landing_page_template_id) if detail.landing_page_template_id else None
    if ltmpl and ltmpl.content_link:
        try:
            doc = await templates_router.get_template(str(ltmpl.content_link))
            landing_page_template = doc.model_dump()  # type: ignore[assignment]
            landing_page_template["content_link"] = ltmpl.content_link
        except Exception:
            landing_page_template = None

    return {
        "campaign": detail,
        "email_template": email_template,
        "landing_page_template": landing_page_template,
    }


@router.post("/upload", dependencies=[Depends(valid_resource_access("org_manager"))])
def upload_user_csv(file: UploadFile = File(...)):
    """Upload CSV with user data; accessible to org managers (and admins via policy)."""
    reader = csv.DictReader(codecs.iterdecode(file.file, "utf-8"))
    data = [row for row in reader]
    file.file.close()
    return data


# ============ Group Endpoints ============

@router.get("/{realm}/groups", dependencies=[Depends(valid_resource_access("org_manager"))])
def list_groups(realm: str, token: str = Depends(oauth_2_scheme)):
    """List groups in the realm using the user's token."""
    _validate_realm_access(token, realm)
    return org_manager_service.list_groups(realm, token)


@router.post("/{realm}/groups", status_code=status.HTTP_201_CREATED, dependencies=[Depends(valid_resource_access("org_manager"))])
def create_group(realm: str, group: GroupCreateRequest, token: str = Depends(oauth_2_scheme)):
    """Create a group in the realm using the user's token."""
    _validate_realm_access(token, realm)
    return org_manager_service.create_group(realm, token, group.name)


@router.delete("/{realm}/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(valid_resource_access("org_manager"))])
def delete_group(realm: str, group_id: str, token: str = Depends(oauth_2_scheme)):
    """Delete a group from the realm using the user's token."""
    _validate_realm_access(token, realm)
    org_manager_service.delete_group(realm, token, group_id)
    return None


@router.put("/{realm}/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(valid_resource_access("org_manager"))])
def update_group(realm: str, group_id: str, group: GroupCreateRequest, token: str = Depends(oauth_2_scheme)):
    """Update a group in the realm using the user's token."""
    _validate_realm_access(token, realm)
    org_manager_service.update_group(realm, token, group_id, group.name)
    return None


# ============ Group Membership Endpoints ============

@router.post("/{realm}/groups/{group_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(valid_resource_access("org_manager"))])
def add_user_to_group(realm: str, group_id: str, user_id: str, token: str = Depends(oauth_2_scheme)):
    """Add a user to a group using the user's token."""
    _validate_realm_access(token, realm)
    org_manager_service.add_user_to_group(realm, token, user_id, group_id)
    return None


@router.get("/{realm}/groups/{group_id}/members", dependencies=[Depends(valid_resource_access("org_manager"))])
def list_group_members(realm: str, group_id: str, token: str = Depends(oauth_2_scheme)):
    """List members of a group using the user's token."""
    _validate_realm_access(token, realm)
    return org_manager_service.list_group_members(realm, token, group_id)


@router.delete("/{realm}/groups/{group_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(valid_resource_access("org_manager"))])
def remove_user_from_group(realm: str, group_id: str, user_id: str, token: str = Depends(oauth_2_scheme)):
    """Remove a user from a group using the user's token."""
    _validate_realm_access(token, realm)
    org_manager_service.remove_user_from_group(realm, token, user_id, group_id)
    return None
