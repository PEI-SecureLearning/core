from datetime import datetime
from typing import Optional, List

from sqlmodel import Field, Relationship, SQLModel


class CampaignGroupLink(SQLModel, table=True):
    """Link table for Campaign-Group many-to-many relationship"""
    __tablename__ = "campaign_group_link"

    campaign_id: Optional[int] = Field(default=None, foreign_key="campaign.id", primary_key=True)
    group_id: Optional[int] = Field(default=None, foreign_key="group.id", primary_key=True)


class Campaign(SQLModel, table=True):
    """Campaign model for phishing campaigns"""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
    begin_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    time_between_sending: Optional[int] = Field(default=None, description="Seconds between sends")
    status: Optional[str] = None
    total_sent: int = Field(default=0)
    total_opened: int = Field(default=0)
    total_clicked: int = Field(default=0)
    sending_profile_id: Optional[int] = Field(default=None, foreign_key="sending_profile.id")
    email_template_id: Optional[int] = Field(default=None, foreign_key="email_template.id")
    landing_page_template_id: Optional[int] = Field(default=None, foreign_key="landing_page_template.id")
    tenant_id: Optional[int] = None
    creator_id: int = Field(foreign_key="user.id")

    # Relationships
    creator: "User" = Relationship(back_populates="created_campaigns")
    groups: List["Group"] = Relationship(back_populates="campaigns", link_model=CampaignGroupLink)
    schedules: List["EmailSending"] = Relationship(back_populates="campaign")
    remediation_plan: Optional["RemediationPlan"] = Relationship(back_populates="campaign")


class CampaignCreate(SQLModel):
    """Schema for creating a campaign"""
    name: str
    description: Optional[str] = None
    begin_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    time_between_sending: Optional[int] = None
    status: Optional[str] = None
    sending_profile_id: Optional[int] = None
    email_template_id: Optional[int] = None
    landing_page_template_id: Optional[int] = None
    tenant_id: Optional[int] = None
    creator_id: int


class CampaignUpdate(SQLModel):
    """Schema for updating a campaign"""
    name: Optional[str] = None
    description: Optional[str] = None
    begin_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    time_between_sending: Optional[int] = None
    status: Optional[str] = None
    sending_profile_id: Optional[int] = None
    email_template_id: Optional[int] = None
    landing_page_template_id: Optional[int] = None
    tenant_id: Optional[int] = None
