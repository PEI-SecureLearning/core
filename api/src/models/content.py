from typing import Optional, List

from sqlmodel import Field, Relationship, SQLModel


class Content(SQLModel, table=True):
    """Content model for phishing email content"""
    id: Optional[int] = Field(default=None, primary_key=True)
    path: str  # File path or URL to the content
    creator_id: int = Field(foreign_key="user.id")

    # Relationships
    creator: "User" = Relationship(back_populates="created_content")
    landing_page_templates: List["LandingPageTemplate"] = Relationship(back_populates="content")
    email_templates: List["EmailTemplate"] = Relationship(back_populates="content")


class ContentCreate(SQLModel):
    """Schema for creating content"""
    path: str
    creator_id: int


class ContentUpdate(SQLModel):
    """Schema for updating content"""
    path: Optional[str] = None
