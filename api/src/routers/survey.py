from fastapi import APIRouter, Depends

from src.core.dependencies import OAuth2Scheme, SessionDep
from src.models import SurveyResponse
from src.models.survey import SurveyAnswer, SurveyTemplateOut
from src.services.compliance.token_helpers import require_tenant_learner_context
from src.services import survey as survey_service

router = APIRouter(prefix="/learner", tags=["survey"])


@router.get("/courses/{course_id}/survey", response_model=SurveyTemplateOut)
async def get_course_survey(
    course_id: str,
    token: OAuth2Scheme,
):
    _, realm_name = require_tenant_learner_context(token)
    return await survey_service.get_learner_course_survey(course_id, realm_name)


@router.patch(
    "/users/{user_id}/course-progress/{course_id}",
    response_model=SurveyResponse,
)
async def submit_course_survey(
    user_id: str,
    course_id: str,
    payload: list[SurveyAnswer],
    session: SessionDep,
    token: OAuth2Scheme,
) -> SurveyResponse:
    token_user_id, realm_name = require_tenant_learner_context(token)
    if token_user_id != user_id:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot submit survey for another user.",
        )

    return await survey_service.submit_course_survey(
        session=session,
        user_id=user_id,
        course_id=course_id,
        realm_name=realm_name,
        answers=payload,
    )
