"""Tests for email_handler methods in CampaignService."""

import datetime
from unittest.mock import patch, MagicMock
import pytest

from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from src.models import (
    Campaign,
    CampaignStatus,
    EmailSending,
    EmailTemplate,
    PhishingKit,
    SendingProfile,
    UserDTO,
)


from src.services.campaign import CampaignService


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
    with patch("src.services.campaign.email_handler.rabbitmq_service") as mock:
        yield mock


class TestEmailHandlerCreateSendings:

    def test_create_email_sendings_fails_if_not_running(
        self, service: CampaignService, session: Session
    ):
        """Verify emails are only created if campaign is RUNNING."""
        now = datetime.datetime.now()
        campaign = Campaign(
            name="Scheduled Campaign",
            status=CampaignStatus.SCHEDULED,
            begin_date=now,
            end_date=now + datetime.timedelta(days=1),
            sending_interval_seconds=60,
        )
        users = [UserDTO(id="u1", email="u1@test.com", role="USER", realm="test")]

        with pytest.raises(ValueError, match="Campaign must be running"):
            service._create_email_sendings(session, campaign, users)

    def test_create_email_sendings_success_with_random_kit(
        self, service: CampaignService, session: Session
    ):
        """Verify emails have randomly assigned phishing kit."""
        now = datetime.datetime.now()
        kit1 = PhishingKit(id=1, name="Kit 1", realm_name="test")
        kit2 = PhishingKit(id=2, name="Kit 2", realm_name="test")

        campaign = Campaign(
            id=1,
            name="Running Campaign",
            status=CampaignStatus.RUNNING,
            begin_date=now,
            end_date=now + datetime.timedelta(days=1),
            sending_interval_seconds=60,
        )
        # Using mock relationships
        campaign.phishing_kits = [kit1, kit2]
        session.add(campaign)
        session.commit()

        users = [
            UserDTO(id="u1", email="u1@test.com", role="USER", realm="test"),
            UserDTO(id="u2", email="u2@test.com", role="USER", realm="test"),
            UserDTO(id="u3", email="u3@test.com", role="USER", realm="test"),
        ]

        emails = service._create_email_sendings(session, campaign, users)

        assert len(emails) == 3
        assigned_kit_ids = [e.phishing_kit_id for e in emails]
        assert all(kid in [1, 2] for kid in assigned_kit_ids)


