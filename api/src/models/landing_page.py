from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from src.models.phishing_kit import PhishingKit


class LandingPageTemplate(SQLModel, table=True):
    """Landing page template model"""
    __tablename__ = "landing_page_template"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: Optional[str] = None
    content_link: Optional[str] = Field(
        default=None, index=True, description="Mongo template id or URL"
    )

    # Relationships
    phishing_kits: list["PhishingKit"] = Relationship(
        back_populates="landing_page_template"
    )
