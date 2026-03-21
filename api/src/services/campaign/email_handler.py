import datetime
import secrets

from sqlmodel import Session

from src.models import (
    Campaign,
    CampaignStatus,
    EmailSending,
    RabbitMQEmailMessage,
    SMTPConfig,
    UserDTO,
)
from src.services.rabbit import RabbitMQService

rabbitmq_service = RabbitMQService()


class EmailHandler:

    def _send_email_to_rabbitmq(
        self, email_sending: EmailSending, campaign: Campaign
    ) -> None:
        """Send a single email to RabbitMQ.

        The email_sending already has a phishing_kit_id assigned (picked at random
        during creation). We resolve the template and sending profile per-email
        from the assigned kit.
        """

        kit = email_sending.phishing_kit

        if not kit:
            raise ValueError(
                f"No phishing kit assigned for email_sending {email_sending.id}"
            )

        kit_profiles = kit.sending_profiles
        campaign_profiles = campaign.sending_profiles

        available_profiles = kit_profiles or campaign_profiles

        if not available_profiles:
            raise ValueError(f"No sending profile for email_sending {email_sending.id}")

        profile = secrets.choice(available_profiles)

        template = kit.email_template

        if not template:
            raise ValueError(f"No email template for email_sending {email_sending.id}")

        subject = template.subject or template.name
        if not subject:
            raise ValueError(
                f"Email template {template.id} has no subject/name for email_sending {email_sending.id}"
            )

        if not template.content_link:
            raise ValueError(
                f"Email template {template.id} has no content_link for email_sending {email_sending.id}"
            )

        rabbitmq_service.send_email(
            RabbitMQEmailMessage(
                smtp_config=SMTPConfig(
                    host=profile.smtp_host,
                    port=profile.smtp_port,
                    user=profile.username,
                    password=profile.password,
                ),
                sender_email=profile.from_email,
                receiver_email=email_sending.email_to,
                subject=subject,
                template_id=template.content_link,
                tracking_id=email_sending.tracking_token,
                arguments={
                    **(kit.args if kit.args else {}),
                    "name": email_sending.user_id,
                    "tracking_id": email_sending.tracking_token,
                },
            )
        )

    def _create_email_sendings(
        self,
        session: Session,
        campaign: Campaign,
        users: list[UserDTO],
    ) -> list[EmailSending]:
        """Create email sending records for all users.

        Each user is assigned a randomly selected PhishingKit from the
        campaign's available kits.
        """

        if campaign.status != CampaignStatus.RUNNING:
            raise ValueError("Campaign must be running to create email sendings")

        kits = campaign.phishing_kits

        if not kits:
            raise ValueError(
                "Campaign must have at least one phishing kit to create email sendings"
            )

        email_sendings = [
            EmailSending(
                user_id=user.id,
                campaign_id=campaign.id,
                phishing_kit_id=secrets.choice(kits).id,
                scheduled_date=campaign.begin_date
                + datetime.timedelta(seconds=i * campaign.sending_interval_seconds),
                email_to=user.email,
            )
            for i, user in enumerate(users)
        ]

        session.add_all(email_sendings)
        session.flush()
        return email_sendings


_instance: EmailHandler | None = None


def get_email_handler() -> EmailHandler:
    global _instance
    if _instance is None:
        _instance = EmailHandler()
    return _instance
