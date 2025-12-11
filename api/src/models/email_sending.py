from datetime import datetime
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel


class EmailSending(SQLModel, table=True):
    """Email sending event tied to a campaign"""
    __tablename__ = "email_sending"

    id: Optional[int] = Field(default=None, primary_key=True)
    email_to: str
    scheduled_time: datetime
    status: Optional[str] = None
    tracking_token: Optional[str] = Field(default=None, index=True)
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    campaign_id: int = Field(foreign_key="campaign.id")
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")

    # Relationships
    campaign: "Campaign" = Relationship(back_populates="schedules")
    landing_pages: list["LandingPage"] = Relationship(back_populates="email_sending")


class EmailSendingCreate(SQLModel):
    email_to: str
    scheduled_time: datetime
    status: Optional[str] = None
    tracking_token: Optional[str] = None
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    campaign_id: int
    user_id: Optional[int] = None


class EmailSendingUpdate(SQLModel):
    email_to: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    status: Optional[str] = None
    tracking_token: Optional[str] = None
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    user_id: Optional[int] = None
