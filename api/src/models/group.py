from typing import Optional, List

from sqlmodel import Field, Relationship, SQLModel

from .user import UserGroupLink
from .campaign import CampaignGroupLink


class Group(SQLModel, table=True):
    """Group model for organizing users"""
    id: Optional[int] = Field(default=None, primary_key=True)
    description: str
    tenant_id: int = Field(foreign_key="tenant.id")

    # Relationships
    tenant: "Tenant" = Relationship(back_populates="groups")
    users: List["User"] = Relationship(back_populates="groups", link_model=UserGroupLink)
    campaigns: List["Campaign"] = Relationship(back_populates="groups", link_model=CampaignGroupLink)


class GroupCreate(SQLModel):
    """Schema for creating a group"""
    description: str
    tenant_id: int


class GroupUpdate(SQLModel):
    """Schema for updating a group"""
    description: Optional[str] = None
    tenant_id: Optional[int] = None
