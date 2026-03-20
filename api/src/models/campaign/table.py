from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING, Optional
from sqlmodel import Relationship, SQLModel, Field

from ..user_group import CampaignUserGroupLink
from ..phishing_kit import CampaignPhishingKitLink
from ..sending_profile import CampaignSendingProfileLink

if TYPE_CHECKING:
    from ..email_sending import EmailSending
    from ..phishing_kit import PhishingKit
    from ..sending_profile import SendingProfile
    from ..user_group import UserGroup
    from ..realm import Realm

MIN_INTERVAL_SECONDS = 6

class CampaignStatus(StrEnum):
    SCHEDULED = "scheduled"
    RUNNING = "running"
    COMPLETED = "completed"
    CANCELED = "canceled"


class Campaign(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = Field(default=None)
    begin_date: datetime
    end_date: datetime
    sending_interval_seconds: int = Field(default=MIN_INTERVAL_SECONDS)
    status: CampaignStatus = Field(default=CampaignStatus.SCHEDULED)
    total_recipients: int = Field(default=0)
    total_sent: int = Field(default=0)
    total_opened: int = Field(default=0)
    total_clicked: int = Field(default=0)
    total_phished: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    # FKs
    realm_name: Optional[str] = Field(
        default=None, foreign_key="realm.name", index=True
    )

    # Relationships

    user_groups: list["UserGroup"] = Relationship(
        back_populates="campaigns", link_model=CampaignUserGroupLink
    )

    sending_profiles: list["SendingProfile"] = Relationship(
        back_populates="campaigns", link_model=CampaignSendingProfileLink
    )

    phishing_kits: list["PhishingKit"] = Relationship(
        back_populates="campaigns", link_model=CampaignPhishingKitLink
    )

    email_sendings: list["EmailSending"] = Relationship(back_populates="campaign")

    realm: Optional["Realm"] = Relationship(back_populates="campaigns")
