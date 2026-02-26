"""Tests for stats_handler: campaign statistics aggregation and transformation."""

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

from unittest.mock import patch

import pytest
from sqlmodel import Session, SQLModel, create_engine, select
from sqlmodel.pool import StaticPool

from src.models.campaign import Campaign, CampaignStatus
from src.models.email_sending import EmailSending, EmailSendingStatus
from src.models.realm import Realm
from src.models.sending_profile import SendingProfile
from src.models.phishing_kit import PhishingKit
from src.models.user import User
from src.services.campaign.stats_handler import stats_handler


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


@pytest.fixture(name="handler")
def handler_fixture():
    return stats_handler()


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


@pytest.fixture
def sample_user(session: Session, sample_realm: Realm) -> User:
    """Create a test user."""
    user = User(
        keycloak_id="user-1",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture
def sample_campaign(
    session: Session,
    sample_realm: Realm,
    sample_sending_profile: SendingProfile,
    sample_phishing_kit: PhishingKit,
) -> Campaign:
    """Create a basic campaign."""
    campaign = Campaign(
        name="test_campaign",
        description="A test campaign",
        begin_date=datetime.datetime(2026, 2, 24, 10, 0),
        end_date=datetime.datetime(2026, 2, 25, 10, 0),
        sending_interval_seconds=60,
        status=CampaignStatus.RUNNING,
        realm_name=sample_realm.name,
        sending_profile_id=sample_sending_profile.id,
        total_recipients=10,
        total_sent=8,
        total_opened=5,
        total_clicked=2,
        total_phished=1,
    )
    session.add(campaign)
    session.commit()
    session.refresh(campaign)
    return campaign


# ============================================================================
# Unit Tests: _calc_avg_time_delta
# ============================================================================


class TestCalcAvgTimeDelta:
    """Test the _calc_avg_time_delta helper method."""

    def test_empty_list(self, handler):
        """Should return None for empty list."""
        result = handler._calc_avg_time_delta([])
        assert result is None

    def test_single_pair_5_minutes(self, handler):
        """Should return correct delta for single pair."""
        start = datetime.datetime(2026, 1, 1, 10, 0)
        end = datetime.datetime(2026, 1, 1, 10, 5)
        result = handler._calc_avg_time_delta([(start, end)])
        assert result == pytest.approx(300.0)  # 5 minutes * 60 seconds

    def test_single_pair_1_hour(self, handler):
        """Should handle larger time spans."""
        start = datetime.datetime(2026, 1, 1, 10, 0)
        end = datetime.datetime(2026, 1, 1, 11, 0)
        result = handler._calc_avg_time_delta([(start, end)])
        assert result == pytest.approx(3600.0)

    def test_multiple_pairs_average(self, handler):
        """Should calculate average of multiple pairs."""
        start1 = datetime.datetime(2026, 1, 1, 10, 0)
        end1 = datetime.datetime(2026, 1, 1, 10, 10)  # 600 seconds
        start2 = datetime.datetime(2026, 1, 2, 10, 0)
        end2 = datetime.datetime(2026, 1, 2, 10, 20)  # 1200 seconds
        result = handler._calc_avg_time_delta([(start1, end1), (start2, end2)])
        assert result == pytest.approx(900.0)  # (600 + 1200) / 2

    def test_zero_delta(self, handler):
        """Should handle zero-second deltas."""
        now = datetime.datetime(2026, 1, 1, 10, 0)
        result = handler._calc_avg_time_delta([(now, now)])
        assert result == pytest.approx(0.0)

    def test_rounds_to_2_decimals(self, handler):
        """Should round result to 2 decimal places."""
        start = datetime.datetime(2026, 1, 1, 10, 0, 0)
        end = datetime.datetime(2026, 1, 1, 10, 0, 1)  # 1 second
        start2 = datetime.datetime(2026, 1, 1, 11, 0, 0)
        end2 = datetime.datetime(2026, 1, 1, 11, 0, 2)  # 2 seconds
        # Average: (1 + 2) / 2 = 1.5
        result = handler._calc_avg_time_delta([(start, end), (start2, end2)])
        assert result == pytest.approx(1.5)


# ============================================================================
# Unit Tests: _find_repeat_offenders
# ============================================================================


class TestFindRepeatOffenders:
    """Test the repeat offenders detection logic."""

    DEFAULT_THRESHOLD = 0.5

    def test_empty_campaigns(self, handler):
        """Should return empty list for no campaigns."""
        result = handler._find_repeat_offenders([], threshold=self.DEFAULT_THRESHOLD)
        assert result == []

    def test_no_users_fell(self, handler, session: Session, sample_campaign: Campaign):
        """Should return empty list if no users clicked/phished."""
        for i in range(3):
            sending = EmailSending(
                user_id=f"user-{i}",
                scheduled_date=sample_campaign.begin_date,
                email_to=f"user{i}@example.com",
                campaign_id=sample_campaign.id,
                status=EmailSendingStatus.SENT,
                sent_at=sample_campaign.begin_date,
            )
            session.add(sending)
        session.commit()

        result = handler._find_repeat_offenders(
            [sample_campaign], threshold=self.DEFAULT_THRESHOLD
        )
        assert result == []

    def test_single_campaign_user_fell(self, handler, session: Session, sample_campaign: Campaign):
        """User with 100% fall rate (1/1) exceeds 0.5 threshold."""
        sending = EmailSending(
            user_id="user-1",
            scheduled_date=sample_campaign.begin_date,
            email_to="user1@example.com",
            campaign_id=sample_campaign.id,
            status=EmailSendingStatus.CLICKED,
            sent_at=sample_campaign.begin_date,
            clicked_at=sample_campaign.begin_date + datetime.timedelta(minutes=5),
        )
        session.add(sending)
        session.commit()

        # 1/1 = 100% > 50% threshold
        result = handler._find_repeat_offenders(
            [sample_campaign], threshold=self.DEFAULT_THRESHOLD
        )
        assert "user-1" in result

    def test_boundary_exactly_at_threshold(
        self, handler, session: Session, sample_realm: Realm, sample_sending_profile: SendingProfile
    ):
        """User with fall rate exactly equal to threshold should NOT be flagged (> not >=)."""
        campaign1 = Campaign(
            name="campaign_1",
            begin_date=datetime.datetime(2026, 2, 24, 10, 0),
            end_date=datetime.datetime(2026, 2, 25, 10, 0),
            realm_name=sample_realm.name,
            sending_profile_id=sample_sending_profile.id,
            total_recipients=1,
        )
        campaign2 = Campaign(
            name="campaign_2",
            begin_date=datetime.datetime(2026, 2, 26, 10, 0),
            end_date=datetime.datetime(2026, 2, 27, 10, 0),
            realm_name=sample_realm.name,
            sending_profile_id=sample_sending_profile.id,
            total_recipients=1,
        )
        session.add_all([campaign1, campaign2])
        session.commit()

        # User targeted in both, fell in one → 1/2 = 0.5
        sending1 = EmailSending(
            user_id="user-1",
            scheduled_date=campaign1.begin_date,
            email_to="user1@example.com",
            campaign_id=campaign1.id,
            status=EmailSendingStatus.CLICKED,
            sent_at=campaign1.begin_date,
            clicked_at=campaign1.begin_date + datetime.timedelta(minutes=5),
        )
        sending2 = EmailSending(
            user_id="user-1",
            scheduled_date=campaign2.begin_date,
            email_to="user1@example.com",
            campaign_id=campaign2.id,
            status=EmailSendingStatus.SENT,
            sent_at=campaign2.begin_date,
        )
        session.add_all([sending1, sending2])
        session.commit()

        # 0.5 is NOT > 0.5, so user should not be flagged
        result = handler._find_repeat_offenders(
            [campaign1, campaign2], threshold=self.DEFAULT_THRESHOLD
        )
        assert "user-1" not in result

    def test_above_threshold(
        self, handler, session: Session, sample_realm: Realm, sample_sending_profile: SendingProfile
    ):
        """User with fall rate above threshold should be flagged."""
        campaign1 = Campaign(
            name="campaign_1",
            begin_date=datetime.datetime(2026, 2, 24, 10, 0),
            end_date=datetime.datetime(2026, 2, 25, 10, 0),
            realm_name=sample_realm.name,
            sending_profile_id=sample_sending_profile.id,
            total_recipients=1,
        )
        campaign2 = Campaign(
            name="campaign_2",
            begin_date=datetime.datetime(2026, 2, 26, 10, 0),
            end_date=datetime.datetime(2026, 2, 27, 10, 0),
            realm_name=sample_realm.name,
            sending_profile_id=sample_sending_profile.id,
            total_recipients=1,
        )
        session.add_all([campaign1, campaign2])
        session.commit()

        # User phished in both → 2/2 = 100% > 50%
        sending1 = EmailSending(
            user_id="user-1",
            scheduled_date=campaign1.begin_date,
            email_to="user1@example.com",
            campaign_id=campaign1.id,
            status=EmailSendingStatus.PHISHED,
            sent_at=campaign1.begin_date,
            phished_at=campaign1.begin_date + datetime.timedelta(minutes=5),
        )
        sending2 = EmailSending(
            user_id="user-1",
            scheduled_date=campaign2.begin_date,
            email_to="user1@example.com",
            campaign_id=campaign2.id,
            status=EmailSendingStatus.PHISHED,
            sent_at=campaign2.begin_date,
            phished_at=campaign2.begin_date + datetime.timedelta(minutes=5),
        )
        session.add_all([sending1, sending2])
        session.commit()

        result = handler._find_repeat_offenders(
            [campaign1, campaign2], threshold=self.DEFAULT_THRESHOLD
        )
        assert "user-1" in result

    def test_multiple_users_mixed_rates(
        self, handler, session: Session, sample_realm: Realm, sample_sending_profile: SendingProfile
    ):
        """With threshold=0.5, user at 75% is flagged, user at 25% is not."""
        campaigns = []
        for i in range(4):
            c = Campaign(
                name=f"campaign_{i}",
                begin_date=datetime.datetime(2026, 2, 24 + i, 10, 0),
                end_date=datetime.datetime(2026, 2, 25 + i, 10, 0),
                realm_name=sample_realm.name,
                sending_profile_id=sample_sending_profile.id,
                total_recipients=1,
            )
            campaigns.append(c)
        session.add_all(campaigns)
        session.commit()

        # User-1: fell in 3/4 campaigns (75% > 50%)
        for i, c in enumerate(campaigns):
            status = EmailSendingStatus.CLICKED if i < 3 else EmailSendingStatus.SENT
            sending = EmailSending(
                user_id="user-1",
                scheduled_date=c.begin_date,
                email_to="user1@example.com",
                campaign_id=c.id,
                status=status,
                sent_at=c.begin_date,
                clicked_at=c.begin_date + datetime.timedelta(minutes=5) if i < 3 else None,
            )
            session.add(sending)

        # User-2: fell in 1/4 campaigns (25% < 50%)
        for i, c in enumerate(campaigns):
            status = EmailSendingStatus.CLICKED if i == 0 else EmailSendingStatus.SENT
            sending = EmailSending(
                user_id="user-2",
                scheduled_date=c.begin_date,
                email_to="user2@example.com",
                campaign_id=c.id,
                status=status,
                sent_at=c.begin_date,
                clicked_at=c.begin_date + datetime.timedelta(minutes=5) if i == 0 else None,
            )
            session.add(sending)
        session.commit()

        result = handler._find_repeat_offenders(
            campaigns, threshold=self.DEFAULT_THRESHOLD
        )
        assert "user-1" in result
        assert "user-2" not in result

    def test_custom_high_threshold(
        self, handler, session: Session, sample_realm: Realm, sample_sending_profile: SendingProfile
    ):
        """With threshold=0.8, user at 75% is no longer flagged."""
        campaigns = []
        for i in range(4):
            c = Campaign(
                name=f"campaign_{i}",
                begin_date=datetime.datetime(2026, 2, 24 + i, 10, 0),
                end_date=datetime.datetime(2026, 2, 25 + i, 10, 0),
                realm_name=sample_realm.name,
                sending_profile_id=sample_sending_profile.id,
                total_recipients=1,
            )
            campaigns.append(c)
        session.add_all(campaigns)
        session.commit()

        # User-1: fell in 3/4 campaigns (75%)
        for i, c in enumerate(campaigns):
            status = EmailSendingStatus.CLICKED if i < 3 else EmailSendingStatus.SENT
            sending = EmailSending(
                user_id="user-1",
                scheduled_date=c.begin_date,
                email_to="user1@example.com",
                campaign_id=c.id,
                status=status,
                sent_at=c.begin_date,
                clicked_at=c.begin_date + datetime.timedelta(minutes=5) if i < 3 else None,
            )
            session.add(sending)
        session.commit()

        # At default threshold (0.5), user-1 would be flagged
        result_default = handler._find_repeat_offenders(
            campaigns, threshold=self.DEFAULT_THRESHOLD
        )
        assert "user-1" in result_default

        # At higher threshold (0.8), 75% is NOT > 80%, so not flagged
        result_strict = handler._find_repeat_offenders(
            campaigns, threshold=0.8
        )
        assert "user-1" not in result_strict

    def test_custom_low_threshold(
        self, handler, session: Session, sample_realm: Realm, sample_sending_profile: SendingProfile
    ):
        """With threshold=0.2, user at 25% is now flagged."""
        campaigns = []
        for i in range(4):
            c = Campaign(
                name=f"campaign_{i}",
                begin_date=datetime.datetime(2026, 2, 24 + i, 10, 0),
                end_date=datetime.datetime(2026, 2, 25 + i, 10, 0),
                realm_name=sample_realm.name,
                sending_profile_id=sample_sending_profile.id,
                total_recipients=1,
            )
            campaigns.append(c)
        session.add_all(campaigns)
        session.commit()

        # User: fell in 1/4 campaigns (25%)
        for i, c in enumerate(campaigns):
            status = EmailSendingStatus.CLICKED if i == 0 else EmailSendingStatus.SENT
            sending = EmailSending(
                user_id="user-1",
                scheduled_date=c.begin_date,
                email_to="user1@example.com",
                campaign_id=c.id,
                status=status,
                sent_at=c.begin_date,
                clicked_at=c.begin_date + datetime.timedelta(minutes=5) if i == 0 else None,
            )
            session.add(sending)
        session.commit()

        # At default threshold (0.5), 25% is NOT > 50%
        result_default = handler._find_repeat_offenders(
            campaigns, threshold=self.DEFAULT_THRESHOLD
        )
        assert "user-1" not in result_default

        # At lower threshold (0.2), 25% IS > 20%, so flagged
        result_lenient = handler._find_repeat_offenders(
            campaigns, threshold=0.2
        )
        assert "user-1" in result_lenient


# ============================================================================
# Integration Tests: _to_display_info
# ============================================================================


class TestToDisplayInfo:
    """Test campaign display info conversion."""

    def test_basic_conversion(self, handler, session: Session, sample_campaign: Campaign):
        """Should convert campaign to display info."""
        result = handler._to_display_info(sample_campaign)
        assert result.id == sample_campaign.id
        assert result.name == sample_campaign.name
        assert result.begin_date == sample_campaign.begin_date
        assert result.end_date == sample_campaign.end_date
        assert result.status == sample_campaign.status

    def test_total_sent_calculated_from_sendings(
        self, handler, session: Session, sample_campaign: Campaign
    ):
        """Should count sent emails from EmailSending records."""
        # Add 3 sendings, 2 sent, 1 failed
        for i in range(2):
            sending = EmailSending(
                user_id=f"user-{i}",
                scheduled_date=sample_campaign.begin_date,
                email_to=f"user{i}@example.com",
                campaign_id=sample_campaign.id,
                status=EmailSendingStatus.SENT,
                sent_at=sample_campaign.begin_date,
            )
            session.add(sending)

        failing = EmailSending(
            user_id="user-fail",
            scheduled_date=sample_campaign.begin_date,
            email_to="fail@example.com",
            campaign_id=sample_campaign.id,
            status=EmailSendingStatus.FAILED,
            sent_at=None,
        )
        session.add(failing)
        session.commit()

        # Refresh to load relationships
        session.refresh(sample_campaign)

        result = handler._to_display_info(sample_campaign)
        assert result.total_sent == 2

    def test_no_sendings(self, handler, session: Session, sample_campaign: Campaign):
        """Should handle campaign with no sendings."""
        result = handler._to_display_info(sample_campaign)
        assert result.total_sent == 0


# ============================================================================
# Integration Tests: _to_detail_info
# ============================================================================


class TestToDetailInfo:
    """Test detailed campaign info conversion."""

    def test_basic_conversion(self, handler, session: Session, sample_campaign: Campaign):
        """Should convert campaign to detail info."""
        result = handler._to_detail_info(sample_campaign)
        assert result.id == sample_campaign.id
        assert result.name == sample_campaign.name
        assert result.status == sample_campaign.status

    def test_progress_percentage_calculation(
        self, handler, session: Session, sample_realm: Realm, sample_sending_profile: SendingProfile
    ):
        """Progress should be total_sent / total_recipients * 100."""
        campaign = Campaign(
            name="progress_test",
            begin_date=datetime.datetime(2026, 2, 24, 10, 0),
            end_date=datetime.datetime(2026, 2, 25, 10, 0),
            realm_name=sample_realm.name,
            sending_profile_id=sample_sending_profile.id,
            total_recipients=10,
            total_sent=5,
        )
        session.add(campaign)
        session.commit()
        session.refresh(campaign)

        # Add 5 sendings
        for i in range(5):
            sending = EmailSending(
                user_id=f"user-{i}",
                scheduled_date=campaign.begin_date,
                email_to=f"user{i}@example.com",
                campaign_id=campaign.id,
                status=EmailSendingStatus.SENT,
                sent_at=campaign.begin_date,
            )
            session.add(sending)
        session.commit()
        session.refresh(campaign)

        result = handler._to_detail_info(campaign)
        assert result.progress_percentage == pytest.approx(50.0)  # 5/10 * 100

    def test_time_elapsed_percentage(
        self, handler, session: Session, sample_realm: Realm, sample_sending_profile: SendingProfile
    ):
        """Time elapsed % should be calculated vs campaign end date."""
        # Campaign from 10:00 to 14:00 (4 hours)
        begin = datetime.datetime(2026, 2, 24, 10, 0)
        end = datetime.datetime(2026, 2, 24, 14, 0)

        campaign = Campaign(
            name="time_test",
            begin_date=begin,
            end_date=end,
            realm_name=sample_realm.name,
            sending_profile_id=sample_sending_profile.id,
            total_recipients=1,
        )
        session.add(campaign)
        session.commit()
        session.refresh(campaign)

        result = handler._to_detail_info(campaign)
        # Should be bounded [0, 100]
        assert 0 <= result.time_elapsed_percentage <= 100

    def test_time_elapsed_bounded(
        self, handler, session: Session, sample_realm: Realm, sample_sending_profile: SendingProfile
    ):
        """Time elapsed % should be bounded to [0, 100]."""
        # Campaign in the past
        begin = datetime.datetime(2026, 1, 1, 10, 0)
        end = datetime.datetime(2026, 1, 2, 10, 0)

        campaign = Campaign(
            name="past_campaign",
            begin_date=begin,
            end_date=end,
            realm_name=sample_realm.name,
            sending_profile_id=sample_sending_profile.id,
            total_recipients=1,
        )
        session.add(campaign)
        session.commit()
        session.refresh(campaign)

        result = handler._to_detail_info(campaign)
        assert result.time_elapsed_percentage <= 100

    def test_first_last_open_timestamps(
        self, handler, session: Session, sample_campaign: Campaign
    ):
        """Should extract first and last open timestamps."""
        open1 = sample_campaign.begin_date + datetime.timedelta(hours=1)
        open2 = sample_campaign.begin_date + datetime.timedelta(hours=2)
        open3 = sample_campaign.begin_date + datetime.timedelta(hours=3)

        sendings = [
            EmailSending(
                user_id="user-1",
                scheduled_date=sample_campaign.begin_date,
                email_to="user1@example.com",
                campaign_id=sample_campaign.id,
                status=EmailSendingStatus.OPENED,
                sent_at=sample_campaign.begin_date,
                opened_at=open1,
            ),
            EmailSending(
                user_id="user-2",
                scheduled_date=sample_campaign.begin_date,
                email_to="user2@example.com",
                campaign_id=sample_campaign.id,
                status=EmailSendingStatus.OPENED,
                sent_at=sample_campaign.begin_date,
                opened_at=open2,
            ),
            EmailSending(
                user_id="user-3",
                scheduled_date=sample_campaign.begin_date,
                email_to="user3@example.com",
                campaign_id=sample_campaign.id,
                status=EmailSendingStatus.OPENED,
                sent_at=sample_campaign.begin_date,
                opened_at=open3,
            ),
        ]
        for s in sendings:
            session.add(s)
        session.commit()
        session.refresh(sample_campaign)

        result = handler._to_detail_info(sample_campaign)
        assert result.first_open_at == open1
        assert result.last_open_at == open3

    def test_first_last_click_timestamps( 
        self, handler, session: Session, sample_campaign: Campaign
    ):
        """Should extract first and last click timestamps."""
        click1 = sample_campaign.begin_date + datetime.timedelta(hours=1)
        click2 = sample_campaign.begin_date + datetime.timedelta(hours=5)

        sendings = [
            EmailSending(
                user_id="user-1",
                scheduled_date=sample_campaign.begin_date,
                email_to="user1@example.com",
                campaign_id=sample_campaign.id,
                status=EmailSendingStatus.CLICKED,
                sent_at=sample_campaign.begin_date,
                clicked_at=click1,
            ),
            EmailSending(
                user_id="user-2",
                scheduled_date=sample_campaign.begin_date,
                email_to="user2@example.com",
                campaign_id=sample_campaign.id,
                status=EmailSendingStatus.CLICKED,
                sent_at=sample_campaign.begin_date,
                clicked_at=click2,
            ),
        ]
        for s in sendings:
            session.add(s)
        session.commit()
        session.refresh(sample_campaign)

        result = handler._to_detail_info(sample_campaign)
        assert result.first_click_at == click1
        assert result.last_click_at == click2

    def test_no_opens_no_clicks(self, handler, session: Session, sample_campaign: Campaign):
        """Should handle campaigns with no user engagement."""
        sending = EmailSending(
            user_id="user-1",
            scheduled_date=sample_campaign.begin_date,
            email_to="user1@example.com",
            campaign_id=sample_campaign.id,
            status=EmailSendingStatus.SENT,
            sent_at=sample_campaign.begin_date,
        )
        session.add(sending)
        session.commit()
        session.refresh(sample_campaign)

        result = handler._to_detail_info(sample_campaign)
        assert result.first_open_at is None
        assert result.last_open_at is None
        assert result.first_click_at is None
        assert result.last_click_at is None

    def test_user_sendings_list(self, handler, session: Session, sample_campaign: Campaign):
        """Should build per-user sending info list."""
        sendings = []
        for i in range(3):
            s = EmailSending(
                user_id=f"user-{i}",
                scheduled_date=sample_campaign.begin_date,
                email_to=f"user{i}@example.com",
                campaign_id=sample_campaign.id,
                status=EmailSendingStatus.SENT,
                sent_at=sample_campaign.begin_date,
            )
            sendings.append(s)
            session.add(s)
        session.commit()
        session.refresh(sample_campaign)

        result = handler._to_detail_info(sample_campaign)
        assert len(result.user_sendings) == 3
        assert all(u.user_id.startswith("user-") for u in result.user_sendings)
        assert all(u.email.endswith("@example.com") for u in result.user_sendings)


# ============================================================================
# Integration Tests: get_global_stats
# ============================================================================


class TestGetGlobalStats:
    """Test global statistics aggregation."""

    def test_empty_realm(self, handler, session: Session):
        """Should return zeroed stats for empty realm."""
        result = handler.get_global_stats("nonexistent_realm", session)
        assert result.total_campaigns == 0
        assert result.total_emails_scheduled == 0
        assert result.total_emails_sent == 0
        assert result.unique_users_targeted == 0

    def test_single_campaign_no_sendings(
        self, handler, session: Session, sample_realm: Realm, sample_sending_profile: SendingProfile
    ):
        """Should count campaign even with no sendings."""
        campaign = Campaign(
            name="empty_campaign",
            begin_date=datetime.datetime(2026, 2, 24, 10, 0),
            end_date=datetime.datetime(2026, 2, 25, 10, 0),
            realm_name=sample_realm.name,
            sending_profile_id=sample_sending_profile.id,
            status=CampaignStatus.SCHEDULED,
            total_recipients=10,
        )
        session.add(campaign)
        session.commit()

        result = handler.get_global_stats(sample_realm.name, session)
        assert result.total_campaigns == 1
        assert result.scheduled_campaigns == 1
        assert result.total_emails_scheduled == 10

    def test_campaign_status_counts(
        self, handler, session: Session, sample_realm: Realm, sample_sending_profile: SendingProfile
    ):
        """Should correctly count campaigns by status."""
        statuses = [
            CampaignStatus.SCHEDULED,
            CampaignStatus.RUNNING,
            CampaignStatus.COMPLETED,
            CampaignStatus.CANCELED,
        ]

        for i, status in enumerate(statuses):
            c = Campaign(
                name=f"campaign_{status}",
                begin_date=datetime.datetime(2026, 2, 24, 10, 0),
                end_date=datetime.datetime(2026, 2, 25, 10, 0),
                realm_name=sample_realm.name,
                sending_profile_id=sample_sending_profile.id,
                status=status,
                total_recipients=1,
            )
            session.add(c)
        session.commit()

        result = handler.get_global_stats(sample_realm.name, session)
        assert result.total_campaigns == 4
        assert result.scheduled_campaigns == 1
        assert result.running_campaigns == 1
        assert result.completed_campaigns == 1
        assert result.canceled_campaigns == 1

    def test_email_engagement_stats(
        self, handler, session: Session, sample_realm: Realm, sample_sending_profile: SendingProfile
    ):
        """Should aggregate email engagement across campaigns."""
        campaign = Campaign(
            name="engagement_test",
            begin_date=datetime.datetime(2026, 2, 24, 10, 0),
            end_date=datetime.datetime(2026, 2, 25, 10, 0),
            realm_name=sample_realm.name,
            sending_profile_id=sample_sending_profile.id,
            total_recipients=10,
            total_opened=5,
            total_clicked=2,
            total_phished=1,
        )
        session.add(campaign)
        session.commit()

        # Add sendings: 8 sent, 2 failed
        for i in range(8):
            s = EmailSending(
                user_id=f"user-{i}",
                scheduled_date=campaign.begin_date,
                email_to=f"user{i}@example.com",
                campaign_id=campaign.id,
                status=EmailSendingStatus.SENT,
                sent_at=campaign.begin_date,
            )
            session.add(s)

        for i in range(8, 10):
            s = EmailSending(
                user_id=f"user-{i}",
                scheduled_date=campaign.begin_date,
                email_to=f"user{i}@example.com",
                campaign_id=campaign.id,
                status=EmailSendingStatus.FAILED,
            )
            session.add(s)
        session.commit()

        result = handler.get_global_stats(sample_realm.name, session)
        assert result.total_emails_scheduled == 10
        assert result.total_emails_sent == 8
        assert result.total_emails_failed == 2
        assert result.total_emails_opened == 5
        assert result.total_emails_clicked == 2
        assert result.total_emails_phished == 1

    def test_delivery_rate_calculation(
        self, handler, session: Session, sample_realm: Realm, sample_sending_profile: SendingProfile
    ):
        """Delivery rate = sent / scheduled * 100."""
        campaign = Campaign(
            name="rate_test",
            begin_date=datetime.datetime(2026, 2, 24, 10, 0),
            end_date=datetime.datetime(2026, 2, 25, 10, 0),
            realm_name=sample_realm.name,
            sending_profile_id=sample_sending_profile.id,
            total_recipients=10,
        )
        session.add(campaign)
        session.commit()

        # Add 7 sent, 3 failed
        for i in range(7):
            s = EmailSending(
                user_id=f"user-{i}",
                scheduled_date=campaign.begin_date,
                email_to=f"user{i}@example.com",
                campaign_id=campaign.id,
                status=EmailSendingStatus.SENT,
                sent_at=campaign.begin_date,
            )
            session.add(s)

        for i in range(7, 10):
            s = EmailSending(
                user_id=f"user-{i}",
                scheduled_date=campaign.begin_date,
                email_to=f"user{i}@example.com",
                campaign_id=campaign.id,
                status=EmailSendingStatus.FAILED,
            )
            session.add(s)
        session.commit()

        result = handler.get_global_stats(sample_realm.name, session)
        assert result.delivery_rate == pytest.approx(70.0)  # 7/10 * 100

    def test_open_rate_calculation(
        self, handler, session: Session, sample_realm: Realm, sample_sending_profile: SendingProfile
    ):
        """Open rate = opened / sent * 100."""
        campaign = Campaign(
            name="open_rate_test",
            begin_date=datetime.datetime(2026, 2, 24, 10, 0),
            end_date=datetime.datetime(2026, 2, 25, 10, 0),
            realm_name=sample_realm.name,
            sending_profile_id=sample_sending_profile.id,
            total_recipients=10,
            total_opened=4,
        )
        session.add(campaign)
        session.commit()

        # Add 10 sent
        for i in range(10):
            s = EmailSending(
                user_id=f"user-{i}",
                scheduled_date=campaign.begin_date,
                email_to=f"user{i}@example.com",
                campaign_id=campaign.id,
                status=EmailSendingStatus.SENT,
                sent_at=campaign.begin_date,
            )
            session.add(s)
        session.commit()

        result = handler.get_global_stats(sample_realm.name, session)
        assert result.open_rate == pytest.approx(40.0)  # 4/10 * 100

    def test_unique_users_targeted(
        self, handler, session: Session, sample_realm: Realm, sample_sending_profile: SendingProfile
    ):
        """Should count unique users across campaigns."""
        campaign1 = Campaign(
            name="campaign_1",
            begin_date=datetime.datetime(2026, 2, 24, 10, 0),
            end_date=datetime.datetime(2026, 2, 25, 10, 0),
            realm_name=sample_realm.name,
            sending_profile_id=sample_sending_profile.id,
            total_recipients=2,
        )
        campaign2 = Campaign(
            name="campaign_2",
            begin_date=datetime.datetime(2026, 2, 26, 10, 0),
            end_date=datetime.datetime(2026, 2, 27, 10, 0),
            realm_name=sample_realm.name,
            sending_profile_id=sample_sending_profile.id,
            total_recipients=2,
        )
        session.add_all([campaign1, campaign2])
        session.commit()

        # User-1 and user-2 in campaign1, user-2 and user-3 in campaign2
        # Unique: user-1, user-2, user-3 = 3
        sendings = [
            EmailSending(
                user_id="user-1",
                scheduled_date=campaign1.begin_date,
                email_to="user1@example.com",
                campaign_id=campaign1.id,
                status=EmailSendingStatus.SENT,
                sent_at=campaign1.begin_date,
            ),
            EmailSending(
                user_id="user-2",
                scheduled_date=campaign1.begin_date,
                email_to="user2@example.com",
                campaign_id=campaign1.id,
                status=EmailSendingStatus.SENT,
                sent_at=campaign1.begin_date,
            ),
            EmailSending(
                user_id="user-2",
                scheduled_date=campaign2.begin_date,
                email_to="user2@example.com",
                campaign_id=campaign2.id,
                status=EmailSendingStatus.SENT,
                sent_at=campaign2.begin_date,
            ),
            EmailSending(
                user_id="user-3",
                scheduled_date=campaign2.begin_date,
                email_to="user3@example.com",
                campaign_id=campaign2.id,
                status=EmailSendingStatus.SENT,
                sent_at=campaign2.begin_date,
            ),
        ]
        for s in sendings:
            session.add(s)
        session.commit()

        result = handler.get_global_stats(sample_realm.name, session)
        assert result.unique_users_targeted == 3

    def test_repeat_offenders_in_global_stats(
        self, handler, session: Session, sample_realm: Realm, sample_sending_profile: SendingProfile
    ):
        """Should identify repeat offenders in global stats."""
        campaign1 = Campaign(
            name="campaign_1",
            begin_date=datetime.datetime(2026, 2, 24, 10, 0),
            end_date=datetime.datetime(2026, 2, 25, 10, 0),
            realm_name=sample_realm.name,
            sending_profile_id=sample_sending_profile.id,
            total_recipients=1,
        )
        campaign2 = Campaign(
            name="campaign_2",
            begin_date=datetime.datetime(2026, 2, 26, 10, 0),
            end_date=datetime.datetime(2026, 2, 27, 10, 0),
            realm_name=sample_realm.name,
            sending_profile_id=sample_sending_profile.id,
            total_recipients=1,
        )
        session.add_all([campaign1, campaign2])
        session.commit()

        # User fell for both campaigns (100% > 50%)
        sendings = [
            EmailSending(
                user_id="villain-1",
                scheduled_date=campaign1.begin_date,
                email_to="villain@example.com",
                campaign_id=campaign1.id,
                status=EmailSendingStatus.PHISHED,
                sent_at=campaign1.begin_date,
                phished_at=campaign1.begin_date + datetime.timedelta(minutes=1),
            ),
            EmailSending(
                user_id="villain-1",
                scheduled_date=campaign2.begin_date,
                email_to="villain@example.com",
                campaign_id=campaign2.id,
                status=EmailSendingStatus.PHISHED,
                sent_at=campaign2.begin_date,
                phished_at=campaign2.begin_date + datetime.timedelta(minutes=1),
            ),
        ]
        for s in sendings:
            session.add(s)
        session.commit()

        result = handler.get_global_stats(sample_realm.name, session)
        assert "villain-1" in result.repeat_offenders

    def test_multiple_realms_isolated(
        self, handler, session: Session, sample_sending_profile: SendingProfile
    ):
        """Should only aggregate stats for requested realm."""
        realm1 = Realm(name="realm_1", domain="realm1.example.com", sso_enabled=False)
        realm2 = Realm(name="realm_2", domain="realm2.example.com", sso_enabled=False)
        session.add_all([realm1, realm2])
        session.commit()

        c1 = Campaign(
            name="campaign_1",
            begin_date=datetime.datetime(2026, 2, 24, 10, 0),
            end_date=datetime.datetime(2026, 2, 25, 10, 0),
            realm_name="realm_1",
            sending_profile_id=sample_sending_profile.id,
            total_recipients=10,
        )
        c2 = Campaign(
            name="campaign_2",
            begin_date=datetime.datetime(2026, 2, 24, 10, 0),
            end_date=datetime.datetime(2026, 2, 25, 10, 0),
            realm_name="realm_2",
            sending_profile_id=sample_sending_profile.id,
            total_recipients=20,
        )
        session.add_all([c1, c2])
        session.commit()

        result1 = handler.get_global_stats("realm_1", session)
        result2 = handler.get_global_stats("realm_2", session)

        assert result1.total_campaigns == 1
        assert result2.total_campaigns == 1
        assert result1.total_emails_scheduled == 10
        assert result2.total_emails_scheduled == 20
