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

from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException
from pytest import approx
from sqlmodel import Session, SQLModel, create_engine, select
from sqlmodel.pool import StaticPool

from src.models import RealmRiskConfiguration, SurveyResponse, UserProgress, UserRisk
from src.models.survey import SurveyAnswer, SurveyQuestion, SurveyTemplateOut
from src.services import survey as survey_service
from src.services.realm_risk_configuration import (
    get_effective_realm_risk_configuration,
    upsert_realm_risk_configuration,
)


@pytest.fixture(name="engine")
def engine_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    return engine


@pytest.fixture(name="session")
def session_fixture(engine):
    with Session(engine) as session:
        yield session


def _course_survey_template() -> SurveyTemplateOut:
    return SurveyTemplateOut(
        id="survey-1",
        survey_type="learner-course",
        realm_name="tenant-a",
        course_id="course-1",
        title="Course Survey",
        description="demo",
        questions=[
            SurveyQuestion(
                id="q1",
                prompt="How clear was the content?",
                options=["1", "2", "3"],
                reverse_scored=False,
                weight=1.0,
            ),
            SurveyQuestion(
                id="q2",
                prompt="How overloaded did you feel?",
                options=["Low", "High"],
                reverse_scored=True,
                weight=1.0,
            ),
        ],
    )


def test_calculate_normalized_sentiment_handles_reverse_scoring():
    template = _course_survey_template()
    score = survey_service.calculate_normalized_sentiment(
        template,
        [
            SurveyAnswer(id="q1", choice=1),
            SurveyAnswer(id="q2", choice=0),
        ],
    )

    assert score == approx(0.75)


def test_calculate_normalized_sentiment_rejects_bad_payload():
    template = _course_survey_template()

    with pytest.raises(HTTPException):
        survey_service.calculate_normalized_sentiment(
            template,
            [SurveyAnswer(id="missing", choice=0)],
        )


def test_get_effective_realm_risk_configuration_uses_defaults_when_missing(
    session: Session,
):
    record = get_effective_realm_risk_configuration(session, "tenant-a")

    assert record.realm_name == "tenant-a"
    assert record.weight_a == approx(1.0)
    assert record.weight_t == approx(1.0)


def test_upsert_realm_risk_configuration_updates_existing_row(session: Session):
    session.add(
        RealmRiskConfiguration(
            realm_name="tenant-a",
            weight_a=1.0,
            weight_b=1.0,
            weight_c=1.0,
            weight_d=1.0,
            weight_e=1.0,
            weight_t=1.0,
        )
    )
    session.commit()

    updated = upsert_realm_risk_configuration(
        session,
        "tenant-a",
        weight_b=2.5,
        weight_t=0.25,
    )

    assert updated.weight_a == approx(1.0)
    assert updated.weight_b == approx(2.5)
    assert updated.weight_t == approx(0.25)


@pytest.mark.anyio
async def test_submit_course_survey_persists_response_and_recalculates_risk(
    session: Session, monkeypatch
):
    user_id = "user-1"
    course_id = "course-1"
    session.add(
        UserProgress(
            user_id=user_id,
            course_id=course_id,
            realm_name="tenant-a",
            progress_data={},
            completed_sections=[],
        )
    )
    session.commit()

    monkeypatch.setattr(
        survey_service,
        "get_learner_course_survey",
        AsyncMock(return_value=_course_survey_template()),
    )

    result = await survey_service.submit_course_survey(
        session=session,
        user_id=user_id,
        course_id=course_id,
        realm_name="tenant-a",
        answers=[SurveyAnswer(id="q1", choice=1), SurveyAnswer(id="q2", choice=0)],
    )

    progress = session.get(UserProgress, {"user_id": user_id, "course_id": course_id})
    response = session.exec(
        select(SurveyResponse).where(SurveyResponse.user_id == user_id)
    ).first()
    risk = session.get(UserRisk, user_id)

    assert result.normalized_score == approx(0.75)
    assert response is not None
    assert response.normalized_score == approx(0.75)
    assert progress is not None
    assert progress.sentiment_score == approx(0.75)
    assert risk is not None
    assert risk.s_score == approx(0.75)
    assert risk.risk_score < 1.0