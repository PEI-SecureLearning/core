from typing import TYPE_CHECKING, Optional
from sqlmodel import Relationship, SQLModel, Field

from ..phishing_kit import PhishingKitSendingProfileLink


if TYPE_CHECKING:
    from ..campaign import Campaign
    from ..phishing_kit import PhishingKit
    from ..realm import Realm


class CampaignSendingProfileLink(SQLModel, table=True):
    """Many-to-many link between Campaign and SendingProfile."""

    campaign_id: Optional[int] = Field(
        default=None, foreign_key="campaign.id", primary_key=True
    )
    sending_profile_id: Optional[int] = Field(
        default=None, foreign_key="sendingprofile.id", primary_key=True
    )


class SendingProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    smtp_host: str
    smtp_port: int
    username: str
    password: str
    from_fname: str
    from_lname: str
    from_email: str

    # FK

    realm_name: Optional[str] = Field(
        default=None, foreign_key="realm.name", index=True
    )

    # Relationships

    campaigns: list["Campaign"] = Relationship(
        back_populates="sending_profiles", link_model=CampaignSendingProfileLink
    )
    custom_headers: list["CustomHeader"] = Relationship(
        back_populates="profile",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    phishing_kits: list["PhishingKit"] = Relationship(
        back_populates="sending_profiles", link_model=PhishingKitSendingProfileLink
    )
    realm: Optional["Realm"] = Relationship(back_populates="sending_profiles")


class CustomHeader(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    value: str

    # FK to SendingProfile
    profile_id: int = Field(foreign_key="sendingprofile.id")

    # Relationship back to SendingProfile
    profile: Optional["SendingProfile"] = Relationship(back_populates="custom_headers")
