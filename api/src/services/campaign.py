import datetime
import math
from fastapi import HTTPException
from sqlmodel import Session, col, func, select

from src.models.campaign import MIN_INTERVAL, Campaign, CampaignCreate
from src.models.email_sending import EmailSending, EmailSendingStatus
from src.models.email_template import EmailTemplate
from src.models.landing_page_template import LandingPageTemplate
from src.models.sending_profile import SendingProfile
from src.models.user import User
from src.models.user_group import UserGroup


class CampaignService:
    """Service class for managing campaigns."""

    def create_campaign(self, campaign: CampaignCreate, session: Session) -> Campaign:
        """Create a new campaign with scheduled email sendings."""
        self._validate_campaign(campaign, session)

        # Collect unique user IDs from all user groups
        user_ids = {
            uid
            for ug_id in campaign.user_group_ids
            for uid in self._get_userids_in_group(ug_id)
        }

        # Adjust sending interval based on user count and campaign duration
        total_seconds = (campaign.end_date - campaign.begin_date).total_seconds()
        adjusted_interval = max(
            campaign.sending_interval_seconds,
            math.ceil(total_seconds / len(user_ids)) if user_ids else MIN_INTERVAL,
            MIN_INTERVAL,
        )

        # Create and persist campaign
        new_campaign = Campaign(
            **campaign.model_dump(exclude={"user_group_ids"}),
            sending_interval_seconds=adjusted_interval,
        )
        session.add(new_campaign)
        session.flush()  # Get campaign ID without committing

        # Create email sendings one by one
        for i, user_id in enumerate(user_ids):
            session.add(
                EmailSending(
                    user_id=user_id,
                    campaign_id=new_campaign.id,
                    scheduled_date=campaign.begin_date
                    + datetime.timedelta(seconds=i * adjusted_interval),
                )
            )
        session.commit()

        return new_campaign

    def get_all_campaigns(self, session: Session) -> list[Campaign]:
        """Fetch all campaigns."""
        return list(session.exec(select(Campaign)).all())

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
            select(func.count()).where(
                col(UserGroup.keycloak_id).in_(campaign.user_group_ids)
            )
        ).one()
        if user_group_count != len(campaign.user_group_ids):
            raise HTTPException(status_code=400, detail="Invalid user group IDs")

        if campaign.sending_interval_seconds <= 0:
            raise HTTPException(
                status_code=400, detail="Sending interval must be positive"
            )

    def _get_userids_in_group(self, user_group_id: str) -> list[str]:
        """Fetch user IDs in a user group (mock implementation)."""
        # TODO: Replace with Keycloak API call
        n = hash(user_group_id) % 10
        return [f"user-{i}" for i in range(n * 10, (n + 1) * 10)]
