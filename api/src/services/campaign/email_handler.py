import datetime
import random

from sqlmodel import Session

from src.models.campaign import Campaign, CampaignStatus
from src.models.email_sending import (
    EmailSending,
    RabbitMQEmailMessage,
    SMTPConfig,
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
        profile = (kit and kit.sending_profile) or campaign.sending_profile

        if not profile:
            raise ValueError(f"No sending profile for email_sending {email_sending.id}")

        template = kit and kit.email_template
        
        if not template:
            raise ValueError(f"No email template for email_sending {email_sending.id}")

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
                subject=template.subject if template else "Campaign Email",
                template_id=template.content_link,
                tracking_id=email_sending.tracking_token,
                arguments={
                    **(kit.args if kit and kit.args else {}),
                    "name": email_sending.user_id,
                    "tracking_id": email_sending.tracking_token,
                },
            )
        )

    def _create_email_sendings(
        self,
        session: Session,
        campaign: Campaign,
        users: dict[str, dict],
    ) -> list[EmailSending]:
        """Create email sending records for all users.

        Each user is assigned a randomly selected PhishingKit from the
        campaign's available kits.
        """
        
        if campaign.status != CampaignStatus.RUNNING:
            raise ValueError("Campaign must be running to create email sendings")
        
        kits = campaign.phishing_kits
        
        if not kits:
            raise ValueError("Campaign must have at least one phishing kit to create email sendings")

        email_sendings = [
            EmailSending(
                user_id=user_id,
                campaign_id=campaign.id,
                phishing_kit_id=random.choice(kits).id,
                scheduled_date=campaign.begin_date
                + datetime.timedelta(seconds=i * campaign.sending_interval_seconds),
                email_to=user_data.get("email", ""),
            )
            for i, (user_id, user_data) in enumerate(users.items())
        ]

        session.add_all(email_sendings)
        session.flush()
        return email_sendings

