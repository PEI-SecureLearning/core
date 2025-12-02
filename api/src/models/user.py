from datetime import datetime
from typing import Optional, List

from sqlmodel import Field, Relationship, SQLModel


class UserGroupLink(SQLModel, table=True):
    """Link table for User-Group many-to-many relationship"""
    __tablename__ = "user_group_link"

    user_id: Optional[int] = Field(default=None, foreign_key="user.id", primary_key=True)
    group_id: Optional[int] = Field(default=None, foreign_key="group.id", primary_key=True)


class User(SQLModel, table=True):
    """User model representing system users"""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    role: str  # e.g., 'admin', 'user', 'manager'
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    groups: List["Group"] = Relationship(back_populates="users", link_model=UserGroupLink)
    created_campaigns: List["Campaign"] = Relationship(back_populates="creator")
    created_content: List["Content"] = Relationship(back_populates="creator")


class UserCreate(SQLModel):
    """Schema for creating a user"""
    name: str
    email: str
    role: str


class UserUpdate(SQLModel):
    """Schema for updating a user"""
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
