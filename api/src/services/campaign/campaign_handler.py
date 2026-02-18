import math

from fastapi import HTTPException
from sqlmodel import Session, select

from src.models.campaign import (
    MIN_INTERVAL,
    Campaign,
    CampaignCreate,
    CampaignStatus,
    TemplateSelection,
)
from src.models.email_sending import EmailSendingStatus
from src.models.email_template import EmailTemplate
from src.models.landing_page_template import LandingPageTemplate
from src.models.sending_profile import SendingProfile
from src.models.realm import Realm
from src.models.user import User
from src.services.platform_admin import get_platform_admin_service


class campaign_handler:

    def create_campaign(
        self, campaign: CampaignCreate, current_realm: str, session: Session
    ) -> Campaign:
        """Create a new campaign with scheduled email sendings."""
        self._ensure_realm_exists(session, current_realm)

        email_template_id = self._get_or_create_email_template(
            session, campaign.email_template_id, campaign.email_template
        )
        landing_page_template_id = self._get_or_create_landing_page_template(
            session, campaign.landing_page_template_id, campaign.landing_page_template
        )
        sending_profile_id = self._get_or_create_sending_profile(
            session, campaign.sending_profile_id, current_realm
        )

        enriched_campaign = campaign.model_copy(
            update={
                "email_template_id": email_template_id,
                "landing_page_template_id": landing_page_template_id,
                "sending_profile_id": sending_profile_id,
            }
        )

        self._validate_campaign(enriched_campaign, session)

        users = self._collect_users_from_groups(campaign.user_group_ids, current_realm)
        interval = self._calculate_interval(campaign, len(users))

        new_campaign = Campaign(
            **enriched_campaign.model_dump(
                exclude={
                    "user_group_ids",
                    "sending_interval_seconds",
                    "email_template",
                    "landing_page_template",
                }
            ),
            sending_interval_seconds=interval,
            total_recipients=len(users),
            realm_name=current_realm,
        )
        session.add(new_campaign)
        session.flush()

        email_sendings = self._create_email_sendings(session, new_campaign, users)
        self._send_emails_to_rabbitmq(session, new_campaign, email_sendings)
        session.commit()

        return new_campaign

    def get_campaigns(
        self, current_realm: str, session: Session
    ) -> list:
        """Fetch all campaigns for the current realm."""
        campaigns = session.exec(
            select(Campaign).where(Campaign.realm_name == current_realm)
        ).all()
        return [self._to_display_info(c) for c in campaigns]

    def get_campaign_by_id(
        self, id: int, current_realm: str, session: Session
    ):
        """Fetch detailed campaign info by ID for the current realm."""
        campaign = session.exec(
            select(Campaign).where(
                Campaign.id == id, Campaign.realm_name == current_realm
            )
        ).first()
        if not campaign:
            return None
        return self._to_detail_info(campaign)

    def cancel_campaign(
        self, id: int, current_realm: str, session: Session
    ) -> Campaign:
        """Cancel a campaign and all its pending email sendings.

        Only SCHEDULED or RUNNING campaigns can be canceled.
        """
        campaign = session.exec(
            select(Campaign).where(
                Campaign.id == id, Campaign.realm_name == current_realm
            )
        ).first()

        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")

        if campaign.status == CampaignStatus.CANCELED:
            raise HTTPException(status_code=400, detail="Campaign is already canceled")

        if campaign.status == CampaignStatus.COMPLETED:
            raise HTTPException(
                status_code=400, detail="Cannot cancel a completed campaign"
            )

        campaign.status = CampaignStatus.CANCELED

        for sending in campaign.email_sendings:
            if sending.status == EmailSendingStatus.SCHEDULED:
                sending.status = EmailSendingStatus.FAILED

        session.commit()
        session.refresh(campaign)

        return campaign

    def delete_campaign(
        self, id: int, current_realm: str, session: Session
    ) -> str:
        """Delete a campaign and all its associated email sendings.

        Returns the campaign name for confirmation.
        """
        campaign = session.exec(
            select(Campaign).where(
                Campaign.id == id, Campaign.realm_name == current_realm
            )
        ).first()

        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")

        campaign_name = campaign.name

        for sending in campaign.email_sendings:
            session.delete(sending)

        session.delete(campaign)
        session.commit()

        return campaign_name

    # ======================================================================
    # Private helpers for campaign creation
    # ======================================================================

    def _collect_users_from_groups(
        self, group_ids: list[str], realm: str
    ) -> dict[str, dict]:
        """Collect unique users from multiple groups."""
        users: dict[str, dict] = {}
        for group_id in group_ids:
            for member in get_platform_admin_service().list_group_members_in_realm(realm, group_id).get(
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

    def _get_or_create_email_template(
        self,
        session: Session,
        existing_id: int | None,
        selection: TemplateSelection | None,
    ) -> int:
        """Ensure an email template row exists for the selected template."""
        if existing_id is not None:
            return existing_id

        if selection is None:
            raise HTTPException(
                status_code=400, detail="Email template selection is required"
            )

        existing = session.exec(
            select(EmailTemplate).where(EmailTemplate.content_link == selection.id)
        ).first()
        if existing:
            return existing.id  # type: ignore[return-value]

        template = EmailTemplate(
            name=selection.name or "Email template",
            subject=selection.subject or "",
            content_link=selection.id,
        )
        session.add(template)
        session.flush()
        return template.id  # type: ignore[return-value]

    def _get_or_create_landing_page_template(
        self,
        session: Session,
        existing_id: int | None,
        selection: TemplateSelection | None,
    ) -> int:
        """Ensure a landing page template row exists for the selected template."""
        if existing_id is not None:
            return existing_id

        if selection is None:
            raise HTTPException(
                status_code=400, detail="Landing page template selection is required"
            )

        existing = session.exec(
            select(LandingPageTemplate).where(
                LandingPageTemplate.content_link == selection.id
            )
        ).first()
        if existing:
            return existing.id  # type: ignore[return-value]

        template = LandingPageTemplate(
            name=selection.name or "Landing page template",
            content_link=selection.id,
        )
        session.add(template)
        session.flush()
        return template.id  # type: ignore[return-value]

    def _get_or_create_sending_profile(
        self, session: Session, existing_id: int | None
    ) -> int:
        """Use provided sending profile or create a placeholder for the realm."""
        if existing_id is not None:
            existing = session.get(SendingProfile, existing_id)
            if existing:
                return existing.id  # type: ignore[return-value]


    def _ensure_realm_exists(self, session: Session, realm_name: str) -> None:
        """Ensure a Realm row exists before assigning FK fields."""
        if session.get(Realm, realm_name):
            return
        session.add(Realm(name=realm_name, domain=f"{realm_name}.local"))
        session.flush()

    def _validate_campaign(self, campaign: CampaignCreate, session: Session) -> None:
        """Validate campaign data."""
        validations = [
            (SendingProfile, campaign.sending_profile_id, "Invalid sending profile ID"),
            (EmailTemplate, campaign.email_template_id, "Invalid email template ID"),
            (
                LandingPageTemplate,
                campaign.landing_page_template_id,
                "Invalid landing page template ID",
            ),
        ]

        if campaign.creator_id is not None and not session.get(User, campaign.creator_id):
            raise HTTPException(status_code=400, detail="Invalid creator ID")

        for model, id_value, error_msg in validations:
            if id_value is None or not session.get(model, id_value):
                raise HTTPException(status_code=400, detail=error_msg)

        if campaign.sending_interval_seconds <= 0:
            raise HTTPException(
                status_code=400, detail="Sending interval must be positive"
            )
