from enum import StrEnum
from typing import Optional
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime


class EmailSendingStatus(StrEnum):
    SCHEDULED = "scheduled"
    SENT = "sent"
    OPENED = "opened"
    CLICKED = "clicked"
    PHISHED = "phished"
    FAILED = "failed"


class EmailSending(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.keycloak_id")
    scheduled_date: datetime
    status: EmailSendingStatus = Field(default=EmailSendingStatus.SCHEDULED)

    campaign_id: Optional[int] = Field(default=None, foreign_key="campaign.id")

    campaign: Optional["Campaign"] = Relationship(back_populates="email_sendings")
    user: Optional["User"] = Relationship(
        back_populates="email_sendings"
    )  # Assuming a User model exists


class EmailSendingCreate(SQLModel):
    user_id: str
    scheduled_date: datetime
    status: EmailSendingStatus
    campaign_id: int
