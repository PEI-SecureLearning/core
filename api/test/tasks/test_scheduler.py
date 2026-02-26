"""Tests for tasks/scheduler: campaign status transitions, email creation, and email dispatch."""

import datetime
import os
import sys

# Set env vars BEFORE any imports from src
os.environ.update({
    "POSTGRES_SERVER": "localhost",
    "POSTGRES_USER": "testuser",
    "POSTGRES_PASSWORD": "testpassword",
    "POSTGRES_DB": "test",
    "RABBITMQ_HOST": "localhost",
    "RABBITMQ_USER": "guest",
    "RABBITMQ_PASS": "guest",
    "RABBITMQ_QUEUE": "test_queue",
    "KEYCLOAK_SERVER_URL": "http://localhost:8080",
    "KEYCLOAK_REALM": "master",
    "KEYCLOAK_CLIENT_ID": "test",
    "KEYCLOAK_CLIENT_SECRET": "test",
})

from unittest.mock import MagicMock, patch

import pytest
from sqlmodel import Session, SQLModel, create_engine, select
from sqlmodel.pool import StaticPool

from src.models.campaign import Campaign, CampaignStatus
from src.models.email_sending import EmailSending, EmailSendingStatus
from src.models.realm import Realm
from src.models.sending_profile import SendingProfile
from src.models.phishing_kit import PhishingKit


# ============================================================================
# Fixtures – Database
# ============================================================================


@pytest.fixture(name="engine")
def engine_fixture():
    """In-memory SQLite engine shared across a single test."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    return engine


@pytest.fixture(name="session")
def session_fixture(engine):
    """Session bound to the in-memory engine."""
    with Session(engine) as session:
        yield session


@pytest.fixture(autouse=True)
def _patch_engine(engine):
    """Replace the real engine with the test engine in the scheduler module."""
    with patch("src.tasks.scheduler.engine", engine):
        yield


# ============================================================================
# Fixtures – Domain Objects
# ============================================================================


@pytest.fixture
def sample_realm(session: Session) -> Realm:
    """Create a test realm."""
    realm = Realm(name="test_realm", domain="test.example.com")
    session.add(realm)
    session.commit()
    session.refresh(realm)
    return realm


@pytest.fixture
def sample_sending_profile(session: Session, sample_realm: Realm) -> SendingProfile:
    """Create a test sending profile."""
    profile = SendingProfile(
        name="test_profile",
        smtp_host="smtp.example.com",
        smtp_port=587,
        username="user@example.com",
        password="password",
        from_fname="John",
        from_lname="Doe",
        from_email="john@example.com",
        realm_name=sample_realm.name,
    )
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile


@pytest.fixture
def sample_phishing_kit(session: Session, sample_realm: Realm) -> PhishingKit:
    """Create a test phishing kit."""
    kit = PhishingKit(
        name="test_kit",
        realm_name=sample_realm.name,
    )
    session.add(kit)
    session.commit()
    session.refresh(kit)
    return kit


# ============================================================================
# Helpers – Factory functions
# ============================================================================


def make_campaign(
    session: Session,
    *,
    name: str = "test_campaign",
    realm_name: str = "test_realm",
    sending_profile_id: int = 1,
    status: CampaignStatus = CampaignStatus.SCHEDULED,
    begin_date: datetime.datetime | None = None,
    end_date: datetime.datetime | None = None,
    total_recipients: int = 0,
) -> Campaign:
    """Insert and return a Campaign with sensible defaults.

    `begin_date` and `end_date` default to ±1 day from now when not supplied.
    """
    now = datetime.datetime.now()
    campaign = Campaign(
        name=name,
        realm_name=realm_name,
        sending_profile_id=sending_profile_id,
        status=status,
        begin_date=begin_date or now - datetime.timedelta(days=1),
        end_date=end_date or now + datetime.timedelta(days=1),
        total_recipients=total_recipients,
    )
    session.add(campaign)
    session.commit()
    session.refresh(campaign)
    return campaign


def make_email_sending(
    session: Session,
    *,
    campaign_id: int,
    user_id: str = "user-1",
    email_to: str = "user@example.com",
    status: EmailSendingStatus = EmailSendingStatus.SCHEDULED,
    scheduled_date: datetime.datetime | None = None,
    sent_at: datetime.datetime | None = None,
) -> EmailSending:
    """Insert and return an EmailSending with sensible defaults."""
    sending = EmailSending(
        user_id=user_id,
        email_to=email_to,
        campaign_id=campaign_id,
        status=status,
        scheduled_date=scheduled_date or datetime.datetime.now(),
        sent_at=sent_at,
    )
    session.add(sending)
    session.commit()
    session.refresh(sending)
    return sending


# ============================================================================
# Helpers – Time shortcuts
# ============================================================================


def past(**kwargs) -> datetime.datetime:
    """Return a datetime in the past. Accepts timedelta kwargs (hours, days, …)."""
    return datetime.datetime.now() - datetime.timedelta(**kwargs)


def future(**kwargs) -> datetime.datetime:
    """Return a datetime in the future. Accepts timedelta kwargs (hours, days, …)."""
    return datetime.datetime.now() + datetime.timedelta(**kwargs)


# ============================================================================
# Tests – update_campaign_statuses
# ============================================================================


class TestUpdateCampaignStatuses:
    """Transition tests for the scheduler job that moves campaigns
    through SCHEDULED → RUNNING → COMPLETED based on current time."""

    # TODO: your tests here


# ============================================================================
# Tests – create_emails_for_ready_campaigns
# ============================================================================


class TestCreateEmailsForReadyCampaigns:
    """Tests for the job that materialises EmailSending rows
    when a SCHEDULED campaign's begin_date has arrived."""

    # TODO: your tests here


# ============================================================================
# Tests – process_pending_emails
# ============================================================================


class TestProcessPendingEmails:
    """Tests for the batched email dispatch job that sends
    SCHEDULED EmailSendings to RabbitMQ."""

    # TODO: your tests here
