from enum import StrEnum
from typing import Optional
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime

from src.utils import token


class EmailSendingStatus(StrEnum):
    SCHEDULED = "scheduled"
    SENT = "sent"
    OPENED = "opened"
    CLICKED = "clicked"
    PHISHED = "phished"
    FAILED = "failed"


class EmailSending(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="useres.keycloak_id")
    scheduled_date: datetime
    status: EmailSendingStatus = Field(default=EmailSendingStatus.SCHEDULED)
    email_to: str
    tracking_token: str = Field(
        default_factory=lambda: token.generate_tracking_token()
    )  # You might want to generate a unique token here
    sent_at: Optional[datetime] = Field(default=None)
    opened_at: Optional[datetime] = Field(default=None)
    clicked_at: Optional[datetime] = Field(default=None)
    phished_at: Optional[datetime] = Field(default=None)

    campaign_id: Optional[int] = Field(default=None, foreign_key="campaign.id")

    campaign: Optional["Campaign"] = Relationship(back_populates="email_sendings")
    user: Optional["User"] = Relationship(back_populates="email_sendings")


class EmailSendingCreate(SQLModel):
    user_id: str
    scheduled_date: datetime
    status: EmailSendingStatus
    campaign_id: int


class UserSendingInfo(SQLModel):
    """Summary of a user's interaction with a campaign email."""

    user_id: str
    email: str
    status: str
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    phished_at: Optional[datetime] = None


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