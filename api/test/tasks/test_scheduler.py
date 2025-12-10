"""Tests for the background scheduler."""

import datetime
import pytest
from sqlmodel import Session, SQLModel, create_engine, select
from sqlmodel.pool import StaticPool
from unittest.mock import patch

from src.models.campaign import Campaign, CampaignStatus
from src.tasks.scheduler import update_campaign_statuses


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


class TestUpdateCampaignStatuses:
    """Tests for the update_campaign_statuses task."""

    def test_scheduled_to_running(self, engine, session: Session):
        """Test that scheduled campaigns become running when begin_date passes."""
        now = datetime.datetime.now()

        # Campaign that should start (begin_date in the past)
        campaign = Campaign(
            name="Should Start",
            begin_date=now - datetime.timedelta(hours=1),
            end_date=now + datetime.timedelta(days=1),
            status=CampaignStatus.SCHEDULED,
        )
        session.add(campaign)
        session.commit()
        campaign_id = campaign.id

        # Run the task with mocked engine
        with patch("src.tasks.scheduler.engine", engine):
            update_campaign_statuses()

        # Refresh session to see changes from the other session
        session.expire_all()

        # Verify status changed
        updated = session.get(Campaign, campaign_id)
        assert updated is not None
        assert updated.status == CampaignStatus.RUNNING

    def test_running_to_completed(self, engine, session: Session):
        """Test that running campaigns become completed when end_date passes."""
        now = datetime.datetime.now()

        # Campaign that should complete (end_date in the past)
        campaign = Campaign(
            name="Should Complete",
            begin_date=now - datetime.timedelta(days=2),
            end_date=now - datetime.timedelta(hours=1),
            status=CampaignStatus.RUNNING,
        )
        session.add(campaign)
        session.commit()
        campaign_id = campaign.id

        # Run the task with mocked engine
        with patch("src.tasks.scheduler.engine", engine):
            update_campaign_statuses()

        # Refresh session to see changes from the other session
        session.expire_all()

        # Verify status changed
        updated = session.get(Campaign, campaign_id)
        assert updated is not None
        assert updated.status == CampaignStatus.COMPLETED

    def test_scheduled_stays_scheduled(self, engine, session: Session):
        """Test that future scheduled campaigns stay scheduled."""
        now = datetime.datetime.now()

        # Campaign in the future
        campaign = Campaign(
            name="Future Campaign",
            begin_date=now + datetime.timedelta(days=1),
            end_date=now + datetime.timedelta(days=7),
            status=CampaignStatus.SCHEDULED,
        )
        session.add(campaign)
        session.commit()
        campaign_id = campaign.id

        # Run the task with mocked engine
        with patch("src.tasks.scheduler.engine", engine):
            update_campaign_statuses()

        # Verify status unchanged
        updated = session.get(Campaign, campaign_id)
        assert updated is not None
        assert updated.status == CampaignStatus.SCHEDULED

    def test_running_stays_running(self, engine, session: Session):
        """Test that active running campaigns stay running."""
        now = datetime.datetime.now()

        # Campaign that is currently running
        campaign = Campaign(
            name="Active Campaign",
            begin_date=now - datetime.timedelta(days=1),
            end_date=now + datetime.timedelta(days=6),
            status=CampaignStatus.RUNNING,
        )
        session.add(campaign)
        session.commit()
        campaign_id = campaign.id

        # Run the task with mocked engine
        with patch("src.tasks.scheduler.engine", engine):
            update_campaign_statuses()

        # Verify status unchanged
        updated = session.get(Campaign, campaign_id)
        assert updated is not None
        assert updated.status == CampaignStatus.RUNNING

    def test_canceled_not_affected(self, engine, session: Session):
        """Test that canceled campaigns are not affected."""
        now = datetime.datetime.now()

        # Canceled campaign with dates that would trigger transition
        campaign = Campaign(
            name="Canceled Campaign",
            begin_date=now - datetime.timedelta(days=2),
            end_date=now - datetime.timedelta(hours=1),
            status=CampaignStatus.CANCELED,
        )
        session.add(campaign)
        session.commit()
        campaign_id = campaign.id

        # Run the task with mocked engine
        with patch("src.tasks.scheduler.engine", engine):
            update_campaign_statuses()

        # Verify status unchanged (still canceled)
        updated = session.get(Campaign, campaign_id)
        assert updated is not None
        assert updated.status == CampaignStatus.CANCELED

    def test_multiple_campaigns_updated(self, engine, session: Session):
        """Test that multiple campaigns are updated in one run."""
        now = datetime.datetime.now()

        # Campaign that should start
        campaign1 = Campaign(
            name="Should Start",
            begin_date=now - datetime.timedelta(hours=1),
            end_date=now + datetime.timedelta(days=1),
            status=CampaignStatus.SCHEDULED,
        )

        # Campaign that should complete
        campaign2 = Campaign(
            name="Should Complete",
            begin_date=now - datetime.timedelta(days=2),
            end_date=now - datetime.timedelta(hours=1),
            status=CampaignStatus.RUNNING,
        )

        # Campaign that stays scheduled
        campaign3 = Campaign(
            name="Future",
            begin_date=now + datetime.timedelta(days=1),
            end_date=now + datetime.timedelta(days=7),
            status=CampaignStatus.SCHEDULED,
        )

        session.add_all([campaign1, campaign2, campaign3])
        session.commit()
        id1, id2, id3 = campaign1.id, campaign2.id, campaign3.id

        # Run the task with mocked engine
        with patch("src.tasks.scheduler.engine", engine):
            update_campaign_statuses()

        # Refresh session to see changes from the other session
        session.expire_all()

        # Verify statuses
        assert session.get(Campaign, id1).status == CampaignStatus.RUNNING
        assert session.get(Campaign, id2).status == CampaignStatus.COMPLETED
        assert session.get(Campaign, id3).status == CampaignStatus.SCHEDULED
