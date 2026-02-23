"""Tests for CampaignService (specifically campaign_handler methods)."""

import datetime
from unittest.mock import MagicMock, patch

import pytest
import os

os.environ.update({
    "POSTGRES_SERVER": "localhost",
    "POSTGRES_USER": "testuser",
    "POSTGRES_PASSWORD": "testpassword",
    "RABBITMQ_HOST": "localhost",
    "RABBITMQ_USER": "guest",
    "RABBITMQ_PASS": "guest",
    "RABBITMQ_QUEUE": "email_queue",
})

from fastapi import HTTPException
from sqlmodel import Session, SQLModel, create_engine, select
from sqlmodel.pool import StaticPool

from src.models.campaign import Campaign, CampaignCreate, CampaignStatus
from src.models.email_sending import EmailSending
from src.models.email_template import EmailTemplate
from src.models.landing_page import LandingPageTemplate
from src.models.phishing_kit import PhishingKit
from src.models.realm import Realm
from src.models.sending_profile import SendingProfile
from src.models.user import User
from src.services.campaign import CampaignService


# ============================================================================
# Fixtures
# ============================================================================


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


@pytest.fixture(name="service")
def service_fixture():
    return CampaignService()


@pytest.fixture(autouse=True)
def mock_rabbitmq():
    """Mock the RabbitMQService globally for all tests in this file."""
    with patch("src.services.campaign.email_handler.RabbitMQService") as mock:
        yield mock


@pytest.fixture(autouse=True)
def mock_platform_admin():
    """Mock the platform admin service globally to return fake Keycloak members."""
    with patch("src.services.campaign.campaign_handler.get_platform_admin_service") as mock_get:
        mock_service = MagicMock()
        mock_get.return_value = mock_service
        
        # Default mock: 3 users split across 2 groups (user-2 is in both)
        mock_service.list_group_members_in_realm.side_effect = lambda r, g: {
            "members": [
                {"id": "user-1", "email": "u1@example.com"},
                {"id": "user-2", "email": "u2@example.com"}
            ] if g == "group-1" else [
                {"id": "user-2", "email": "u2@example.com"},
                {"id": "user-3", "email": "u3@example.com"}
            ]
        }
        yield mock_service


# ============================================================================
# Helpers
# ============================================================================


def _setup_realm_and_user(session: Session, realm_name: str = "test-realm") -> User:
    """Create a basic realm and a creator user."""
    session.add(Realm(name=realm_name, domain=f"{realm_name}.local"))
    
    keycloak_id = f"creator-{realm_name}"
    user = session.exec(select(User).where(User.keycloak_id == keycloak_id)).first()
    if not user:
        user = User(keycloak_id=keycloak_id, email=f"admin_{realm_name}@example.com", dept="IT")
        session.add(user)
        
    session.commit()
    session.refresh(user)
    return user


def _create_kit(session: Session, realm_name: str = "test-realm", suffix: str = "1") -> PhishingKit:
    """Create a fully assembled PhishingKit with its templates."""
    email_tpl = EmailTemplate(name=f"ET-{suffix}", subject=f"Subj {suffix}", content_link=f"/et/{suffix}")
    landing_tpl = LandingPageTemplate(name=f"LP-{suffix}", content_link=f"/lp/{suffix}")
    profile = SendingProfile(
        name=f"SP-{suffix}", smtp_host="localhost", smtp_port=25,
        username="u", password="p", from_fname="F", from_lname="L",
        from_email="f@l.com", realm_name=realm_name
    )
    
    session.add(email_tpl)
    session.add(landing_tpl)
    session.add(profile)
    session.commit()
    
    kit = PhishingKit(
        name=f"Kit {suffix}",
        email_template_id=email_tpl.id,
        landing_page_template_id=landing_tpl.id,
        sending_profile_id=profile.id,
        realm_name=realm_name,
        args={"arg1": "val1"}
    )
    session.add(kit)
    session.commit()
    session.refresh(kit)
    return kit


# ============================================================================
# Tests: Helpers (_calculate_interval, _collect_users_from_groups)
# ============================================================================


class TestCampaignHelpers:

    def test_collect_users_from_groups_deduplication(self, service: CampaignService):
        """Ensure users shared between groups only get one email."""
        # Note: using the global mock_platform_admin.
        # "group-1" has user-1, user-2
        # "group-2" has user-2, user-3
        users = service._collect_users_from_groups(["group-1", "group-2"], "test-realm")
        
        assert len(users) == 3
        assert "user-1" in users
        assert "user-2" in users  # Only counted once
        assert "user-3" in users

    def test_calculate_interval_respects_minimum(self, service: CampaignService):
        """Ensure the MIN_INTERVAL_SECONDS is respected even on very short campaigns."""
        from src.models.campaign import MIN_INTERVAL_SECONDS    
        
        now = datetime.datetime.now(datetime.timezone.utc)
        # Campaign lasts 10 seconds, but min interval is usually 60s
        data = CampaignCreate(
            name="Short",
            begin_date=now,
            end_date=now + datetime.timedelta(seconds=10),
            sending_interval_seconds=0,
            phishing_kit_ids=[],
            user_group_ids=[],
            creator_id="test",
        )
        
        interval = service._calculate_interval(data, user_count=5)
        # Should force the ceiling to be at least MIN_INTERVAL_SECONDS
        assert interval == MIN_INTERVAL_SECONDS


