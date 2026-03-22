"""Tests for tasks/scheduler campaign transitions and email processing flow."""

from sqlmodel import Session, select

from src.models import Campaign, CampaignStatus, EmailSending, EmailSendingStatus
from src.tasks.scheduler import (
    create_emails_for_ready_campaigns,
    process_pending_emails,
    update_campaign_statuses,
)


class TestUpdateCampaignStatuses:
    def test_scheduled_campaign_transitions_to_running(
        self,
        session: Session,
        campaign_factory,
        past,
        future,
    ):
        campaign = campaign_factory(
            name="scheduled-campaign",
            status=CampaignStatus.SCHEDULED,
            begin_date=past(hours=2),
            end_date=future(hours=8),
        )

        update_campaign_statuses()

        session.expire_all()
        updated = session.get(Campaign, campaign.id)
        assert updated is not None
        assert updated.status == CampaignStatus.RUNNING

    def test_running_campaign_transitions_to_completed(
        self,
        session: Session,
        campaign_factory,
        past,
    ):
        campaign = campaign_factory(
            name="running-campaign",
            status=CampaignStatus.RUNNING,
            begin_date=past(days=2),
            end_date=past(hours=1),
        )

        update_campaign_statuses()

        session.expire_all()
        updated = session.get(Campaign, campaign.id)
        assert updated is not None
        assert updated.status == CampaignStatus.COMPLETED


class TestCreateEmailsForReadyCampaigns:
    def test_creates_email_sendings_for_running_campaign(
        self,
        session: Session,
        users,
        campaign_factory,
        past,
        future,
    ):
        campaign = campaign_factory(
            name="ready-campaign",
            status=CampaignStatus.RUNNING,
            begin_date=past(hours=3),
            end_date=future(hours=3),
            sending_interval_seconds=1,
        )

        create_emails_for_ready_campaigns()

        sendings = session.exec(
            select(EmailSending).where(EmailSending.campaign_id == campaign.id)
        ).all()
        session.refresh(campaign)

        assert len(sendings) == 3
        assert campaign.total_recipients == 3
        assert all(s.status == EmailSendingStatus.SCHEDULED for s in sendings)
        assert all(s.email_to for s in sendings)

    def test_does_not_duplicate_sendings_on_second_run(
        self,
        session: Session,
        users,
        campaign_factory,
        past,
        future,
    ):
        campaign = campaign_factory(
            name="idempotent-campaign",
            status=CampaignStatus.RUNNING,
            begin_date=past(hours=3),
            end_date=future(hours=3),
            sending_interval_seconds=1,
        )

        create_emails_for_ready_campaigns()
        create_emails_for_ready_campaigns()

        sendings = session.exec(
            select(EmailSending).where(EmailSending.campaign_id == campaign.id)
        ).all()
        assert len(sendings) == 3


class TestProcessPendingEmails:
    def test_processes_pending_emails_and_marks_as_sent(
        self,
        session: Session,
        users,
        campaign_factory,
        past,
        future,
        mock_rabbitmq_service,
    ):
        campaign = campaign_factory(
            name="dispatch-campaign",
            status=CampaignStatus.RUNNING,
            begin_date=past(hours=3),
            end_date=future(hours=3),
            sending_interval_seconds=1,
        )

        create_emails_for_ready_campaigns()
        process_pending_emails()

        sendings = session.exec(
            select(EmailSending).where(EmailSending.campaign_id == campaign.id)
        ).all()

        assert len(sendings) == 3
        assert all(s.status == EmailSendingStatus.SENT for s in sendings)
        assert all(s.sent_at is not None for s in sendings)
        assert mock_rabbitmq_service.send_email.call_count == 3
