from typing import Optional, List

from sqlmodel import Field, Relationship, SQLModel

from .email_sending import EmailSendingTemplateLink


class EmailTemplate(SQLModel, table=True):
    """Email template model"""
    __tablename__ = "email_template"

    id: Optional[int] = Field(default=None, primary_key=True)
    content_id: int = Field(foreign_key="content.id")

    # Relationships
    content: "Content" = Relationship(back_populates="email_templates")
    email_sendings: List["EmailSending"] = Relationship(
        back_populates="email_templates",
        link_model=EmailSendingTemplateLink
    )


class EmailTemplateCreate(SQLModel):
    """Schema for creating an email template"""
    content_id: int


class EmailTemplateUpdate(SQLModel):
    """Schema for updating an email template"""
    content_id: Optional[int] = None