class TestEmailHandlerSendToRabbitMQ:

    def test_send_email_success_with_kit_profile(
        self, service: CampaignService, mock_rabbitmq
    ):
        """Verify it uses the sending profile from the phishing kit if present."""
        profile = SendingProfile(
            name="Profile",
            smtp_host="host",
            smtp_port=25,
            username="u",
            password="",
            from_fname="f",
            from_lname="l",
            from_email="kit@test.com",
            realm_name="test",
        )
        template = EmailTemplate(name="Temp", subject="Sub", content_link="/link")

        kit = PhishingKit(name="Kit", realm_name="test")
        kit.sending_profiles = [profile]
        kit.email_template = template

        email = EmailSending(
            id=1,
            user_id="u1",
            scheduled_date=datetime.datetime.now(),
            email_to="target@test.com",
            tracking_token="token",
        )
        email.phishing_kit = kit

        campaign = Campaign(
            name="Camp",
            status=CampaignStatus.RUNNING,
            begin_date=datetime.datetime.now(),
            end_date=datetime.datetime.now(),
        )

        service._send_email_to_rabbitmq(email, campaign)

        mock_rabbitmq.send_email.assert_called_once()
        msg = mock_rabbitmq.send_email.call_args[0][0]
        assert msg.sender_email == "kit@test.com"
        assert msg.template_id == "/link"

    def test_send_email_success_fallback_to_campaign_profile(
        self, service: CampaignService, mock_rabbitmq
    ):
        """Verify it falls back to the campaign defaults if kit profile is missing."""
        camp_profile = SendingProfile(
            name="Camp Profile",
            smtp_host="host",
            smtp_port=25,
            username="u",
            password="",
            from_fname="f",
            from_lname="l",
            from_email="camp@test.com",
            realm_name="test",
        )
        template = EmailTemplate(name="Temp", subject="Sub", content_link="/link")

        kit = PhishingKit(name="Kit", realm_name="test")
        kit.email_template = template
        # kit has NO sending profile

        email = EmailSending(
            id=1,
            user_id="u1",
            scheduled_date=datetime.datetime.now(),
            email_to="target@test.com",
            tracking_token="token",
        )
        email.phishing_kit = kit

        campaign = Campaign(
            name="Camp",
            status=CampaignStatus.RUNNING,
            begin_date=datetime.datetime.now(),
            end_date=datetime.datetime.now(),
        )
        campaign.sending_profiles = [camp_profile]

        service._send_email_to_rabbitmq(email, campaign)

        mock_rabbitmq.send_email.assert_called_once()
        msg = mock_rabbitmq.send_email.call_args[0][0]
        assert msg.sender_email == "camp@test.com"

    def test_send_email_missing_profile_fails(self, service: CampaignService):
        """Verify an error is raised if neither kit nor campaign has a profile."""
        template = EmailTemplate(name="Temp", subject="Sub", content_link="/link")

        kit = PhishingKit(name="Kit", realm_name="test")
        kit.email_template = template

        email = EmailSending(
            id=1,
            user_id="u1",
            scheduled_date=datetime.datetime.now(),
            email_to="target@test.com",
            tracking_token="token",
        )
        email.phishing_kit = kit

        campaign = Campaign(
            name="Camp",
            status=CampaignStatus.RUNNING,
            begin_date=datetime.datetime.now(),
            end_date=datetime.datetime.now(),
        )
        # Neither has sending profile

        with pytest.raises(ValueError, match="No sending profile"):
            service._send_email_to_rabbitmq(email, campaign)

    def test_send_email_missing_template_fails(self, service: CampaignService):
        """Verify an error is raised if the kit has no email template."""
        profile = SendingProfile(
            name="Profile",
            smtp_host="host",
            smtp_port=25,
            username="u",
            password="",
            from_fname="f",
            from_lname="l",
            from_email="kit@test.com",
            realm_name="test",
        )

        kit = PhishingKit(name="Kit", realm_name="test")
        kit.sending_profiles = [profile]
        # No email template!

        email = EmailSending(
            id=1,
            user_id="u1",
            scheduled_date=datetime.datetime.now(),
            email_to="target@test.com",
            tracking_token="token",
        )
        email.phishing_kit = kit

        campaign = Campaign(
            name="Camp",
            status=CampaignStatus.RUNNING,
            begin_date=datetime.datetime.now(),
            end_date=datetime.datetime.now(),
        )

        # We expect this to fail because template is mandatory
        with pytest.raises(ValueError, match="No email template"):
            service._send_email_to_rabbitmq(email, campaign)


class TestEmailHandlerListUserSendings:

    def test_list_user_sendings_returns_ordered_mapped_records(
        self, service: CampaignService, session: Session
    ):
        now = datetime.datetime.now()
        campaign = Campaign(
            id=10,
            name="Campaign A",
            status=CampaignStatus.RUNNING,
            begin_date=now,
            end_date=now + datetime.timedelta(days=1),
        )
        session.add(campaign)
        session.commit()

        sending_late = EmailSending(
            user_id="u1",
            campaign_id=campaign.id,
            scheduled_date=now + datetime.timedelta(hours=1),
            email_to="u1@test.com",
            status="sent",
        )
        sending_early = EmailSending(
            user_id="u1",
            campaign_id=campaign.id,
            scheduled_date=now,
            email_to="u1@test.com",
            status="opened",
        )
        other_user = EmailSending(
            user_id="u2",
            campaign_id=campaign.id,
            scheduled_date=now,
            email_to="u2@test.com",
            status="clicked",
        )
        session.add_all([sending_late, sending_early, other_user])
        session.commit()

        results = service.list_user_sendings(session, "u1")

        assert len(results) == 2
        assert results[0].status == "opened"
        assert results[1].status == "sent"
        assert results[0].campaign_id == campaign.id
        assert results[0].campaign_name == campaign.name
        assert all(r.user_id == "u1" for r in results)
