import os

os.environ.update(
    {
        "POSTGRES_SERVER": "localhost",
        "POSTGRES_USER": "testuser",
        "POSTGRES_PASSWORD": "testpassword",
        "RABBITMQ_HOST": "localhost",
        "RABBITMQ_USER": "guest",
        "RABBITMQ_PASS": "guest",
        "RABBITMQ_QUEUE": "email_queue",
    }
)

from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException
from pytest import approx

from src.models import RealmRiskConfiguration, RealmRiskConfigurationPatch, RealmRiskConfigurationRead, SurveyResponse
from src.models.survey import SurveyAnswer, SurveyQuestion, SurveyTemplateOut
from src.routers import survey as learner_routes
from src.routers.org_manager import survey_routes as org_manager_routes


def _template() -> SurveyTemplateOut:
    return SurveyTemplateOut(
        survey_type="learner-course",
        realm_name="tenant-a",
        course_id="course-1",
        title="Course Survey",
        questions=[
            SurveyQuestion(
                id="q1",
                prompt="Q1",
                options=["1", "2"],
                reverse_scored=False,
                weight=1.0,
            )
        ],
    )


@pytest.mark.anyio
async def test_get_course_survey_uses_learner_context(monkeypatch):
    token = "fake-token"
    mock_context = MagicMock(return_value=("user-1", "tenant-a"))
    mock_service = AsyncMock(return_value=_template())

    monkeypatch.setattr(learner_routes, "require_tenant_learner_context", mock_context)
    monkeypatch.setattr(
        learner_routes.survey_service,
        "get_learner_course_survey",
        mock_service,
    )

    result = await learner_routes.get_course_survey(course_id="course-1", token=token)

    assert result.course_id == "course-1"
    mock_context.assert_called_once_with(token)
    mock_service.assert_awaited_once_with("course-1", "tenant-a")


@pytest.mark.anyio
async def test_submit_course_survey_rejects_other_user(monkeypatch):
    token = "fake-token"
    mock_context = MagicMock(return_value=("user-1", "tenant-a"))
    session = MagicMock()

    monkeypatch.setattr(learner_routes, "require_tenant_learner_context", mock_context)

    with pytest.raises(HTTPException) as exc:
        await learner_routes.submit_course_survey(
            user_id="user-2",
            course_id="course-1",
            payload=[SurveyAnswer(id="q1", choice=1)],
            session=session,
            token=token,
        )

    assert exc.value.status_code == 403


@pytest.mark.anyio
async def test_submit_course_survey_calls_service(monkeypatch):
    token = "fake-token"
    session = MagicMock()
    mock_context = MagicMock(return_value=("user-1", "tenant-a"))
    mock_submit = AsyncMock(
        return_value=SurveyResponse(
            id=1,
            user_id="user-1",
            course_id="course-1",
            normalized_score=0.5,
        )
    )

    monkeypatch.setattr(learner_routes, "require_tenant_learner_context", mock_context)
    monkeypatch.setattr(
        learner_routes.survey_service,
        "submit_course_survey",
        mock_submit,
    )

    result = await learner_routes.submit_course_survey(
        user_id="user-1",
        course_id="course-1",
        payload=[SurveyAnswer(id="q1", choice=1)],
        session=session,
        token=token,
    )

    assert result.normalized_score == approx(0.5)
    mock_submit.assert_awaited_once()


@pytest.mark.anyio
async def test_get_executive_survey_uses_token_tenant(monkeypatch):
    token = "fake-token"
    mock_context = MagicMock(return_value=("user-1", "tenant-a"))
    mock_service = AsyncMock(return_value=_template())

    monkeypatch.setattr(org_manager_routes, "get_user_and_tenant", mock_context)
    monkeypatch.setattr(
        org_manager_routes.survey_service,
        "get_executive_survey",
        mock_service,
    )

    result = await org_manager_routes.get_executive_survey(token=token)

    assert result.survey_type == "learner-course"
    mock_context.assert_called_once_with(token)
    mock_service.assert_awaited_once_with("tenant-a")


def test_get_risk_weights_returns_current_configuration(monkeypatch):
    session = MagicMock()
    token = "fake-token"
    mock_validate = MagicMock()
    mock_config = RealmRiskConfiguration(
        realm_name="tenant-a",
        weight_a=1.0,
        weight_b=2.0,
        weight_c=3.0,
        weight_d=4.0,
        weight_e=5.0,
        weight_t=6.0,
    )
    mock_fetch = MagicMock(return_value=mock_config)

    monkeypatch.setattr(org_manager_routes, "validate_realm_access", mock_validate)
    monkeypatch.setattr(
        org_manager_routes,
        "get_effective_realm_risk_configuration",
        mock_fetch,
    )

    result = org_manager_routes.get_risk_weights(
        tenant_id="tenant-a", session=session, token=token
    )

    assert result.weight_b == approx(2.0)
    mock_validate.assert_called_once_with(token, "tenant-a")
    mock_fetch.assert_called_once_with(session, "tenant-a")


def test_patch_risk_weights_filters_none_values(monkeypatch):
    session = MagicMock()
    token = "fake-token"
    mock_validate = MagicMock()
    mock_updated = RealmRiskConfiguration(
        realm_name="tenant-a",
        weight_a=1.0,
        weight_b=2.0,
        weight_c=3.0,
        weight_d=4.0,
        weight_e=5.0,
        weight_t=6.0,
    )
    mock_upsert = MagicMock(return_value=mock_updated)

    monkeypatch.setattr(org_manager_routes, "validate_realm_access", mock_validate)
    monkeypatch.setattr(
        org_manager_routes,
        "upsert_realm_risk_configuration",
        mock_upsert,
    )

    result = org_manager_routes.patch_risk_weights(
        tenant_id="tenant-a",
        payload=RealmRiskConfigurationPatch(
            weight_a=1.5,
            weight_b=2.0,
            weight_c=3.0,
            weight_d=4.0,
            weight_e=5.0,
            weight_t=6.0,
        ),
        session=session,
        token=token,
    )

    assert result.weight_a == approx(1.0)
    mock_validate.assert_called_once_with(token, "tenant-a")
    mock_upsert.assert_called_once()