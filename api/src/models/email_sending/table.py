from enum import StrEnum
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime

from src.utils import token


if TYPE_CHECKING:
    from ..campaign import Campaign
    from ..phishing_kit import PhishingKit
    from ..user import User


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
    )
    sent_at: Optional[datetime] = Field(default=None)
    opened_at: Optional[datetime] = Field(default=None)
    clicked_at: Optional[datetime] = Field(default=None)
    phished_at: Optional[datetime] = Field(default=None)

    campaign_id: Optional[int] = Field(default=None, foreign_key="campaign.id")
    phishing_kit_id: Optional[int] = Field(default=None, foreign_key="phishingkit.id")

    campaign: Optional["Campaign"] = Relationship(back_populates="email_sendings")
    phishing_kit: Optional["PhishingKit"] = Relationship(back_populates="email_sendings")
    user: Optional["User"] = Relationship(back_populates="email_sendings")
