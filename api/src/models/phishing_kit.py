from typing import TYPE_CHECKING, Optional

from sqlalchemy import Column, JSON
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from src.models.email_sending import EmailSending
    from src.models.email_template import EmailTemplate
    from src.models.landing_page import LandingPageTemplate
    from src.models.sending_profile import SendingProfile


class CampaignPhishingKitLink(SQLModel, table=True):
    """Many-to-many link between Campaign and PhishingKit."""
    campaign_id: Optional[int] = Field(
        default=None, foreign_key="campaign.id", primary_key=True
    )
    phishing_kit_id: Optional[int] = Field(
        default=None, foreign_key="phishingkit.id", primary_key=True
    )


class PhishingKit(SQLModel, table=True):
    """Groups an email template + landing page template (+ optional sending profile)
    into a reusable phishing scenario."""

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = Field(default=None)
    args: dict[str, str] = Field(
        default_factory=dict, sa_column=Column(JSON, default={})
    )

    # FKs
    email_template_id: Optional[int] = Field(
        default=None, foreign_key="emailtemplate.id"
    )
    landing_page_template_id: Optional[int] = Field(
        default=None, foreign_key="landing_page_template.id"
    )
    sending_profile_id: Optional[int] = Field(
        default=None, foreign_key="sendingprofile.id"
    )
    realm_name: Optional[str] = Field(
        default=None, foreign_key="realm.name", index=True
    )

    # Relationships
    email_template: Optional["EmailTemplate"] = Relationship(
        back_populates="phishing_kits"
    )
    landing_page_template: Optional["LandingPageTemplate"] = Relationship(
        back_populates="phishing_kits"
    )
    sending_profile: Optional["SendingProfile"] = Relationship(
        back_populates="phishing_kits"
    )
    campaigns: list["Campaign"] = Relationship(
        back_populates="phishing_kits", link_model=CampaignPhishingKitLink
    )
    email_sendings: list["EmailSending"] = Relationship(back_populates="phishing_kit")
    realm: Optional["Realm"] = Relationship(back_populates="phishing_kits")


class PhishingKitCreate(SQLModel):
    """Schema for creating a phishing kit."""

    name: str
    description: Optional[str] = None
    args: dict[str, str] = {}
    email_template_id: Optional[int] = None
    landing_page_template_id: Optional[int] = None
    sending_profile_id: Optional[int] = None


class PhishingKitDisplayInfo(SQLModel):
    """Schema for displaying phishing kit info."""

    id: int
    name: str
    description: Optional[str] = None
    args: dict[str, str] = {}
    email_template_name: Optional[str] = None
    landing_page_template_name: Optional[str] = None
    sending_profile_name: Optional[str] = None
