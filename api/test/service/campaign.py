"""Tests for CampaignService."""

import datetime
from unittest.mock import patch, MagicMock
import pytest
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from src.models.campaign import (
    Campaign,
    CampaignCreate,
    CampaignStatus,
    CampaignDisplayInfo,
    CampaignDetailInfo,
    CampaignGlobalStats,
)
from src.models.email_sending import EmailSending, EmailSendingStatus
from src.models.email_template import EmailTemplate
from src.models.landing_page_template import LandingPageTemplate
from src.models.sending_profile import SendingProfile
from src.models.user import User
from src.services.campaign import CampaignService


# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture(name="engine")
def engine_fixture():
    """Create an in-memory SQLite database for testing."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    return engine


@pytest.fixture(name="session")
def session_fixture(engine):
    """Create a new database session for each test."""
    with Session(engine) as session:
        yield session


@pytest.fixture(name="service")
def service_fixture():
    """Create a CampaignService instance."""
    return CampaignService()


@pytest.fixture(name="sample_user")
def sample_user_fixture(session: Session) -> User:
    """Create a sample user."""
    user = User(
        keycloak_id="user-123",
        email="user@example.com",
        dept="IT",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="sample_sending_profile")
def sample_sending_profile_fixture(session: Session) -> SendingProfile:
    """Create a sample sending profile."""
    profile = SendingProfile(
        name="Test Profile",
        smtp_host="smtp.example.com",
        smtp_port=587,
        username="test",
        password="password",
        from_fname="Test",
        from_lname="Sender",
        from_email="sender@example.com",
        realm_name="test-realm",
    )
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile


@pytest.fixture(name="sample_email_template")
def sample_email_template_fixture(session: Session) -> EmailTemplate:
    """Create a sample email template."""
    template = EmailTemplate(
        name="Phishing Template",
        subject="Important Security Update",
        content_link="/templates/phishing.html",
    )
    session.add(template)
    session.commit()
    session.refresh(template)
    return template


@pytest.fixture(name="sample_landing_page")
def sample_landing_page_fixture(session: Session) -> LandingPageTemplate:
    """Create a sample landing page template."""
    landing_page = LandingPageTemplate(
        name="Fake Login Page",
        content_link="/landing/fake-login.html",
    )
    session.add(landing_page)
    session.commit()
    session.refresh(landing_page)
    return landing_page


@pytest.fixture(name="campaign_create_data")
def campaign_create_data_fixture(
    sample_user: User,
    sample_sending_profile: SendingProfile,
    sample_email_template: EmailTemplate,
    sample_landing_page: LandingPageTemplate,
) -> CampaignCreate:
    """Create sample campaign creation data."""
    now = datetime.datetime.now()
    return CampaignCreate(
        name="Test Phishing Campaign",
        description="A test campaign",
        begin_date=now + datetime.timedelta(hours=1),
        end_date=now + datetime.timedelta(days=7),
        sending_interval_seconds=60,
        sending_profile_id=sample_sending_profile.id,  # type: ignore
        email_template_id=sample_email_template.id,  # type: ignore
        landing_page_template_id=sample_landing_page.id,  # type: ignore
        user_group_ids=["group-1", "group-2"],
        creator_id=sample_user.keycloak_id,
    )


@pytest.fixture(name="sample_campaign")
def sample_campaign_fixture(
    session: Session,
    sample_user: User,
    sample_sending_profile: SendingProfile,
    sample_email_template: EmailTemplate,
    sample_landing_page: LandingPageTemplate,
) -> Campaign:
    """Create a sample campaign with email sendings."""
    now = datetime.datetime.now()
    campaign = Campaign(
        name="Existing Campaign",
        description="An existing test campaign",
        begin_date=now - datetime.timedelta(days=1),
        end_date=now + datetime.timedelta(days=6),
        sending_interval_seconds=60,
        status=CampaignStatus.RUNNING,
        total_recipients=3,
        total_sent=2,
        total_opened=1,
        total_clicked=1,
        total_phished=0,
        sending_profile_id=sample_sending_profile.id,
        email_template_id=sample_email_template.id,
        landing_page_template_id=sample_landing_page.id,
        creator_id=sample_user.keycloak_id,
        realm_name="test-realm",
    )
    session.add(campaign)
    session.commit()
    session.refresh(campaign)

    # Add email sendings
    sent_time = now - datetime.timedelta(hours=12)
    sendings = [
        EmailSending(
            user_id=sample_user.keycloak_id,
            campaign_id=campaign.id,
            scheduled_date=now - datetime.timedelta(days=1),
            email_to="user1@example.com",
            status=EmailSendingStatus.OPENED,
            sent_at=sent_time,
            opened_at=sent_time + datetime.timedelta(minutes=30),
            clicked_at=sent_time + datetime.timedelta(minutes=45),
        ),
        EmailSending(
            user_id="user-456",
            campaign_id=campaign.id,
            scheduled_date=now - datetime.timedelta(hours=23),
            email_to="user2@example.com",
            status=EmailSendingStatus.SENT,
            sent_at=sent_time + datetime.timedelta(hours=1),
        ),
        EmailSending(
            user_id="user-789",
            campaign_id=campaign.id,
            scheduled_date=now + datetime.timedelta(hours=1),
            email_to="user3@example.com",
            status=EmailSendingStatus.SCHEDULED,
        ),
    ]
    for sending in sendings:
        session.add(sending)
    session.commit()
    session.refresh(campaign)

    return campaign


# ============================================================================
# Mock helper
# ============================================================================


def mock_keycloak_group_members(group_id: str) -> dict:
    """Mock response for list_group_members_in_realm."""
    members = {
        "group-1": [
            {"id": "user-001", "email": "alice@example.com"},
            {"id": "user-002", "email": "bob@example.com"},
        ],
        "group-2": [
            {"id": "user-002", "email": "bob@example.com"},  # Duplicate
            {"id": "user-003", "email": "charlie@example.com"},
        ],
    }
    return {"members": members.get(group_id, [])}


# ============================================================================
# Tests: create_campaign
# ============================================================================


class TestCreateCampaign:
    """Tests for CampaignService.create_campaign."""

    @patch("src.services.campaign.list_group_members_in_realm")
    def test_create_campaign_success(
        self,
        mock_list_members: MagicMock,
        service: CampaignService,
        session: Session,
        campaign_create_data: CampaignCreate,
    ):
        """Test successful campaign creation."""
        mock_list_members.side_effect = (
            lambda realm, group_id: mock_keycloak_group_members(group_id)
        )

        campaign = service.create_campaign(campaign_create_data, "test-realm", session)

        assert campaign.id is not None
        assert campaign.name == "Test Phishing Campaign"
        assert campaign.status == CampaignStatus.SCHEDULED
        assert campaign.realm_name == "test-realm"
        # 3 unique users from 2 groups (user-002 is in both)
        assert campaign.total_recipients == 3

    @patch("src.services.campaign.list_group_members_in_realm")
    def test_create_campaign_creates_email_sendings(
        self,
        mock_list_members: MagicMock,
        service: CampaignService,
        session: Session,
        campaign_create_data: CampaignCreate,
    ):
        """Test that email sendings are created for each user."""
        mock_list_members.side_effect = (
            lambda realm, group_id: mock_keycloak_group_members(group_id)
        )

        campaign = service.create_campaign(campaign_create_data, "test-realm", session)

        # Refresh to get email_sendings relationship
        session.refresh(campaign)
        assert len(campaign.email_sendings) == 3

        emails = {s.email_to for s in campaign.email_sendings}
        assert "alice@example.com" in emails
        assert "bob@example.com" in emails
        assert "charlie@example.com" in emails

    @patch("src.services.campaign.list_group_members_in_realm")
    def test_create_campaign_deduplicates_users(
        self,
        mock_list_members: MagicMock,
        service: CampaignService,
        session: Session,
        campaign_create_data: CampaignCreate,
    ):
        """Test that duplicate users across groups are deduplicated."""
        mock_list_members.side_effect = (
            lambda realm, group_id: mock_keycloak_group_members(group_id)
        )

        campaign = service.create_campaign(campaign_create_data, "test-realm", session)

        session.refresh(campaign)
        user_ids = [s.user_id for s in campaign.email_sendings]
        # user-002 appears in both groups but should only have one sending
        assert user_ids.count("user-002") == 1

    @patch("src.services.campaign.list_group_members_in_realm")
    def test_create_campaign_schedules_emails_with_interval(
        self,
        mock_list_members: MagicMock,
        service: CampaignService,
        session: Session,
        campaign_create_data: CampaignCreate,
    ):
        """Test that emails are scheduled with the correct interval."""
        mock_list_members.side_effect = (
            lambda realm, group_id: mock_keycloak_group_members(group_id)
        )

        campaign = service.create_campaign(campaign_create_data, "test-realm", session)

        session.refresh(campaign)
        dates = sorted([s.scheduled_date for s in campaign.email_sendings])

        # Check intervals between consecutive sends
        for i in range(1, len(dates)):
            diff = (dates[i] - dates[i - 1]).total_seconds()
            assert diff >= campaign.sending_interval_seconds

    def test_create_campaign_invalid_creator(
        self,
        service: CampaignService,
        session: Session,
        sample_sending_profile: SendingProfile,
        sample_email_template: EmailTemplate,
        sample_landing_page: LandingPageTemplate,
    ):
        """Test that invalid creator ID raises an error."""
        from fastapi import HTTPException

        now = datetime.datetime.now()
        data = CampaignCreate(
            name="Invalid Campaign",
            begin_date=now + datetime.timedelta(hours=1),
            end_date=now + datetime.timedelta(days=7),
            sending_interval_seconds=60,
            sending_profile_id=sample_sending_profile.id,  # type: ignore
            email_template_id=sample_email_template.id,  # type: ignore
            landing_page_template_id=sample_landing_page.id,  # type: ignore
            user_group_ids=["group-1"],
            creator_id="invalid-user-id",
        )

        with pytest.raises(HTTPException) as exc_info:
            service.create_campaign(data, "test-realm", session)

        assert exc_info.value.status_code == 400
        assert "Invalid creator ID" in exc_info.value.detail

    def test_create_campaign_invalid_sending_profile(
        self,
        service: CampaignService,
        session: Session,
        sample_user: User,
        sample_email_template: EmailTemplate,
        sample_landing_page: LandingPageTemplate,
    ):
        """Test that invalid sending profile ID raises an error."""
        from fastapi import HTTPException

        now = datetime.datetime.now()
        data = CampaignCreate(
            name="Invalid Campaign",
            begin_date=now + datetime.timedelta(hours=1),
            end_date=now + datetime.timedelta(days=7),
            sending_interval_seconds=60,
            sending_profile_id=99999,  # Invalid ID
            email_template_id=sample_email_template.id,  # type: ignore
            landing_page_template_id=sample_landing_page.id,  # type: ignore
            user_group_ids=["group-1"],
            creator_id=sample_user.keycloak_id,
        )

        with pytest.raises(HTTPException) as exc_info:
            service.create_campaign(data, "test-realm", session)

        assert exc_info.value.status_code == 400

    def test_create_campaign_invalid_interval(
        self,
        service: CampaignService,
        session: Session,
        sample_user: User,
        sample_sending_profile: SendingProfile,
        sample_email_template: EmailTemplate,
        sample_landing_page: LandingPageTemplate,
    ):
        """Test that zero or negative interval raises an error."""
        from fastapi import HTTPException

        now = datetime.datetime.now()
        data = CampaignCreate(
            name="Invalid Campaign",
            begin_date=now + datetime.timedelta(hours=1),
            end_date=now + datetime.timedelta(days=7),
            sending_interval_seconds=0,  # Invalid
            sending_profile_id=sample_sending_profile.id,  # type: ignore
            email_template_id=sample_email_template.id,  # type: ignore
            landing_page_template_id=sample_landing_page.id,  # type: ignore
            user_group_ids=["group-1"],
            creator_id=sample_user.keycloak_id,
        )

        with pytest.raises(HTTPException) as exc_info:
            service.create_campaign(data, "test-realm", session)

        assert exc_info.value.status_code == 400
        assert "interval" in exc_info.value.detail.lower()


# ============================================================================
# Tests: get_campaigns
# ============================================================================


class TestGetCampaigns:
    """Tests for CampaignService.get_campaigns."""

    def test_get_campaigns_returns_list(
        self,
        service: CampaignService,
        session: Session,
        sample_campaign: Campaign,
    ):
        """Test that get_campaigns returns a list of CampaignDisplayInfo."""
        campaigns = service.get_campaigns("test-realm", session)

        assert isinstance(campaigns, list)
        assert len(campaigns) == 1
        assert isinstance(campaigns[0], CampaignDisplayInfo)

    def test_get_campaigns_filters_by_realm(
        self,
        service: CampaignService,
        session: Session,
        sample_campaign: Campaign,
    ):
        """Test that campaigns are filtered by realm."""
        # Create a campaign in a different realm
        other_campaign = Campaign(
            name="Other Realm Campaign",
            begin_date=datetime.datetime.now(),
            end_date=datetime.datetime.now() + datetime.timedelta(days=1),
            realm_name="other-realm",
        )
        session.add(other_campaign)
        session.commit()

        campaigns = service.get_campaigns("test-realm", session)
        assert len(campaigns) == 1
        assert campaigns[0].name == "Existing Campaign"

        other_campaigns = service.get_campaigns("other-realm", session)
        assert len(other_campaigns) == 1
        assert other_campaigns[0].name == "Other Realm Campaign"

    def test_get_campaigns_returns_correct_stats(
        self,
        service: CampaignService,
        session: Session,
        sample_campaign: Campaign,
    ):
        """Test that campaign display info includes correct stats."""
        campaigns = service.get_campaigns("test-realm", session)

        campaign_info = campaigns[0]
        assert campaign_info.total_opened == sample_campaign.total_opened
        assert campaign_info.total_clicked == sample_campaign.total_clicked

    def test_get_campaigns_empty_realm(
        self,
        service: CampaignService,
        session: Session,
    ):
        """Test that empty realm returns empty list."""
        campaigns = service.get_campaigns("nonexistent-realm", session)
        assert campaigns == []


# ============================================================================
# Tests: get_campaign_by_id
# ============================================================================


class TestGetCampaignById:
    """Tests for CampaignService.get_campaign_by_id."""

    def test_get_campaign_by_id_success(
        self,
        service: CampaignService,
        session: Session,
        sample_campaign: Campaign,
    ):
        """Test successful retrieval of campaign by ID."""
        result = service.get_campaign_by_id(
            sample_campaign.id, "test-realm", session  # type: ignore
        )

        assert result is not None
        assert isinstance(result, CampaignDetailInfo)
        assert result.id == sample_campaign.id
        assert result.name == sample_campaign.name

    def test_get_campaign_by_id_not_found(
        self,
        service: CampaignService,
        session: Session,
    ):
        """Test that non-existent ID returns None."""
        result = service.get_campaign_by_id(99999, "test-realm", session)
        assert result is None

    def test_get_campaign_by_id_wrong_realm(
        self,
        service: CampaignService,
        session: Session,
        sample_campaign: Campaign,
    ):
        """Test that campaign from different realm returns None."""
        result = service.get_campaign_by_id(
            sample_campaign.id, "wrong-realm", session  # type: ignore
        )
        assert result is None

    def test_get_campaign_by_id_includes_stats(
        self,
        service: CampaignService,
        session: Session,
        sample_campaign: Campaign,
    ):
        """Test that detail info includes all statistics."""
        result = service.get_campaign_by_id(
            sample_campaign.id, "test-realm", session  # type: ignore
        )

        assert result is not None
        assert result.total_recipients == sample_campaign.total_recipients
        assert result.total_opened == sample_campaign.total_opened
        assert result.total_clicked == sample_campaign.total_clicked
        assert result.total_phished == sample_campaign.total_phished

    def test_get_campaign_by_id_includes_rates(
        self,
        service: CampaignService,
        session: Session,
        sample_campaign: Campaign,
    ):
        """Test that detail info calculates rates correctly."""
        result = service.get_campaign_by_id(
            sample_campaign.id, "test-realm", session  # type: ignore
        )

        assert result is not None
        # With 2 sent and 1 opened: open_rate = 50%
        assert result.open_rate == 50.0

    def test_get_campaign_by_id_includes_user_sendings(
        self,
        service: CampaignService,
        session: Session,
        sample_campaign: Campaign,
    ):
        """Test that detail info includes user sendings breakdown."""
        result = service.get_campaign_by_id(
            sample_campaign.id, "test-realm", session  # type: ignore
        )

        assert result is not None
        assert len(result.user_sendings) == 3

    def test_get_campaign_by_id_includes_time_metrics(
        self,
        service: CampaignService,
        session: Session,
        sample_campaign: Campaign,
    ):
        """Test that detail info includes time metrics."""
        result = service.get_campaign_by_id(
            sample_campaign.id, "test-realm", session  # type: ignore
        )

        assert result is not None
        assert result.first_open_at is not None
        assert result.avg_time_to_open_seconds is not None


# ============================================================================
# Tests: get_global_stats
# ============================================================================


class TestGetGlobalStats:
    """Tests for CampaignService.get_global_stats."""

    def test_get_global_stats_returns_correct_type(
        self,
        service: CampaignService,
        session: Session,
        sample_campaign: Campaign,
    ):
        """Test that get_global_stats returns CampaignGlobalStats."""
        stats = service.get_global_stats("test-realm", session)
        assert isinstance(stats, CampaignGlobalStats)

    def test_get_global_stats_campaign_counts(
        self,
        service: CampaignService,
        session: Session,
        sample_campaign: Campaign,
    ):
        """Test that campaign status counts are correct."""
        stats = service.get_global_stats("test-realm", session)

        assert stats.total_campaigns == 1
        assert stats.running_campaigns == 1
        assert stats.scheduled_campaigns == 0
        assert stats.completed_campaigns == 0
        assert stats.canceled_campaigns == 0

    def test_get_global_stats_email_counts(
        self,
        service: CampaignService,
        session: Session,
        sample_campaign: Campaign,
    ):
        """Test that email statistics use stored campaign counters."""
        stats = service.get_global_stats("test-realm", session)

        assert stats.total_emails_scheduled == sample_campaign.total_recipients
        assert stats.total_emails_opened == sample_campaign.total_opened
        assert stats.total_emails_clicked == sample_campaign.total_clicked
        assert stats.total_emails_phished == sample_campaign.total_phished

    def test_get_global_stats_rates(
        self,
        service: CampaignService,
        session: Session,
        sample_campaign: Campaign,
    ):
        """Test that rates are calculated correctly."""
        stats = service.get_global_stats("test-realm", session)

        # Delivery rate: 2 sent / 3 scheduled = 66.67%
        assert stats.delivery_rate == pytest.approx(66.67, rel=0.1)

    def test_get_global_stats_empty_realm(
        self,
        service: CampaignService,
        session: Session,
    ):
        """Test global stats for realm with no campaigns."""
        stats = service.get_global_stats("empty-realm", session)

        assert stats.total_campaigns == 0
        assert stats.total_emails_scheduled == 0
        assert stats.delivery_rate == 0.0

    def test_get_global_stats_unique_users(
        self,
        service: CampaignService,
        session: Session,
        sample_campaign: Campaign,
    ):
        """Test that unique user counts are correct."""
        stats = service.get_global_stats("test-realm", session)

        assert stats.unique_users_targeted == 3  # 3 different users


# ============================================================================
# Tests: Helper methods
# ============================================================================


class TestHelperMethods:
    """Tests for CampaignService helper methods."""

    def test_calculate_interval_respects_minimum(
        self,
        service: CampaignService,
        sample_user: User,
        sample_sending_profile: SendingProfile,
        sample_email_template: EmailTemplate,
        sample_landing_page: LandingPageTemplate,
    ):
        """Test that interval calculation respects minimum interval."""
        from src.models.campaign import MIN_INTERVAL

        now = datetime.datetime.now()
        data = CampaignCreate(
            name="Test",
            begin_date=now,
            end_date=now + datetime.timedelta(seconds=10),  # Very short
            sending_interval_seconds=1,  # Below minimum
            sending_profile_id=sample_sending_profile.id,  # type: ignore
            email_template_id=sample_email_template.id,  # type: ignore
            landing_page_template_id=sample_landing_page.id,  # type: ignore
            user_group_ids=[],
            creator_id=sample_user.keycloak_id,
        )

        interval = service._calculate_interval(data, user_count=100)
        assert interval >= MIN_INTERVAL

    def test_calculate_interval_based_on_duration(
        self,
        service: CampaignService,
        sample_user: User,
        sample_sending_profile: SendingProfile,
        sample_email_template: EmailTemplate,
        sample_landing_page: LandingPageTemplate,
    ):
        """Test that interval is calculated based on campaign duration."""
        now = datetime.datetime.now()
        data = CampaignCreate(
            name="Test",
            begin_date=now,
            end_date=now + datetime.timedelta(hours=10),
            sending_interval_seconds=60,
            sending_profile_id=sample_sending_profile.id,  # type: ignore
            email_template_id=sample_email_template.id,  # type: ignore
            landing_page_template_id=sample_landing_page.id,  # type: ignore
            user_group_ids=[],
            creator_id=sample_user.keycloak_id,
        )

        # 10 hours = 36000 seconds, 100 users = 360 seconds per user
        interval = service._calculate_interval(data, user_count=100)
        assert interval >= 360

    def test_calc_avg_time_delta_empty(self, service: CampaignService):
        """Test avg time calculation with empty list."""
        result = service._calc_avg_time_delta([])
        assert result is None

    def test_calc_avg_time_delta_single(self, service: CampaignService):
        """Test avg time calculation with single pair."""
        now = datetime.datetime.now()
        pairs = [(now, now + datetime.timedelta(seconds=100))]

        result = service._calc_avg_time_delta(pairs)
        assert result == 100.0

    def test_calc_avg_time_delta_multiple(self, service: CampaignService):
        """Test avg time calculation with multiple pairs."""
        now = datetime.datetime.now()
        pairs = [
            (now, now + datetime.timedelta(seconds=100)),
            (now, now + datetime.timedelta(seconds=200)),
        ]

        result = service._calc_avg_time_delta(pairs)
        assert result == 150.0

    @patch("src.services.campaign.list_group_members_in_realm")
    def test_collect_users_from_groups_deduplication(
        self,
        mock_list_members: MagicMock,
        service: CampaignService,
    ):
        """Test that user collection deduplicates across groups."""
        mock_list_members.side_effect = (
            lambda realm, group_id: mock_keycloak_group_members(group_id)
        )

        users = service._collect_users_from_groups(["group-1", "group-2"], "test-realm")

        # 4 total members but user-002 is in both groups
        assert len(users) == 3
        assert "user-001" in users
        assert "user-002" in users
        assert "user-003" in users


# ============================================================================
# Tests: find_repeat_offenders
# ============================================================================


class TestFindRepeatOffenders:
    """Tests for the repeat offenders calculation."""

    def test_find_repeat_offenders_empty(self, service: CampaignService):
        """Test with no campaigns."""
        result = service._find_repeat_offenders([])
        assert result == []

    def test_find_repeat_offenders_no_clicks(
        self,
        service: CampaignService,
        session: Session,
        sample_user: User,
    ):
        """Test with campaigns but no clicks/phishes."""
        campaign = Campaign(
            name="No Clicks Campaign",
            begin_date=datetime.datetime.now(),
            end_date=datetime.datetime.now() + datetime.timedelta(days=1),
            realm_name="test-realm",
        )
        session.add(campaign)
        session.commit()

        sending = EmailSending(
            user_id=sample_user.keycloak_id,
            campaign_id=campaign.id,
            scheduled_date=datetime.datetime.now(),
            email_to="test@example.com",
            status=EmailSendingStatus.SENT,
            sent_at=datetime.datetime.now(),
        )
        session.add(sending)
        session.commit()
        session.refresh(campaign)

        result = service._find_repeat_offenders([campaign])
        assert result == []

    def test_find_repeat_offenders_identifies_vulnerable_users(
        self,
        service: CampaignService,
        session: Session,
        sample_user: User,
    ):
        """Test that users who click in >50% of campaigns are identified."""
        # Create 2 campaigns
        campaigns = []
        for i in range(2):
            campaign = Campaign(
                name=f"Campaign {i}",
                begin_date=datetime.datetime.now(),
                end_date=datetime.datetime.now() + datetime.timedelta(days=1),
                realm_name="test-realm",
            )
            session.add(campaign)
            session.commit()
            campaigns.append(campaign)

        # User clicks in both campaigns (100% rate)
        for campaign in campaigns:
            sending = EmailSending(
                user_id=sample_user.keycloak_id,
                campaign_id=campaign.id,
                scheduled_date=datetime.datetime.now(),
                email_to="test@example.com",
                status=EmailSendingStatus.CLICKED,
                sent_at=datetime.datetime.now(),
                clicked_at=datetime.datetime.now(),
            )
            session.add(sending)
        session.commit()

        for c in campaigns:
            session.refresh(c)

        result = service._find_repeat_offenders(campaigns)
        assert sample_user.keycloak_id in result


# ============================================================================
# Tests: cancel_campaign
# ============================================================================


class TestCancelCampaign:
    """Tests for CampaignService.cancel_campaign."""

    def test_cancel_scheduled_campaign(
        self,
        service: CampaignService,
        session: Session,
        sample_user: User,
        sample_sending_profile: SendingProfile,
        sample_email_template: EmailTemplate,
        sample_landing_page: LandingPageTemplate,
    ):
        """Test canceling a scheduled campaign."""
        now = datetime.datetime.now()
        campaign = Campaign(
            name="Scheduled Campaign",
            begin_date=now + datetime.timedelta(days=1),
            end_date=now + datetime.timedelta(days=7),
            status=CampaignStatus.SCHEDULED,
            sending_profile_id=sample_sending_profile.id,
            email_template_id=sample_email_template.id,
            landing_page_template_id=sample_landing_page.id,
            creator_id=sample_user.keycloak_id,
            realm_name="test-realm",
        )
        session.add(campaign)
        session.commit()

        # Add some scheduled email sendings
        for i in range(3):
            sending = EmailSending(
                user_id=sample_user.keycloak_id,
                campaign_id=campaign.id,
                scheduled_date=now + datetime.timedelta(days=1, hours=i),
                email_to=f"user{i}@example.com",
                status=EmailSendingStatus.SCHEDULED,
            )
            session.add(sending)
        session.commit()
        campaign_id = campaign.id

        result = service.cancel_campaign(campaign_id, "test-realm", session)

        assert result.status == CampaignStatus.CANCELED

        # Verify all scheduled sendings are now failed
        session.refresh(campaign)
        for sending in campaign.email_sendings:
            assert sending.status == EmailSendingStatus.FAILED

    def test_cancel_running_campaign(
        self,
        service: CampaignService,
        session: Session,
        sample_user: User,
        sample_sending_profile: SendingProfile,
        sample_email_template: EmailTemplate,
        sample_landing_page: LandingPageTemplate,
    ):
        """Test canceling a running campaign."""
        now = datetime.datetime.now()
        campaign = Campaign(
            name="Running Campaign",
            begin_date=now - datetime.timedelta(days=1),
            end_date=now + datetime.timedelta(days=6),
            status=CampaignStatus.RUNNING,
            sending_profile_id=sample_sending_profile.id,
            email_template_id=sample_email_template.id,
            landing_page_template_id=sample_landing_page.id,
            creator_id=sample_user.keycloak_id,
            realm_name="test-realm",
        )
        session.add(campaign)
        session.commit()

        # Add mixed status sendings
        sendings_data = [
            (EmailSendingStatus.SENT, now - datetime.timedelta(hours=12)),
            (EmailSendingStatus.SCHEDULED, now + datetime.timedelta(hours=1)),
            (EmailSendingStatus.SCHEDULED, now + datetime.timedelta(hours=2)),
        ]
        for status, scheduled in sendings_data:
            sending = EmailSending(
                user_id=sample_user.keycloak_id,
                campaign_id=campaign.id,
                scheduled_date=scheduled,
                email_to="user@example.com",
                status=status,
                sent_at=(
                    now - datetime.timedelta(hours=12)
                    if status == EmailSendingStatus.SENT
                    else None
                ),
            )
            session.add(sending)
        session.commit()
        campaign_id = campaign.id

        result = service.cancel_campaign(campaign_id, "test-realm", session)

        assert result.status == CampaignStatus.CANCELED

        # Verify: sent emails unchanged, scheduled emails failed
        session.refresh(campaign)
        statuses = [s.status for s in campaign.email_sendings]
        assert EmailSendingStatus.SENT in statuses  # Already sent stays sent
        assert statuses.count(EmailSendingStatus.FAILED) == 2  # Scheduled ones failed

    def test_cancel_already_canceled_campaign(
        self,
        service: CampaignService,
        session: Session,
    ):
        """Test that canceling an already canceled campaign raises an error."""
        from fastapi import HTTPException

        campaign = Campaign(
            name="Already Canceled",
            begin_date=datetime.datetime.now(),
            end_date=datetime.datetime.now() + datetime.timedelta(days=1),
            status=CampaignStatus.CANCELED,
            realm_name="test-realm",
        )
        session.add(campaign)
        session.commit()

        with pytest.raises(HTTPException) as exc_info:
            service.cancel_campaign(campaign.id, "test-realm", session)

        assert exc_info.value.status_code == 400
        assert "already canceled" in exc_info.value.detail.lower()

    def test_cancel_completed_campaign(
        self,
        service: CampaignService,
        session: Session,
    ):
        """Test that canceling a completed campaign raises an error."""
        from fastapi import HTTPException

        campaign = Campaign(
            name="Completed Campaign",
            begin_date=datetime.datetime.now() - datetime.timedelta(days=7),
            end_date=datetime.datetime.now() - datetime.timedelta(days=1),
            status=CampaignStatus.COMPLETED,
            realm_name="test-realm",
        )
        session.add(campaign)
        session.commit()

        with pytest.raises(HTTPException) as exc_info:
            service.cancel_campaign(campaign.id, "test-realm", session)

        assert exc_info.value.status_code == 400
        assert "completed" in exc_info.value.detail.lower()

    def test_cancel_campaign_not_found(
        self,
        service: CampaignService,
        session: Session,
    ):
        """Test that canceling a non-existent campaign raises 404."""
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            service.cancel_campaign(99999, "test-realm", session)

        assert exc_info.value.status_code == 404

    def test_cancel_campaign_wrong_realm(
        self,
        service: CampaignService,
        session: Session,
    ):
        """Test that canceling a campaign from wrong realm raises 404."""
        from fastapi import HTTPException

        campaign = Campaign(
            name="Other Realm Campaign",
            begin_date=datetime.datetime.now(),
            end_date=datetime.datetime.now() + datetime.timedelta(days=1),
            status=CampaignStatus.SCHEDULED,
            realm_name="other-realm",
        )
        session.add(campaign)
        session.commit()

        with pytest.raises(HTTPException) as exc_info:
            service.cancel_campaign(campaign.id, "test-realm", session)

        assert exc_info.value.status_code == 404
