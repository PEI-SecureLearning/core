"""Shared fixtures and mocks for scheduler task tests."""

import os
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from src.models import (
    Campaign,
    CampaignStatus,
    EmailTemplate,
    LandingPageTemplate,
    PhishingKit,
    Realm,
    SendingProfile,
    User,
    UserDTO,
    UserGroup,
)

# Keep env defaults local to task tests so importing app modules is stable.
os.environ.setdefault("POSTGRES_SERVER", "localhost")
os.environ.setdefault("POSTGRES_USER", "testuser")
os.environ.setdefault("POSTGRES_PASSWORD", "testpassword")
os.environ.setdefault("POSTGRES_DB", "test")
os.environ.setdefault("RABBITMQ_HOST", "localhost")
os.environ.setdefault("RABBITMQ_USER", "guest")
os.environ.setdefault("RABBITMQ_PASS", "guest")
os.environ.setdefault("RABBITMQ_QUEUE", "test_queue")
os.environ.setdefault("KEYCLOAK_SERVER_URL", "http://localhost:8080")
os.environ.setdefault("KEYCLOAK_REALM", "master")
os.environ.setdefault("KEYCLOAK_CLIENT_ID", "test")
os.environ.setdefault("KEYCLOAK_CLIENT_SECRET", "test")

USER_1_EMAIL = "u1@example.com"
USER_2_EMAIL = "u2@example.com"
USER_3_EMAIL = "u3@example.com"


@pytest.fixture(name="engine")
def engine_fixture():
    """In-memory SQLite engine shared by each test."""
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
def patch_scheduler_engine(engine):
    """Force scheduler tasks to use in-memory DB."""
    with patch("src.tasks.scheduler.engine", engine):
        yield


@pytest.fixture(autouse=True)
def mock_platform_admin_service():
    """Mock Keycloak group member lookup for campaign user collection."""
    with patch(
        "src.services.campaign.campaign_handler.get_platform_admin_service"
    ) as mock_get:
        mock_service = MagicMock()
        mock_get.return_value = mock_service
        mock_service.list_group_members_in_realm.side_effect = (
            lambda _realm, group_id: (
                [
                    UserDTO(id="user-1", email=USER_1_EMAIL),
                    UserDTO(id="user-2", email=USER_2_EMAIL),
                ]
                if group_id == "group-1"
                else [
                    UserDTO(id="user-2", email=USER_2_EMAIL),
                    UserDTO(id="user-3", email=USER_3_EMAIL),
                ]
            )
        )
        yield mock_service


@pytest.fixture(autouse=True)
def mock_rabbitmq_service():
    """Mock RabbitMQ sender used by campaign email handler."""
    with patch("src.services.campaign.email_handler.rabbitmq_service") as mock_rabbit:
        yield mock_rabbit


@pytest.fixture
def realm(session: Session) -> Realm:
    realm = Realm(name="test-realm", domain="test.local")
    session.add(realm)
    session.commit()
    session.refresh(realm)
    return realm


@pytest.fixture
def user_groups(session: Session):
    group_1 = UserGroup(keycloak_id="group-1")
    group_2 = UserGroup(keycloak_id="group-2")
    session.add(group_1)
    session.add(group_2)
    session.commit()
    return [group_1, group_2]


@pytest.fixture
def users(session: Session):
    user_items = [
        User(keycloak_id="user-1", email=USER_1_EMAIL),
        User(keycloak_id="user-2", email=USER_2_EMAIL),
        User(keycloak_id="user-3", email=USER_3_EMAIL),
    ]
    session.add_all(user_items)
    session.commit()
    return user_items


@pytest.fixture
def sending_profile(session: Session, realm: Realm) -> SendingProfile:
    profile = SendingProfile(
        name="default-profile",
        smtp_host="smtp.example.com",
        smtp_port=587,
        username="sender@example.com",
        password="test-password",
        from_fname="Secure",
        from_lname="Learning",
        from_email="sender@example.com",
        realm_name=realm.name,
    )
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile


@pytest.fixture
def email_template(session: Session) -> EmailTemplate:
    template = EmailTemplate(
        name="template-1",
        subject="Security awareness",
        content_link="template://email-1",
    )
    session.add(template)
    session.commit()
    session.refresh(template)
    return template


@pytest.fixture
def landing_page_template(session: Session) -> LandingPageTemplate:
    page = LandingPageTemplate(name="landing-1", content_link="template://landing-1")
    session.add(page)
    session.commit()
    session.refresh(page)
    return page


@pytest.fixture
def phishing_kit(
    session: Session,
    realm: Realm,
    email_template: EmailTemplate,
    landing_page_template: LandingPageTemplate,
    sending_profile: SendingProfile,
) -> PhishingKit:
    kit = PhishingKit(
        name="kit-1",
        realm_name=realm.name,
        email_template_id=email_template.id,
        landing_page_template_id=landing_page_template.id,
    )
    kit.sending_profiles.append(sending_profile)
    session.add(kit)
    session.commit()
    session.refresh(kit)
    return kit


@pytest.fixture
def campaign_factory(
    session: Session, realm: Realm, user_groups, phishing_kit, sending_profile
):
    """Factory for campaigns with all dependencies attached."""

    def _create(
        *,
        name: str,
        status: CampaignStatus,
        begin_date: datetime,
        end_date: datetime,
        sending_interval_seconds: int = 1,
    ) -> Campaign:
        campaign = Campaign(
            name=name,
            realm_name=realm.name,
            status=status,
            begin_date=begin_date,
            end_date=end_date,
            sending_interval_seconds=sending_interval_seconds,
        )
        campaign.user_groups.extend(user_groups)
        campaign.phishing_kits.append(phishing_kit)
        campaign.sending_profiles.append(sending_profile)
        session.add(campaign)
        session.commit()
        session.refresh(campaign)
        return campaign

    return _create


@pytest.fixture
def now() -> datetime:
    return datetime.now()


@pytest.fixture
def past(now: datetime):
    def _past(**kwargs) -> datetime:
        return now - timedelta(**kwargs)

    return _past


@pytest.fixture
def future(now: datetime):
    def _future(**kwargs) -> datetime:
        return now + timedelta(**kwargs)

    return _future
