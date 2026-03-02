from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from src.models.phishing_kit import PhishingKit


class EmailTemplate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: Optional[str] = None
    subject: Optional[str] = None
    content_link: Optional[str] = Field(
        default=None, index=True, description="Mongo template id or URL"
    )

    # Relationships
    phishing_kits: list["PhishingKit"] = Relationship(
        back_populates="email_template"
    )
