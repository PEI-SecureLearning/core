import datetime
import random

from sqlmodel import Session

from src.models.campaign import Campaign
from src.models.email_sending import (
    EmailSending,
    RabbitMQEmailMessage,
    SMTPConfig,
)
from src.models.phishing_kit import PhishingKit
from src.services import templates as TemplateService
from src.services.rabbit import RabbitMQService

rabbitmq_service = RabbitMQService()


class email_handler:

    def _send_emails_to_rabbitmq(
        self, campaign: Campaign, email_sendings: list[EmailSending]
    ) -> None:
        """Send emails to RabbitMQ.

        Each email_sending already has a phishing_kit_id assigned (picked at random
        during creation). We resolve the template and sending profile per-email
        from the assigned kit.
        """
        for email_sending in email_sendings:
            kit = email_sending.phishing_kit
            # Resolve sending profile: kit-level > campaign-level
            sending_profile = (
                (kit.sending_profile if kit and kit.sending_profile else None)
                or campaign.sending_profile
            )
            if not sending_profile:
                raise ValueError(
                    f"No sending profile for email_sending {email_sending.id}"
                )

            smtp_config = SMTPConfig(
                host=sending_profile.smtp_host,
                port=sending_profile.smtp_port,
                user=sending_profile.username,
                password=sending_profile.password,
            )

            email_template = kit.email_template if kit else None
            subject = email_template.subject if email_template else "Campaign Email"

            # Build template arguments: kit args + per-email context
            template_args = dict(kit.args) if kit else {}
            template_args["name"] = email_sending.user_id
            template_args["tracking_id"] = email_sending.tracking_token

            email_message = RabbitMQEmailMessage(
                smtp_config=smtp_config,
                sender_email=sending_profile.from_email,
                receiver_email=email_sending.email_to,
                subject=subject,
                template_id=email_template.content_link if email_template else "",
                tracking_id=email_sending.tracking_token,
                arguments=template_args,
            )
            rabbitmq_service.send_email(email_message)

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
        kits: list[PhishingKit] = campaign.phishing_kits
        email_sendings = []
        for i, (user_id, user_data) in enumerate(users.items()):
            scheduled_date = campaign.begin_date + datetime.timedelta(
                seconds=i * campaign.sending_interval_seconds
            )
            # Pick a random kit for this recipient
            selected_kit = random.choice(kits) if kits else None

            email_sending = EmailSending(
                user_id=user_id,
                campaign_id=campaign.id,
                phishing_kit_id=selected_kit.id if selected_kit else None,
                scheduled_date=scheduled_date,
                email_to=user_data.get("email", ""),
            )
            session.add(email_sending)
            email_sendings.append(email_sending)
        session.flush()
        return email_sendings
