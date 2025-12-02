from datetime import datetime
from typing import Optional, List

from sqlmodel import Field, Relationship, SQLModel


class EmailSendingTemplateLink(SQLModel, table=True):
    """Link table for EmailSending-EmailTemplate many-to-many relationship"""
    __tablename__ = "email_sending_template_link"

    email_sending_id: Optional[int] = Field(default=None, foreign_key="email_sending.id", primary_key=True)
    email_template_id: Optional[int] = Field(default=None, foreign_key="email_template.id", primary_key=True)


class EmailSending(SQLModel, table=True):
    """Email sending schedule model"""
    __tablename__ = "email_sending"

    id: Optional[int] = Field(default=None, primary_key=True)
    profile: str  # Email profile to use
    date: datetime
    time: str  # Time of day for sending
    args: Optional[str] = None  # Additional arguments as JSON
    campaign_id: int = Field(foreign_key="campaign.id")

    # Relationships
    campaign: "Campaign" = Relationship(back_populates="schedules")
    email_templates: List["EmailTemplate"] = Relationship(
        back_populates="email_sendings",
        link_model=EmailSendingTemplateLink
    )
    landing_pages: List["LandingPage"] = Relationship(back_populates="email_sending")


class EmailSendingCreate(SQLModel):
    """Schema for creating an email sending"""
    profile: str
    date: datetime
    time: str
    args: Optional[str] = None
    campaign_id: int
    email_template_ids: List[int]


class EmailSendingUpdate(SQLModel):
    """Schema for updating an email sending"""
    profile: Optional[str] = None
    date: Optional[datetime] = None
    time: Optional[str] = None
    args: Optional[str] = None
    email_template_ids: Optional[List[int]] = None