# ============================================================================
# Tests: create_campaign
# ============================================================================


class TestCreateCampaign:
    
    def test_create_campaign_success_and_m2m_linking(
        self, service: CampaignService, session: Session
    ):
        """Verify successful creation, interval calculation, and PhishingKit linking."""
        # Arrange
        user = _setup_realm_and_user(session)
        kit1 = _create_kit(session, suffix="First")
        kit2 = _create_kit(session, suffix="Second")
        
        now = datetime.datetime.now(datetime.timezone.utc)
        ten_mins_later = now + datetime.timedelta(days=1)
        
        data = CampaignCreate(
            name="Test Campaign",
            begin_date=now,
            end_date=ten_mins_later,
            sending_interval_seconds=120, # Minimum 2 minutes between sends
            phishing_kit_ids=[kit1.id, kit2.id],
            user_group_ids=["group-1", "group-2"],  # Mock returns 3 unique users
            creator_id=user.keycloak_id,
        )
        
        # Act
        campaign = service.create_campaign(data, "test-realm", session)
        
        # Assert
        assert campaign.id is not None
        assert campaign.name == "Test Campaign"
        assert campaign.realm_name == "test-realm"
        assert campaign.total_recipients == 3
        assert campaign.status == CampaignStatus.SCHEDULED  
        
        # Verify M2M linking worked
        assert len(campaign.phishing_kits) == 2
        kit_names = {k.name for k in campaign.phishing_kits}
        assert "Kit First" in kit_names
        assert "Kit Second" in kit_names
        
        # Verify EmailSendings were not created yet
        sendings = session.exec(
            select(EmailSending).where(EmailSending.campaign_id == campaign.id)
        ).all()
        assert len(sendings) == 0


    def test_create_campaign_invalid_kit_id(
        self, service: CampaignService, session: Session
    ):
        """Validation fail: Passing a phishing kit ID that doesn't exist."""
        creator = _setup_realm_and_user(session)
        now = datetime.datetime.now()
        data = CampaignCreate(
            name="Bad Kit",
            begin_date=now,
            end_date=now + datetime.timedelta(days=1),
            sending_interval_seconds=60,
            phishing_kit_ids=[9999], # DOES NOT EXIST
            user_group_ids=["group-1"],
            creator_id=creator.keycloak_id,
        )
        
        with pytest.raises(HTTPException) as exc:
            service.create_campaign(data, "test-realm", session)
            
        assert exc.value.status_code == 400
        assert "Invalid phishing kit ID" in exc.value.detail

    def test_create_campaign_invalid_creator(
        self, service: CampaignService, session: Session
    ):
        """Validation fail: Missing creator."""
        kit = _create_kit(session)
        now = datetime.datetime.now()
        data = CampaignCreate(
            name="Bad Creator",
            begin_date=now,
            end_date=now + datetime.timedelta(days=1),
            sending_interval_seconds=60,
            phishing_kit_ids=[kit.id],
            user_group_ids=["group-1"],
            creator_id="nobody", # DOES NOT EXIST
        )
        
        with pytest.raises(HTTPException) as exc:
            service.create_campaign(data, "test-realm", session)
            
        assert exc.value.status_code == 400
        assert "Invalid creator ID" in exc.value.detail


# ============================================================================
# Tests: get_campaigns and get_campaign_by_id
# ============================================================================


class TestGetCampaigns:

    def test_get_campaigns_returns_only_for_realm(self, service: CampaignService, session: Session):
        """Verify get_campaigns only returns campaigns belonging to the specified realm."""
        user1 = _setup_realm_and_user(session, realm_name="realm-a")
        user2 = _setup_realm_and_user(session, realm_name="realm-b")
        
        now = datetime.datetime.now()
        end = now + datetime.timedelta(days=1)
        
        # Create campaigns in realm A
        c1 = Campaign(name="Camp A1", realm_name="realm-a", total_recipients=10, sending_interval_seconds=60, begin_date=now, end_date=end)
        c2 = Campaign(name="Camp A2", realm_name="realm-a", total_recipients=5, sending_interval_seconds=60, begin_date=now, end_date=end)
        
        # Create campaign in realm B
        c3 = Campaign(name="Camp B1", realm_name="realm-b", total_recipients=15, sending_interval_seconds=60, begin_date=now, end_date=end)
        
        session.add_all([c1, c2, c3])
        session.commit()
        
        # Fetch for realm A
        results_a = service.get_campaigns("realm-a", session)
        assert len(results_a) == 2
        names_a = {c.name for c in results_a}
        assert "Camp A1" in names_a
        assert "Camp A2" in names_a
        
        # Fetch for realm B
        results_b = service.get_campaigns("realm-b", session)
        assert len(results_b) == 1
        assert results_b[0].name == "Camp B1"
        
        # Fetch for empty realm
        results_empty = service.get_campaigns("realm-empty", session)
        assert len(results_empty) == 0



