import os
from datetime import datetime, UTC
import pytest
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from unittest.mock import patch

# Set env vars before imports that might use them
os.environ.update(
    {
        "POSTGRES_SERVER": "localhost",
        "POSTGRES_USER": "testuser",
        "POSTGRES_PASSWORD": "testpassword",
    }
)

from src.services.risk import RiskEvaluationService
from src.models import (
    UserRisk,
    UserProgress,
    ComplianceAcceptance,
    EmailSending,
    EmailSendingStatus,
)
from src.core import risk_config


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


@pytest.fixture(name="risk_service")
def risk_service_fixture():
    return RiskEvaluationService()


def test_get_or_create_user_risk(session: Session, risk_service: RiskEvaluationService):
    user_id = "test-user-1"

    # Test creation
    risk = risk_service._get_or_create_user_risk(user_id, session)
    assert risk.user_id == user_id
    assert risk.k_score == 0.0
    assert risk.e_score == 0.5  # New default after user edit

    # Test retrieval
    risk.k_score = 0.8
    session.add(risk)
    session.commit()

    retrieved = risk_service._get_or_create_user_risk(user_id, session)
    assert retrieved.k_score == 0.8


def test_recalculate_k_factor(session: Session, risk_service: RiskEvaluationService):
    user_id = "test-user-k"

    # Setup course progress
    session.add(UserProgress(user_id=user_id, course_id="c1", course_score=0.8))
    session.add(UserProgress(user_id=user_id, course_id="c2", course_score=0.4))

    # Setup compliance (score 90 -> 0.9)
    session.add(
        ComplianceAcceptance(
            user_identifier=user_id,
            tenant="t1",
            version="v1",
            score=90,
            passed=True,
            attempts=1,
        )
    )
    session.commit()

    # avg_course = 0.6, compliance = 0.9 -> total K = 1.5
    risk_service.recalculate_k_factor(user_id, session)

    risk = session.get(UserRisk, user_id)
    assert risk.k_score == pytest.approx(1.5)


def test_recalculate_k_factor_no_data_defaults_to_zero(
    session: Session, risk_service: RiskEvaluationService
):
    user_id = "test-user-k-empty"

    risk_service.recalculate_k_factor(user_id, session)

    risk = session.get(UserRisk, user_id)
    assert risk.k_score == pytest.approx(0.0)


def test_recalculate_k_factor_handles_exception_logs_error(
    risk_service: RiskEvaluationService,
):
    fake_session = type("FakeSession", (), {})()

    def _raise_exec(_query):
        raise RuntimeError("boom")

    fake_session.exec = _raise_exec

    with patch("src.services.risk.logger.error") as logger_error:
        risk_service.recalculate_k_factor("test-user-k-error", fake_session)
        logger_error.assert_called_once()


def test_recalculate_e_factor_various_states(
    session: Session, risk_service: RiskEvaluationService
):
    user_id = "test-user-e"

    now = datetime.now(UTC).replace(tzinfo=None)
    # Campaign 1: Reported (1.0)
    session.add(
        EmailSending(
            user_id=user_id,
            campaign_id=1,
            sent_at=now,
            scheduled_date=now,
            email_to="test@example.com",
            status=EmailSendingStatus.REPORTED,
            reported_at=now,
        )
    )

    # Campaign 2: Opened but not reported (0.5)
    session.add(
        EmailSending(
            user_id=user_id,
            campaign_id=2,
            sent_at=now,
            scheduled_date=now,
            email_to="test@example.com",
            status=EmailSendingStatus.OPENED,
            opened_at=now,
        )
    )

    # Campaign 3: Clicked (0.25)
    session.add(
        EmailSending(
            user_id=user_id,
            campaign_id=3,
            sent_at=now,
            scheduled_date=now,
            email_to="test@example.com",
            status=EmailSendingStatus.CLICKED,
            clicked_at=now,
        )
    )

    # Campaign 4: Phished (0.0)
    session.add(
        EmailSending(
            user_id=user_id,
            campaign_id=4,
            sent_at=now,
            scheduled_date=now,
            email_to="test@example.com",
            status=EmailSendingStatus.PHISHED,
            phished_at=now,
        )
    )

    session.commit()

    # Average: (1.0 + 0.5 + 0.25 + 0.0) / 4 = 1.75 / 4 = 0.4375
    risk_service.recalculate_e_factor(user_id, session)

    risk = session.get(UserRisk, user_id)
    assert risk.e_score == pytest.approx(0.4375)


def test_recalculate_e_factor_redemption(
    session: Session, risk_service: RiskEvaluationService
):
    user_id = "test-user-redeem"

    now = datetime.now(UTC).replace(tzinfo=None)
    # Opened AND Reported -> Should be 1.0
    session.add(
        EmailSending(
            user_id=user_id,
            campaign_id=1,
            sent_at=now,
            scheduled_date=now,
            email_to="test@example.com",
            status=EmailSendingStatus.REPORTED,
            opened_at=now,
            reported_at=now,
        )
    )
    session.commit()

    risk_service.recalculate_e_factor(user_id, session)
    risk = session.get(UserRisk, user_id)
    assert risk.e_score == 1.0


