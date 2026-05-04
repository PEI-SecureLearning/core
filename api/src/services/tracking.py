from datetime import datetime
from fastapi import HTTPException
from sqlmodel import Session, select, text, update

from src.models import Campaign, EmailSending, EmailSendingStatus

from src.services import templates as TemplateService
from src.services.risk import risk_service


class TrackingService:
    """Service for tracking email interactions and updating campaign statistics."""

    def record_sent(self, tracking_token: str, session: Session) -> EmailSending:
        """Record that an email was successfully sent."""
        sending = self._get_sending_by_token(tracking_token, session)

        # Only record first send
        if sending.sent_at is None:
            sending.sent_at = datetime.now()
            sending.status = EmailSendingStatus.SENT
            session.add(sending)

            # Increment campaign counter atomically
            session.exec(
                update(Campaign)
                .where(Campaign.id == sending.campaign_id)
                .values(total_sent=Campaign.total_sent + 1)
            )
            session.commit()
            session.refresh(sending)

        return sending

    def record_open(self, tracking_token: str, session: Session) -> EmailSending:
        """Record an email open event and increment campaign counter."""
        sending = self._get_sending_by_token(tracking_token, session)

        # Only count first open
        if sending.opened_at is None:
            sending.opened_at = datetime.now()
            sending.status = EmailSendingStatus.OPENED
            session.add(sending)

            # Increment campaign counter atomically
            session.exec(
                update(Campaign)
                .where(Campaign.id == sending.campaign_id)
                .values(total_opened=Campaign.total_opened + 1)
            )
            session.commit()
            session.refresh(sending)

        risk_service.recalculate_e_factor(sending.user_id, session)
        risk_service.recalculate_total_risk(sending.user_id, session)

        return sending

    def record_click(self, tracking_token: str, session: Session) -> EmailSending:
        """Record a link click event and increment campaign counter."""
        sending = self._get_sending_by_token(tracking_token, session)

        # Record open if not already recorded (click implies open)
        if sending.opened_at is None:
            sending.opened_at = datetime.now()
            # Increment campaign counter atomically
            session.exec(
                update(Campaign)
                .where(Campaign.id == sending.campaign_id)
                .values(total_opened=Campaign.total_opened + 1)
            )

        # Only count first click
        if sending.clicked_at is None:
            sending.clicked_at = datetime.now()
            sending.status = EmailSendingStatus.CLICKED
            session.add(sending)
            
            # Increment campaign counter atomically
            session.exec(
                update(Campaign)
                .where(Campaign.id == sending.campaign_id)
                .values(total_clicked=Campaign.total_clicked + 1)
            )
            
        session.commit()
        session.refresh(sending)

        risk_service.recalculate_e_factor(sending.user_id, session)
        risk_service.recalculate_total_risk(sending.user_id, session)

        return sending

    async def get_click_response(self, sending: EmailSending, tracking_token: str) -> str:
        """Retrieve and render the landing page template for a click tracking event."""
        kit = sending.phishing_kit
        if not kit or not kit.landing_page_template:
            raise HTTPException(status_code=404, detail="Phishing kit not found")

        template = await TemplateService.get_template_internal(kit.landing_page_template.content_link)

        if template is None:
            raise HTTPException(status_code=404, detail="Page not found")

        # Render template with phish endpoint as redirect
        rendered_html = TemplateService.render_template(template.html, {
            "redirect": f"/api/track/phish?si={tracking_token}"
        })

        return rendered_html

    def record_phish(self, tracking_token: str, session: Session) -> EmailSending:
        """Record a phishing event (user submitted credentials) and increment campaign counter."""
        sending = self._get_sending_by_token(tracking_token, session)

        # Record open and click if not already recorded (phish implies both)
        if sending.opened_at is None:
            sending.opened_at = datetime.now()
            session.exec(
                update(Campaign)
                .where(Campaign.id == sending.campaign_id)
                .values(total_opened=Campaign.total_opened + 1)
            )
            
        if sending.clicked_at is None:
            sending.clicked_at = datetime.now()
            session.exec(
                update(Campaign)
                .where(Campaign.id == sending.campaign_id)
                .values(total_clicked=Campaign.total_clicked + 1)
            )

        # Only count first phish
        if sending.phished_at is None:
            sending.phished_at = datetime.now()
            sending.status = EmailSendingStatus.PHISHED
            session.add(sending)
            
            session.exec(
                update(Campaign)
                .where(Campaign.id == sending.campaign_id)
                .values(total_phished=Campaign.total_phished + 1)
            )
            
        session.commit()
        session.refresh(sending)

        risk_service.recalculate_e_factor(sending.user_id, session)
        risk_service.recalculate_total_risk(sending.user_id, session)

        return sending

    def record_failed(self, tracking_token: str, error_cause: str, session: Session) -> EmailSending:
        """Record that an email failed to send."""
        sending = self._get_sending_by_token(tracking_token, session)

        if sending.status != EmailSendingStatus.FAILED:
            sending.status = EmailSendingStatus.FAILED
            sending.error_cause = error_cause
            session.add(sending)
            session.commit()
            session.refresh(sending)

        return sending

    def record_report(self, tracking_token: str, session: Session) -> EmailSending:
        """Record a phishing report event."""
        sending = self._get_sending_by_token(tracking_token, session)

        if sending.reported_at is None:
            sending.reported_at = datetime.now()
            sending.status = EmailSendingStatus.REPORTED
            session.add(sending)
            session.commit()
            session.refresh(sending)
            
            risk_service.recalculate_e_factor(sending.user_id, session)
            risk_service.recalculate_total_risk(sending.user_id, session)

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
