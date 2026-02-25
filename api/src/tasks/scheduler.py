"""Background scheduler for periodic tasks."""

import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlmodel import Session, select

from src.core.db import engine
from src.models.campaign import Campaign, CampaignStatus
from src.models.email_sending import EmailSending, EmailSendingStatus
from src.services.campaign import CampaignService

logger = logging.getLogger(__name__)

# Global scheduler instance
_scheduler: BackgroundScheduler | None = None

# Batch size for email processing
EMAILS_PER_BATCH = 10


def update_campaign_statuses() -> None:
    """Update campaign statuses based on current time.

    - SCHEDULED -> RUNNING: when begin_date <= now
    - RUNNING -> COMPLETED: when end_date <= now
    """
    with Session(engine) as session:
        now = datetime.now()
        updated_count = 0

        # Scheduled -> Running
        scheduled_campaigns = session.exec(
            select(Campaign).where(
                Campaign.status == CampaignStatus.SCHEDULED, Campaign.begin_date <= now
            )
        ).all()

        for campaign in scheduled_campaigns:
            campaign.status = CampaignStatus.RUNNING
            updated_count += 1
            logger.info(f"Campaign '{campaign.name}' (id={campaign.id}) -> RUNNING")

        # Running -> Completed
        running_campaigns = session.exec(
            select(Campaign).where(
                Campaign.status == CampaignStatus.RUNNING, Campaign.end_date <= now
            )
        ).all()

        for campaign in running_campaigns:
            campaign.status = CampaignStatus.COMPLETED
            updated_count += 1
            logger.info(f"Campaign '{campaign.name}' (id={campaign.id}) -> COMPLETED")

        if updated_count > 0:
            session.commit()
            logger.info(f"Updated {updated_count} campaign status(es)")


def create_emails_for_ready_campaigns() -> None:
    """Create email sending records for campaigns that are ready to begin.
    
    - Queries campaigns with status SCHEDULED and begin_date <= now
    - Creates email_sendings for all users in the campaign
    - Updates campaign status to RUNNING
    """
    with Session(engine) as session:
        now = datetime.now()
        campaign_service = CampaignService()
        created_count = 0

        # Find campaigns that should have emails created
        ready_campaigns = session.exec(
            select(Campaign).where(
                Campaign.status == CampaignStatus.SCHEDULED, Campaign.begin_date <= now
            )
        ).all()

        for campaign in ready_campaigns:
            try:
                # Collect users from groups
                users = campaign_service._collect_users_from_groups(
                    [ug.id for ug in campaign.user_groups], campaign.realm_name
                )
                
                # Create email sendings
                email_sendings = campaign_service._create_email_sendings(
                    session, campaign, users
                )
                
                # Update total_recipients now that emails are created
                campaign.total_recipients = len(users)
                
                created_count += len(email_sendings)
                logger.info(
                    f"Campaign '{campaign.name}' (id={campaign.id}): "
                    f"created {len(email_sendings)} email sendings"
                )
                
                session.commit()
            except Exception as e:
                logger.error(
                    f"Failed to create emails for campaign '{campaign.name}' (id={campaign.id}): {e}"
                )
                session.rollback()

        if created_count > 0:
            logger.info(f"Created {created_count} email sending record(s) total")


def process_pending_emails() -> None:
    """Process pending emails in batches and send to RabbitMQ.
    
    - Queries EmailSending records with status SCHEDULED
    - Sorts by campaign begin_date (oldest to newest)
    - Processes EMAILS_PER_BATCH emails per run
    - Sends to RabbitMQ and marks as SENT
    """
    with Session(engine) as session:
        campaign_service = CampaignService()
        
        try:
            # Query pending emails, sorted by campaign begin_date (oldest first)
            pending_emails = session.exec(
                select(EmailSending)
                .join(Campaign, EmailSending.campaign_id == Campaign.id)
                .where(EmailSending.status == EmailSendingStatus.SCHEDULED)
                .order_by(Campaign.begin_date.asc())
                .limit(EMAILS_PER_BATCH)
            ).all()

            if not pending_emails:
                return

            # Group emails by campaign for efficient sending
            emails_by_campaign: dict[int, list[EmailSending]] = {}
            for email in pending_emails:
                if email.campaign_id not in emails_by_campaign:
                    emails_by_campaign[email.campaign_id] = []
                emails_by_campaign[email.campaign_id].append(email)

            # Process each campaign's emails
            for campaign_id, campaign_emails in emails_by_campaign.items():
                campaign = session.get(Campaign, campaign_id)
                if not campaign:
                    logger.warning(f"Campaign {campaign_id} not found, skipping batch")
                    continue

                try:
                    # Send emails to RabbitMQ
                    campaign_service._send_emails_to_rabbitmq(
                        session, campaign, campaign_emails
                    )
                    
                    # Update status and timestamp for sent emails
                    now = datetime.now()
                    for email in campaign_emails:
                        email.status = EmailSendingStatus.SENT
                        email.sent_at = now
                    
                    session.commit()
                    logger.info(
                        f"Processed {len(campaign_emails)} email(s) from campaign "
                        f"'{campaign.name}' (id={campaign.id})"
                    )
                except Exception as e:
                    logger.error(
                        f"Failed to process emails for campaign {campaign_id}: {e}"
                    )
                    session.rollback()

            logger.info(f"Processed {len(pending_emails)} pending email(s)")

        except Exception as e:
            logger.error(f"Error in process_pending_emails: {e}")
            session.rollback()



def start_scheduler(interval_minutes: int = 1) -> BackgroundScheduler:
    """Start the background scheduler.

    Args:
        interval_minutes: How often to run the scheduled jobs (default: 1 minute)

    Returns:
        The scheduler instance
    """
    global _scheduler

    if _scheduler is not None:
        logger.warning("Scheduler already running")
        return _scheduler

    _scheduler = BackgroundScheduler()

    # Add job to update campaign statuses
    _scheduler.add_job(
        update_campaign_statuses,
        trigger=IntervalTrigger(minutes=interval_minutes),
        id="update_campaign_statuses",
        name="Update campaign statuses based on time",
        replace_existing=True,
    )

    # Add job to create emails for ready campaigns
    _scheduler.add_job(
        create_emails_for_ready_campaigns,
        trigger=IntervalTrigger(minutes=interval_minutes),
        id="create_emails_for_ready_campaigns",
        name="Create email sendings for ready campaigns",
        replace_existing=True,
    )

    # Add job to process pending emails in batches
    _scheduler.add_job(
        process_pending_emails,
        trigger=IntervalTrigger(minutes=interval_minutes),
        id="process_pending_emails",
        name="Process pending emails and send to RabbitMQ",
        replace_existing=True,
    )

    _scheduler.start()
    logger.info(
        f"Scheduler started (jobs run every {interval_minutes} min)"
    )

    # Run once immediately on startup
    update_campaign_statuses()
    create_emails_for_ready_campaigns()
    process_pending_emails()

    return _scheduler


def shutdown_scheduler() -> None:
    """Shutdown the scheduler gracefully."""
    global _scheduler

    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("Scheduler shutdown complete")