def test_recalculate_e_factor_no_campaigns(
    session: Session, risk_service: RiskEvaluationService
):
    user_id = "test-user-none"
    # No sendings in DB

    risk_service.recalculate_e_factor(user_id, session)
    risk = session.get(UserRisk, user_id)
    assert risk.e_score == 1.0  # Fallback value


def test_recalculate_e_factor_ignores_invalid_sending_records(
    session: Session, risk_service: RiskEvaluationService
):
    user_id = "test-user-e-invalid"
    now = datetime.now(UTC).replace(tzinfo=None)

    # Missing sent_at -> ignored
    session.add(
        EmailSending(
            user_id=user_id,
            campaign_id=1,
            scheduled_date=now,
            email_to="test@example.com",
            status=EmailSendingStatus.REPORTED,
        )
    )

    # Missing campaign_id -> ignored
    session.add(
        EmailSending(
            user_id=user_id,
            sent_at=now,
            scheduled_date=now,
            email_to="test@example.com",
            status=EmailSendingStatus.PHISHED,
        )
    )

    # Valid record -> counted (reported = 1.0)
    session.add(
        EmailSending(
            user_id=user_id,
            campaign_id=2,
            sent_at=now,
            scheduled_date=now,
            email_to="test@example.com",
            status=EmailSendingStatus.REPORTED,
            reported_at=now,
        )
    )
    session.commit()

    risk_service.recalculate_e_factor(user_id, session)

    risk = session.get(UserRisk, user_id)
    assert risk.e_score == pytest.approx(1.0)


def test_recalculate_e_factor_handles_exception_logs_error(
    risk_service: RiskEvaluationService,
):
    fake_session = type("FakeSession", (), {})()

    def _raise_exec(_query):
        raise RuntimeError("boom")

    fake_session.exec = _raise_exec

    with patch("src.services.risk.logger.error") as logger_error:
        risk_service.recalculate_e_factor("test-user-e-error", fake_session)
        logger_error.assert_called_once()


def test_recalculate_s_factor_sets_hardcoded_value(
    session: Session, risk_service: RiskEvaluationService
):
    user_id = "test-user-s"

    with patch("src.core.risk_config.HARDCODED_S_FACTOR", 0.73):
        risk_service.recalculate_s_factor(user_id, session)

    risk = session.get(UserRisk, user_id)
    assert risk.s_score == pytest.approx(0.73)


def test_recalculate_s_factor_handles_exception_logs_error(
    risk_service: RiskEvaluationService,
):
    with patch.object(
        risk_service, "_get_or_create_user_risk", side_effect=RuntimeError("boom")
    ), patch("src.services.risk.logger.error") as logger_error:
        risk_service.recalculate_s_factor("test-user-s-error", Session)
        logger_error.assert_called_once()


def test_recalculate_total_risk(session: Session, risk_service: RiskEvaluationService):
    user_id = "test-user-total"
    risk = risk_service._get_or_create_user_risk(user_id, session)

    # Set controlled factors
    risk.k_score = 0.5
    risk.s_score = 0.5
    risk.e_score = 0.5
    session.add(risk)
    session.commit()

    # Mock config weights to 1.0 and threshold to 0.0 for easy math
    with patch("src.core.risk_config.RISK_WEIGHT_A", 1.0), patch(
        "src.core.risk_config.RISK_WEIGHT_B", 1.0
    ), patch("src.core.risk_config.RISK_WEIGHT_C", 1.0), patch(
        "src.core.risk_config.RISK_WEIGHT_D", 1.0
    ), patch(
        "src.core.risk_config.RISK_WEIGHT_E", 1.0
    ), patch(
        "src.core.risk_config.RISK_WEIGHT_T", 0.0
    ):

        # z = (1*0.5) + (1*0.5) + (1*0.5) + (1*(0.5*0.5)) + (1*(0.5*0.5)) - 0
        # z = 0.5 + 0.5 + 0.5 + 0.25 + 0.25 = 2.0
        # C = 1 / (1 + exp(-2.0))
        # R = 1 - C

        import math

        expected_z = 2.0
        expected_c = 1 / (1 + math.exp(-expected_z))
        expected_r = 1 - expected_c

        result = risk_service.recalculate_total_risk(user_id, session)

        assert result == pytest.approx(expected_r)
        assert risk.risk_score == pytest.approx(expected_r)


def test_recalculate_total_risk_handles_exception_returns_default(
    risk_service: RiskEvaluationService,
):
    with patch.object(
        risk_service, "_get_or_create_user_risk", side_effect=RuntimeError("boom")
    ), patch("src.services.risk.logger.error") as logger_error:
        result = risk_service.recalculate_total_risk("test-user-total-error", Session)

    assert result == 1.0
    logger_error.assert_called_once()
