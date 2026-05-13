from fastapi import APIRouter, Depends

from src.core.dependencies import OAuth2Scheme, SessionDep
from src.core.security import Roles, Resource, Scope
from src.models import RealmRiskConfigurationPatch, RealmRiskConfigurationRead
from src.models.survey import SurveyTemplateOut
from src.services import survey as survey_service
from src.services.compliance.token_helpers import get_user_and_tenant
from src.services.org_manager.validation_handler import validate_realm_access
from src.services.realm_risk_configuration import (
    get_effective_realm_risk_configuration,
    upsert_realm_risk_configuration,
)

router = APIRouter()


@router.get(
    "/surveys/executive",
    response_model=SurveyTemplateOut,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.VIEW))],
)
async def get_executive_survey(token: OAuth2Scheme):
    _, realm_name = get_user_and_tenant(token)
    return await survey_service.get_executive_survey(realm_name)


@router.get(
    "/tenants/{tenant_id}/risk-weights",
    response_model=RealmRiskConfigurationRead,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.VIEW))],
)
def get_risk_weights(tenant_id: str, session: SessionDep, token: OAuth2Scheme):
    validate_realm_access(token, tenant_id)
    record = get_effective_realm_risk_configuration(session, tenant_id)
    return RealmRiskConfigurationRead.model_validate(record)


@router.patch(
    "/tenants/{tenant_id}/risk-weights",
    response_model=RealmRiskConfigurationRead,
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.MANAGE))],
)
def patch_risk_weights(
    tenant_id: str,
    payload: RealmRiskConfigurationPatch,
    session: SessionDep,
    token: OAuth2Scheme,
):
    validate_realm_access(token, tenant_id)
    updated = upsert_realm_risk_configuration(
        session,
        tenant_id,
        **{
            key: value
            for key, value in payload.model_dump().items()
            if value is not None
        },
    )
    return RealmRiskConfigurationRead.model_validate(updated)
