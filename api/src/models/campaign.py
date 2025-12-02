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
    description: str
    creator_id: int = Field(foreign_key="user.id")

    # Relationships
    creator: "User" = Relationship(back_populates="created_campaigns")
    groups: List["Group"] = Relationship(back_populates="campaigns", link_model=CampaignGroupLink)
    schedules: List["EmailSending"] = Relationship(back_populates="campaign")
    remediation_plan: Optional["RemediationPlan"] = Relationship(back_populates="campaign")


class CampaignCreate(SQLModel):
    """Schema for creating a campaign"""
    name: str
    description: str
    creator_id: int


class CampaignUpdate(SQLModel):
    """Schema for updating a campaign"""
    name: Optional[str] = None
    description: Optional[str] = None
