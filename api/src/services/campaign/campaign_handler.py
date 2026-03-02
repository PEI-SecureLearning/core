import math
from fastapi import HTTPException
from sqlmodel import Session, select

from src.models.campaign import (
    MIN_INTERVAL_SECONDS,
    Campaign,
    CampaignCreate,
    CampaignStatus,
)
from src.models.email_sending import EmailSendingStatus
from src.models.phishing_kit import PhishingKit
from src.models.sending_profile import SendingProfile
from src.models.realm import Realm
from src.models.user import User
from src.models.user_group import UserGroup
from src.services.platform_admin import get_platform_admin_service


class CampaignHandler:
    def create_campaign(
        self, campaign: CampaignCreate, current_realm: str, session: Session
    ) -> Campaign:
        """Create a new campaign"""
        self._ensure_realm_exists(session, current_realm)

        self._validate_campaign(campaign, session)

        users = self._collect_users_from_groups(campaign.user_group_ids, current_realm)
        interval = self._calculate_interval(campaign, len(users))

        new_campaign = Campaign(
            **campaign.model_dump(
                exclude={
                    "user_group_ids",
                    "sending_interval_seconds",
                    "phishing_kit_ids",
                }
            ),
            sending_interval_seconds=interval,
            total_recipients=len(users),
            realm_name=current_realm,
        )
        session.add(new_campaign)
        session.flush()

        # Link phishing kits (M2M)
        for kit_id in campaign.phishing_kit_ids:
            kit = session.get(PhishingKit, kit_id)
            if kit:
                new_campaign.phishing_kits.append(kit)
        session.flush()
        session.commit()

        return new_campaign

    def get_campaigns(self, current_realm: str, session: Session) -> list:
        """Fetch all campaigns for the current realm."""
        campaigns = session.exec(
            select(Campaign).where(Campaign.realm_name == current_realm)
        ).all()
        return [self._to_display_info(c) for c in campaigns]

    def get_campaign_by_id(self, id: int, current_realm: str, session: Session):
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

    def update_campaign(
        self,
        id: int,
        campaign_update: CampaignCreate,
        current_realm: str,
        session: Session,
    ) -> Campaign:
        """Update a campaign. Only for SCHEDULED campaigns."""
        campaign = session.exec(
            select(Campaign).where(
                Campaign.id == id, Campaign.realm_name == current_realm
            )
        ).first()

        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")

        if campaign.status != CampaignStatus.SCHEDULED:
            raise HTTPException(
                status_code=400, detail="Cannot update a running or completed campaign"
            )

        for k, v in campaign_update.model_dump(
            exclude={"user_group_ids", "phishing_kit_ids", "creator_id"}
        ).items():
            setattr(campaign, k, v)

        if campaign_update.user_group_ids:
            campaign.user_groups.clear()
            for group_id in campaign_update.user_group_ids:
                group = session.get(UserGroup, group_id)
                if group:
                    campaign.user_groups.append(group)

        if campaign_update.phishing_kit_ids:
            campaign.phishing_kits.clear()
            for kit_id in campaign_update.phishing_kit_ids:
                kit = session.get(PhishingKit, kit_id)
                if kit:
                    campaign.phishing_kits.append(kit)

        session.commit()
        session.refresh(campaign)

        return campaign

    def delete_campaign(self, id: int, current_realm: str, session: Session) -> str:
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
            for member in (
                get_platform_admin_service()
                .list_group_members_in_realm(realm, group_id)
                .get("members", [])
            ):
                if (user_id := member.get("id")) and user_id not in users:
                    users[user_id] = member
        return users

    def _calculate_interval(self, campaign: CampaignCreate, user_count: int) -> int:
        """Calculate the sending interval based on campaign duration and user count."""
        total_seconds = (campaign.end_date - campaign.begin_date).total_seconds()
        return max(
            campaign.sending_interval_seconds,
            math.ceil(total_seconds / user_count)
            if user_count
            else MIN_INTERVAL_SECONDS,
            MIN_INTERVAL_SECONDS,
        )

    def _ensure_realm_exists(self, session: Session, realm_name: str) -> None:
        """Ensure a Realm row exists before assigning FK fields."""
        if session.get(Realm, realm_name):
            return
        session.add(Realm(name=realm_name, domain=f"{realm_name}.local"))
        session.flush()

    def _validate_campaign(self, campaign: CampaignCreate, session: Session) -> None:
        """Validate campaign data."""
        if campaign.sending_profile_id is not None and not session.get(
            SendingProfile, campaign.sending_profile_id
        ):
            raise HTTPException(status_code=400, detail="Invalid sending profile ID")

        for kit_id in campaign.phishing_kit_ids:
            if not session.get(PhishingKit, kit_id):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid phishing kit ID: {kit_id}",
                )

        if campaign.creator_id is not None and not session.get(
            User, campaign.creator_id
        ):
            raise HTTPException(status_code=400, detail="Invalid creator ID")

        if campaign.sending_interval_seconds <= 0:
            raise HTTPException(
                status_code=400, detail="Sending interval must be positive"
            )
