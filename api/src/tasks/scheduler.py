"""Background scheduler for periodic tasks."""

import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlmodel import Session, select

from src.core.db import engine
from src.models.campaign import Campaign, CampaignStatus

logger = logging.getLogger(__name__)

# Global scheduler instance
_scheduler: BackgroundScheduler | None = None


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


def start_scheduler(interval_minutes: int = 1) -> BackgroundScheduler:
    """Start the background scheduler.

    Args:
        interval_minutes: How often to run the status update job (default: 1 minute)

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

    _scheduler.start()
    logger.info(
        f"Scheduler started (campaign status check every {interval_minutes} min)"
    )

    # Run once immediately on startup
    update_campaign_statuses()

    return _scheduler


def shutdown_scheduler() -> None:
    """Shutdown the scheduler gracefully."""
    global _scheduler

    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("Scheduler shutdown complete")
