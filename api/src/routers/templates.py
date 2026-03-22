from typing import List

from fastapi import APIRouter, Depends, status

from src.core.security import Roles, Resource, Scope
from src.core.dependencies import CurrentRealm, OAuth2Scheme
from src.services.compliance.token_helpers import decode_token_verified
from src.services import templates as template_service
from src.services.templates import TemplateCreate, TemplateUpdate, TemplateOut

router = APIRouter()

def get_org_context(token: str, realm: str) -> tuple[str, bool]:
    claims = decode_token_verified(token)
    roles = claims.get("realm_access", {}).get("roles", [])
    is_content_manager = "content_manager" in roles
    org_id = "platform" if is_content_manager else realm
    return org_id, is_content_manager


@router.get("/templates", dependencies=[Depends(Roles([Resource.CONTENT_MANAGER, Resource.ORG_MANAGER], Scope.VIEW))])
async def list_templates(token: OAuth2Scheme, realm: CurrentRealm) -> List[TemplateOut]:
    org_id, is_content_manager = get_org_context(token, realm)
    return await template_service.list_templates(org_id=org_id, include_platform=not is_content_manager)


@router.get("/templates/{template_id}", dependencies=[Depends(Roles([Resource.CONTENT_MANAGER, Resource.ORG_MANAGER], Scope.VIEW))])
async def get_template(template_id: str, token: OAuth2Scheme, realm: CurrentRealm) -> TemplateOut:
    org_id, is_content_manager = get_org_context(token, realm)
    return await template_service.get_template(template_id, org_id=org_id, can_view_platform=not is_content_manager)


@router.post("/templates", status_code=status.HTTP_201_CREATED, dependencies=[Depends(Roles([Resource.CONTENT_MANAGER, Resource.ORG_MANAGER], Scope.MANAGE))])
async def create_template(template: TemplateCreate, token: OAuth2Scheme, realm: CurrentRealm) -> TemplateOut:
    org_id, _ = get_org_context(token, realm)
    return await template_service.create_template(template, org_id=org_id)


@router.put("/templates/{template_id}", dependencies=[Depends(Roles([Resource.CONTENT_MANAGER, Resource.ORG_MANAGER], Scope.MANAGE))])
async def update_template(template_id: str, template: TemplateUpdate, token: OAuth2Scheme, realm: CurrentRealm) -> TemplateOut:
    org_id, _ = get_org_context(token, realm)
    return await template_service.update_template(template_id, template, org_id=org_id)


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(Roles([Resource.CONTENT_MANAGER, Resource.ORG_MANAGER], Scope.MANAGE))])
async def delete_template(template_id: str, token: OAuth2Scheme, realm: CurrentRealm) -> None:
    org_id, _ = get_org_context(token, realm)
    await template_service.delete_template(template_id, org_id=org_id)
