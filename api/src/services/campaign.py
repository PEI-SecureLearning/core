import datetime
import math
from fastapi import HTTPException
from sqlmodel import Session, select

from src.models.campaign import (
    MIN_INTERVAL,
    Campaign,
    CampaignCreate,
    CampaignDetailInfo,
    CampaignDisplayInfo,
    CampaignGlobalStats,
    CampaignStatus,
    TemplateSelection,
)
from src.models.email_sending import EmailSending, UserSendingInfo
from src.models.email_template import EmailTemplate
from src.models.landing_page_template import LandingPageTemplate
from src.models.sending_profile import SendingProfile
from src.models.realm import Realm
from src.models.user import User
from src.services.realm import list_group_members_in_realm


class CampaignService:
    """Service class for managing campaigns."""

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

        self._create_email_sendings(session, new_campaign, users)
        session.commit()

        return new_campaign

    def get_campaigns(
        self, current_realm: str, session: Session
    ) -> list[CampaignDisplayInfo]:
        """Fetch all campaigns for the current realm."""
        campaigns = session.exec(
            select(Campaign).where(Campaign.realm_name == current_realm)
        ).all()
        return [self._to_display_info(c) for c in campaigns]

    def get_campaign_by_id(
        self, id: int, current_realm: str, session: Session
    ) -> CampaignDetailInfo | None:
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

        # Update campaign status
        campaign.status = CampaignStatus.CANCELED

        # Cancel all pending (scheduled) email sendings
        from src.models.email_sending import EmailSendingStatus

        for sending in campaign.email_sendings:
            if sending.status == EmailSendingStatus.SCHEDULED:
                sending.status = EmailSendingStatus.FAILED

        session.commit()
        session.refresh(campaign)

        return campaign

    def get_global_stats(
        self, current_realm: str, session: Session
    ) -> CampaignGlobalStats:
        """Calculate global statistics across all campaigns for the realm."""
        campaigns = session.exec(
            select(Campaign).where(Campaign.realm_name == current_realm)
        ).all()

        # Campaign status counts
        status_counts = {status: 0 for status in CampaignStatus}
        for c in campaigns:
            status_counts[c.status] += 1

        # Use stored campaign counters for aggregate stats
        total_scheduled = sum(c.total_recipients for c in campaigns)
        total_opened = sum(c.total_opened for c in campaigns)
        total_clicked = sum(c.total_clicked for c in campaigns)
        total_phished = sum(c.total_phished for c in campaigns)

        # These still need dynamic calculation (sent/failed not stored on campaign)
        all_sendings: list[EmailSending] = []
        for c in campaigns:
            all_sendings.extend(c.email_sendings)
        total_sent = sum(1 for s in all_sendings if s.sent_at)
        total_failed = sum(1 for s in all_sendings if s.status.value == "failed")

        # Unique users
        unique_users = set(s.user_id for s in all_sendings)
        users_opened = set(s.user_id for s in all_sendings if s.opened_at)
        users_clicked = set(s.user_id for s in all_sendings if s.clicked_at)
        users_phished = set(s.user_id for s in all_sendings if s.phished_at)

        # Repeat offenders: users who clicked/phished in > 50% of campaigns they participated in
        repeat_offenders = self._find_repeat_offenders(campaigns)

        # Time calculations
        avg_open_time = self._calc_avg_time_delta(
            [
                (s.sent_at, s.opened_at)
                for s in all_sendings
                if s.sent_at and s.opened_at
            ]
        )
        avg_click_time = self._calc_avg_time_delta(
            [
                (s.sent_at, s.clicked_at)
                for s in all_sendings
                if s.sent_at and s.clicked_at
            ]
        )

        return CampaignGlobalStats(
            # Campaign counts
            total_campaigns=len(campaigns),
            scheduled_campaigns=status_counts[CampaignStatus.SCHEDULED],
            running_campaigns=status_counts[CampaignStatus.RUNNING],
            completed_campaigns=status_counts[CampaignStatus.COMPLETED],
            canceled_campaigns=status_counts[CampaignStatus.CANCELED],
            # Email statistics
            total_emails_scheduled=total_scheduled,
            total_emails_sent=total_sent,
            total_emails_opened=total_opened,
            total_emails_clicked=total_clicked,
            total_emails_phished=total_phished,
            total_emails_failed=total_failed,
            # Rates
            delivery_rate=(
                round(total_sent / total_scheduled * 100, 2) if total_scheduled else 0.0
            ),
            open_rate=round(total_opened / total_sent * 100, 2) if total_sent else 0.0,
            click_rate=(
                round(total_clicked / total_sent * 100, 2) if total_sent else 0.0
            ),
            phish_rate=(
                round(total_phished / total_sent * 100, 2) if total_sent else 0.0
            ),
            # User vulnerability
            unique_users_targeted=len(unique_users),
            users_who_opened=len(users_opened),
            users_who_clicked=len(users_clicked),
            users_who_phished=len(users_phished),
            repeat_offenders=repeat_offenders,
            # Time-based
            avg_time_to_open_seconds=avg_open_time,
            avg_time_to_click_seconds=avg_click_time,
        )

    def _find_repeat_offenders(self, campaigns: list[Campaign]) -> list[str]:
        """Find users who clicked/phished in more than 50% of campaigns they were targeted in."""
        user_campaigns: dict[str, dict] = {}  # user_id -> {targeted: int, fell: int}

        for campaign in campaigns:
            users_in_campaign = set()
            users_fell_in_campaign = set()

            for sending in campaign.email_sendings:
                users_in_campaign.add(sending.user_id)
                if sending.clicked_at or sending.phished_at:
                    users_fell_in_campaign.add(sending.user_id)

            for user_id in users_in_campaign:
                if user_id not in user_campaigns:
                    user_campaigns[user_id] = {"targeted": 0, "fell": 0}
                user_campaigns[user_id]["targeted"] += 1
                if user_id in users_fell_in_campaign:
                    user_campaigns[user_id]["fell"] += 1

        return [
            user_id
            for user_id, stats in user_campaigns.items()
            if stats["targeted"] > 0 and stats["fell"] / stats["targeted"] > 0.5
        ]

    def _calc_avg_time_delta(
        self, time_pairs: list[tuple[datetime.datetime, datetime.datetime]]
    ) -> float | None:
        """Calculate average time difference in seconds."""
        if not time_pairs:
            return None
        total_seconds = sum((end - start).total_seconds() for start, end in time_pairs)
        return round(total_seconds / len(time_pairs), 2)

    # ======================================================================
    # Helper methods
    # ======================================================================

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
        self, session: Session, existing_id: int | None, realm: str
    ) -> int:
        """Use provided sending profile or create a placeholder for the realm."""
        if existing_id is not None:
            existing = session.get(SendingProfile, existing_id)
            if existing:
                return existing.id  # type: ignore[return-value]

        # Only set FK if realm exists; otherwise keep it nullable to avoid FK violation
        realm_fk = realm if session.get(Realm, realm) else None
        placeholder = SendingProfile(
            name="Placeholder SMTP",
            smtp_host="smtp.example.com",
            smtp_port=587,
            username="placeholder",
            password="placeholder",
            from_fname="Secure",
            from_lname="Learning",
            from_email="noreply@example.com",
            realm_name=realm_fk,
        )
        session.add(placeholder)
        session.flush()
        return placeholder.id  # type: ignore[return-value]

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

    def _to_display_info(self, campaign: Campaign) -> CampaignDisplayInfo:
        """Convert a Campaign to CampaignDisplayInfo using stored stats."""
        # total_sent still calculated dynamically (not stored on campaign)
        total_sent = sum(1 for s in campaign.email_sendings if s.sent_at is not None)
        return CampaignDisplayInfo(
            id=campaign.id,  # type: ignore
            name=campaign.name,
            begin_date=campaign.begin_date,
            end_date=campaign.end_date,
            status=campaign.status,
            total_sent=total_sent,
            total_opened=campaign.total_opened,
            total_clicked=campaign.total_clicked,
        )

    def _to_detail_info(self, campaign: Campaign) -> CampaignDetailInfo:
        """Convert a Campaign to CampaignDetailInfo with full details and stats."""
        sendings = campaign.email_sendings
        now = datetime.datetime.now()

        # Use stored counts where available
        total_recipients = campaign.total_recipients
        total_opened = campaign.total_opened
        total_clicked = campaign.total_clicked
        total_phished = campaign.total_phished
        # These still need dynamic calculation
        total_sent = sum(1 for s in sendings if s.sent_at)
        total_failed = sum(1 for s in sendings if s.status.value == "failed")

        # Time metrics
        open_times = [
            (s.sent_at, s.opened_at) for s in sendings if s.sent_at and s.opened_at
        ]
        click_times = [
            (s.sent_at, s.clicked_at) for s in sendings if s.sent_at and s.clicked_at
        ]

        opened_dates = [s.opened_at for s in sendings if s.opened_at]
        clicked_dates = [s.clicked_at for s in sendings if s.clicked_at]

        # Progress calculations
        campaign_duration = (campaign.end_date - campaign.begin_date).total_seconds()
        elapsed = (min(now, campaign.end_date) - campaign.begin_date).total_seconds()
        time_elapsed_pct = (
            (elapsed / campaign_duration * 100) if campaign_duration > 0 else 0
        )
        progress_pct = (
            (total_sent / total_recipients * 100) if total_recipients > 0 else 0
        )

        # User sendings breakdown
        user_sendings = [
            UserSendingInfo(
                user_id=s.user_id,
                email=s.email_to,
                status=s.status.value,
                sent_at=s.sent_at,
                opened_at=s.opened_at,
                clicked_at=s.clicked_at,
                phished_at=s.phished_at,
            )
            for s in sendings
        ]

        return CampaignDetailInfo(
            # Core attributes
            id=campaign.id,  # type: ignore
            name=campaign.name,
            description=campaign.description,
            begin_date=campaign.begin_date,
            end_date=campaign.end_date,
            sending_interval_seconds=campaign.sending_interval_seconds,
            status=campaign.status,
            realm_name=campaign.realm_name,
            # Related entities
            email_template_id=campaign.email_template_id,
            landing_page_template_id=campaign.landing_page_template_id,
            sending_profile_name=(
                campaign.sending_profile.name if campaign.sending_profile else None
            ),
            email_template_name=(
                campaign.email_template.name if campaign.email_template else None
            ),
            landing_page_template_name=(
                campaign.landing_page_template.name
                if campaign.landing_page_template
                else None
            ),
            # Statistics
            total_recipients=total_recipients,
            total_sent=total_sent,
            total_opened=total_opened,
            total_clicked=total_clicked,
            total_phished=total_phished,
            total_failed=total_failed,
            # Rates
            delivery_rate=(
                round(total_sent / total_recipients * 100, 2)
                if total_recipients
                else 0.0
            ),
            open_rate=round(total_opened / total_sent * 100, 2) if total_sent else 0.0,
            click_rate=(
                round(total_clicked / total_sent * 100, 2) if total_sent else 0.0
            ),
            phish_rate=(
                round(total_phished / total_sent * 100, 2) if total_sent else 0.0
            ),
            # Progress
            progress_percentage=round(progress_pct, 2),
            time_elapsed_percentage=round(max(0, min(100, time_elapsed_pct)), 2),
            # Time metrics
            avg_time_to_open_seconds=self._calc_avg_time_delta(open_times),
            avg_time_to_click_seconds=self._calc_avg_time_delta(click_times),
            first_open_at=min(opened_dates) if opened_dates else None,
            last_open_at=max(opened_dates) if opened_dates else None,
            first_click_at=min(clicked_dates) if clicked_dates else None,
            last_click_at=max(clicked_dates) if clicked_dates else None,
            # User breakdown
            user_sendings=user_sendings,
        )
