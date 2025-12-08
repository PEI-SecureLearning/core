import datetime
from fastapi import HTTPException
from sqlmodel import Session, col, func, select
from src.models.campaign import MIN_INTERVAL, Campaign, CampaignCreate
from src.models.email_sending import (
    EmailSending,
    EmailSendingCreate,
    EmailSendingStatus,
)
from src.models.email_template import EmailTemplate
from src.models.landing_page_template import LandingPageTemplate
from src.models.sending_profile import SendingProfile
from src.models.user import User

import math

from src.models.user_group import UserGroup


class CampaignService:
    """Service class for managing campaigns."""

    def create_campaign(self, campaign: CampaignCreate, session: Session) -> bool:
        """Create a new campaign."""

        self._validate_campaign(campaign, session)  # throws an exception if invalid

        # logic to adjust sending interval based on users and campaign duration
        n_users = len(campaign.user_group_ids)
        total_seconds = (campaign.end_date - campaign.begin_date).total_seconds()
        new_interval = math.ceil(total_seconds / n_users)
        new_interval = max(
            campaign.sending_interval_seconds, new_interval, MIN_INTERVAL
        )
        campaign.sending_interval_seconds = new_interval

        new_campaign = Campaign.model_validate(campaign)
        session.add(new_campaign)
        session.commit()
        session.refresh(new_campaign)

        for ug_id in campaign.user_group_ids:
            users = session.exec(
                select(User).join(UserGroup.users).where(UserGroup.id == ug_id)
            ).all()

        return True

    def get_all_campaigns(self, session: Session) -> list[Campaign]:
        """Fetch all campaigns."""
        campaigns = session.exec(select(Campaign)).all()
        return [Campaign.model_validate(c) for c in campaigns]

    def _validate_campaign(self, campaign: CampaignCreate, session: Session) -> None:
        """Validate campaign data."""

        if not session.get(User, campaign.creator_id):
            raise HTTPException(status_code=400, detail="Invalid creator ID")

        if not session.get(SendingProfile, campaign.sending_profile_id):
            raise HTTPException(status_code=400, detail="Invalid sending profile ID")

        if not session.get(EmailTemplate, campaign.email_template_id):
            raise HTTPException(status_code=400, detail="Invalid email template ID")

        if not session.get(LandingPageTemplate, campaign.landing_page_template_id):
            raise HTTPException(
                status_code=400, detail="Invalid landing page template ID"
            )

        user_group_count = session.exec(
            select(func.count()).where(col(UserGroup.id).in_(campaign.user_group_ids))
        ).one()
        if user_group_count != len(campaign.user_group_ids):
            raise HTTPException(status_code=400, detail="Invalid user group IDs")

        if campaign.sending_interval_seconds <= 0:
            raise HTTPException(
                status_code=400, detail="Sending interval must be a positive integer"
            )

    def _create_email_sending(
        self, user_id: int, campaign_id: int, ts: datetime.datetime
    ) -> EmailSendingCreate:
        """Create an email sending record for a user in a campaign."""
        email_sending = EmailSendingCreate(
            user_id=user_id,
            campaign_id=campaign_id,
            scheduled_date=ts,
            status=EmailSendingStatus.PENDING,
        )

        return email_sending
