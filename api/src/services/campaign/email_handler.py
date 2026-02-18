import datetime

from sqlmodel import Session

from src.models.campaign import Campaign
from src.models.email_sending import (
    EmailSending,
    RabbitMQEmailMessage,
    SMTPConfig,
)
from src.models.email_template import EmailTemplate
from src.services.rabbit import RabbitMQService

rabbitmq_service = RabbitMQService()


class Email_handler:

    def _send_emails_to_rabbitmq(
        self, session: Session, campaign: Campaign, email_sendings: list[EmailSending]
    ) -> None:
        """Send emails to RabbitMQ."""
        sending_profile = campaign.sending_profile
        if not sending_profile:
            raise ValueError("Campaign has no sending profile associated.")

        smtp_config = SMTPConfig(
            host=sending_profile.smtp_host,
            port=sending_profile.smtp_port,
            user=sending_profile.username,
            password=sending_profile.password,
        )

        email_template = campaign.email_template
        if not email_template and campaign.email_template_id:
            email_template = session.get(EmailTemplate, campaign.email_template_id)

        subject = email_template.subject if email_template else "Campaign Email"

        for email_sending in email_sendings:
            email_message = RabbitMQEmailMessage(
                smtp_config=smtp_config,
                sender_email=sending_profile.from_email,
                receiver_email=email_sending.email_to,
                subject=subject,
                template_id=email_template.content_link,
                tracking_id=email_sending.tracking_token,
                arguments={"name": email_sending.user_id},
            )
            rabbitmq_service.send_email(email_message)

    def _create_email_sendings(
        self,
        session: Session,
        campaign: Campaign,
        users: dict[str, dict],
    ) -> list[EmailSending]:
        """Create email sending records for all users and return them."""
        email_sendings = []
        for i, (user_id, user_data) in enumerate(users.items()):
            scheduled_date = campaign.begin_date + datetime.timedelta(
                seconds=i * campaign.sending_interval_seconds
            )
            email_sending = EmailSending(
                user_id=user_id,
                campaign_id=campaign.id,
                scheduled_date=scheduled_date,
                email_to=user_data.get("email", ""),
            )
            session.add(email_sending)
            email_sendings.append(email_sending)
        session.flush()
        return email_sendings
