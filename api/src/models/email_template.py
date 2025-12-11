from typing import TYPE_CHECKING, Optional
from sqlmodel import Field, SQLModel, Relationship

from sqlmodel import Field, SQLModel
if TYPE_CHECKING:
    from models.campaign import Campaign


class EmailTemplate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    subject: str
    content_link: str

    # Relationships
    campaigns: list["Campaign"] = Relationship(back_populates="email_template")
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
