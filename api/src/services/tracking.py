from datetime import datetime
from fastapi import HTTPException
from sqlmodel import Session, select, text

from src.models.campaign import Campaign
from src.models.email_sending import EmailSending, EmailSendingStatus


class TrackingService:
    """Service for tracking email interactions and updating campaign statistics."""

    def record_sent(self, tracking_token: str, session: Session):
        """Record an email sent event and increment campaign counter."""
        sending = self._get_sending_by_token(tracking_token, session)

        # Only count first sent
        if sending.sent_at is None:
            sending.sent_at = datetime.now()
            sending.status = EmailSendingStatus.SENT

            # Atomically increment campaign counter
            session.exec(
                text(
                    "UPDATE campaign SET total_sent = total_sent + 1 WHERE id = :campaign_id"
                ),
                {"campaign_id": sending.campaign_id},
            )
            session.commit()
            session.refresh(sending)

    def record_open(self, tracking_token: str, session: Session) -> EmailSending:
        """Record an email open event and increment campaign counter."""
        sending = self._get_sending_by_token(tracking_token, session)

        # Only count first open
        if sending.opened_at is None:
            sending.opened_at = datetime.now()
            sending.status = EmailSendingStatus.OPENED

            # Increment campaign counter using ORM
            campaign = session.get(Campaign, sending.campaign_id)
            if campaign:
                campaign.total_opened += 1
                session.add(campaign)
                session.commit()
                session.refresh(sending)

        return sending

    def record_click(self, tracking_token: str, session: Session) -> EmailSending:
        """Record a link click event and increment campaign counter."""
        sending = self._get_sending_by_token(tracking_token, session)

        # Record open if not already recorded (click implies open)
        if sending.opened_at is None:
            sending.opened_at = datetime.now()
            # Increment campaign counter using ORM
            campaign = session.get(Campaign, sending.campaign_id)
            if campaign:
                campaign.total_opened += 1
                session.add(campaign)
                session.commit()

        # Only count first click
        if sending.clicked_at is None:
            sending.clicked_at = datetime.now()
            sending.status = EmailSendingStatus.CLICKED
            # Increment campaign counter using ORM
            campaign = session.get(Campaign, sending.campaign_id)
            if campaign:
                campaign.total_clicked += 1
                session.add(campaign)
                session.commit()
            session.refresh(sending)

        return sending

    def record_phish(self, tracking_token: str, session: Session) -> EmailSending:
        """Record a phishing event (user submitted credentials) and increment campaign counter."""
        sending = self._get_sending_by_token(tracking_token, session)

        # Record open and click if not already recorded (phish implies both)
        campaign = session.get(Campaign, sending.campaign_id)
        if sending.opened_at is None:
            sending.opened_at = datetime.now()
            if campaign:
                campaign.total_opened += 1
        if sending.clicked_at is None:
            sending.clicked_at = datetime.now()
            if campaign:
                campaign.total_clicked += 1

        # Only count first phish
        if sending.phished_at is None:
            sending.phished_at = datetime.now()
            sending.status = EmailSendingStatus.PHISHED
            if campaign:
                campaign.total_phished += 1
            if campaign:
                session.add(campaign)
                session.commit()
            session.refresh(sending)

        return sending

    def _get_sending_by_token(
        self, tracking_token: str, session: Session
    ) -> EmailSending:
        """Get email sending by tracking token or raise 404."""
        sending = session.exec(
            select(EmailSending).where(EmailSending.tracking_token == tracking_token)
        ).first()

        if not sending:
            raise HTTPException(status_code=404, detail="Invalid tracking token")

        return sending
