from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from ..phishing_kit import PhishingKit


class EmailTemplate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    content_link: Optional[str] = Field(
        default=None, index=True, description="Mongo template id or URL"
    )

    # Relationships
    phishing_kits: list["PhishingKit"] = Relationship(
        back_populates="email_template"
    )
