import datetime
import math
from fastapi import HTTPException
from sqlmodel import Session, select

from models.campaign import MIN_INTERVAL, Campaign, CampaignCreate, CampaignInfo
from models.email_sending import EmailSending
from models.email_template import EmailTemplate
from models.landing_page_template import LandingPageTemplate
from models.sending_profile import SendingProfile
from models.user import User
from services.realm import list_group_members_in_realm


class CampaignService:
    """Service class for managing campaigns."""

    def create_campaign(
        self, campaign: CampaignCreate, current_realm: str, session: Session
    ) -> Campaign:
        """Create a new campaign with scheduled email sendings."""
        self._validate_campaign(campaign, session)

        users = self._collect_users_from_groups(campaign.user_group_ids, current_realm)
        interval = self._calculate_interval(campaign, len(users))

        new_campaign = Campaign(
            **campaign.model_dump(exclude={"user_group_ids"}),
            sending_interval_seconds=interval,
        )
        session.add(new_campaign)
        session.flush()

        self._create_email_sendings(session, new_campaign, users)
        session.commit()

        return new_campaign

    def get_campaigns(self, current_realm: str, session: Session) -> list[CampaignInfo]:
        """Fetch all campaigns for the current realm."""
        campaigns = session.exec(
            select(Campaign).where(Campaign.realm_name == current_realm)
        ).all()
        return [CampaignInfo.model_validate(c) for c in campaigns]

    def get_campaign_by_id(
        self, id: int, current_realm: str, session: Session
    ) -> CampaignInfo | None:
        """Fetch a campaign by ID for the current realm."""
        campaign = session.exec(
            select(Campaign).where(
                Campaign.id == id, Campaign.realm_name == current_realm
            )
        ).first()
        if campaign:
            return CampaignInfo.model_validate(campaign)
        return None

    def _collect_users_from_groups(
        self, group_ids: list[str], realm: str
    ) -> dict[str, dict]:
        """Collect unique users from multiple groups."""
        users: dict[str, dict] = {}
        for group_id in group_ids:
            for member in list_group_members_in_realm(realm, group_id).get(
                "members", []
            ):
                if (user_id := member.get("id")) and user_id not in users:
                    users[user_id] = member
        return users

    def _calculate_interval(self, campaign: CampaignCreate, user_count: int) -> int:
        """Calculate the sending interval based on campaign duration and user count."""
        total_seconds = (campaign.end_date - campaign.begin_date).total_seconds()
        return max(
            campaign.sending_interval_seconds,
            math.ceil(total_seconds / user_count) if user_count else MIN_INTERVAL,
            MIN_INTERVAL,
        )

    def _create_email_sendings(
        self,
        session: Session,
        campaign: Campaign,
        users: dict[str, dict],
    ) -> None:
        """Create email sending records for all users."""

        for i, (user_id, user_data) in enumerate(users.items()):
            scheduled_date = campaign.begin_date + datetime.timedelta(
                seconds=i * campaign.sending_interval_seconds
            )
            session.add(
                EmailSending(
                    user_id=user_id,
                    campaign_id=campaign.id,
                    scheduled_date=scheduled_date,
                    email_to=user_data.get("email", ""),
                )
            )

    def _validate_campaign(self, campaign: CampaignCreate, session: Session) -> None:
        """Validate campaign data."""
        validations = [
            (User, campaign.creator_id, "Invalid creator ID"),
            (SendingProfile, campaign.sending_profile_id, "Invalid sending profile ID"),
            (EmailTemplate, campaign.email_template_id, "Invalid email template ID"),
            (
                LandingPageTemplate,
                campaign.landing_page_template_id,
                "Invalid landing page template ID",
            ),
        ]

        for model, id_value, error_msg in validations:
            if not session.get(model, id_value):
                raise HTTPException(status_code=400, detail=error_msg)

        if campaign.sending_interval_seconds <= 0:
            raise HTTPException(
                status_code=400, detail="Sending interval must be positive"
            )
