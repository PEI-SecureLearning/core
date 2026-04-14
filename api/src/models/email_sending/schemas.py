from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel


class UserSendingInfo(SQLModel):
    """Summary of a user's interaction with a campaign email."""

    user_id: str
    email: str
    status: str
    campaign_id: int
    campaign_name: str
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    phished_at: Optional[datetime] = None


class CampaignSendingsResponse(SQLModel):
    """Wrapper for campaign sendings endpoint response."""

    sendings: list[UserSendingInfo] = []


class SMTPConfig(SQLModel):
    """SMTP server configuration."""

    host: str
    port: int
    user: str
    password: str


class RabbitMQEmailMessage(SQLModel):
    """Email message payload from RabbitMQ."""

    smtp_config: SMTPConfig
    sender_email: str
    receiver_email: str
    subject: str
    template_id: str
    tracking_id: str
    arguments: dict[str, str] = {}
