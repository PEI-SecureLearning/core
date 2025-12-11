from typing import Optional

from sqlmodel import Field, SQLModel


class EmailTemplate(SQLModel, table=True):
    """Email template model"""
    __tablename__ = "email_template"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: Optional[str] = None
    subject: Optional[str] = None
    content_link: Optional[str] = Field(default=None, index=True, description="Mongo template id or URL")


class EmailTemplateCreate(SQLModel):
    """Schema for creating an email template"""
    name: Optional[str] = None
    subject: Optional[str] = None
    content_link: Optional[str] = None


class EmailTemplateUpdate(SQLModel):
    """Schema for updating an email template"""
    name: Optional[str] = None
    subject: Optional[str] = None
    content_link: Optional[str] = None
