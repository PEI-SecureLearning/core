from typing import Optional, List

from sqlmodel import Field, Relationship, SQLModel


class LandingPageTemplate(SQLModel, table=True):
    """Landing page template model"""
    __tablename__ = "landing_page_template"

    id: Optional[int] = Field(default=None, primary_key=True)
    content_id: int = Field(foreign_key="content.id")

    # Relationships
    content: "Content" = Relationship(back_populates="landing_page_templates")
    landing_pages: List["LandingPage"] = Relationship(back_populates="template")


class LandingPageTemplateCreate(SQLModel):
    """Schema for creating a landing page template"""
    content_id: int


class LandingPageTemplateUpdate(SQLModel):
    """Schema for updating a landing page template"""
    content_id: Optional[int] = None


class LandingPage(SQLModel, table=True):
    """Landing page model used in email sendings"""
    __tablename__ = "landing_page"

    id: Optional[int] = Field(default=None, primary_key=True)
    url: str
    args: Optional[str] = None  # JSON string or query parameters
    template_id: int = Field(foreign_key="landing_page_template.id")
    email_sending_id: int = Field(foreign_key="email_sending.id")

    # Relationships
    template: "LandingPageTemplate" = Relationship(back_populates="landing_pages")
    email_sending: "EmailSending" = Relationship(back_populates="landing_pages")


class LandingPageCreate(SQLModel):
    """Schema for creating a landing page"""
    url: str
    args: Optional[str] = None
    template_id: int
    email_sending_id: int


class LandingPageUpdate(SQLModel):
    """Schema for updating a landing page"""
    url: Optional[str] = None
    args: Optional[str] = None
    template_id: Optional[int] = None
    email_sending_id: Optional[int] = None
