from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING, Optional
from sqlmodel import Relationship, SQLModel, Field

from src.models.user_group import CampaignUserGroupLink

if TYPE_CHECKING:
    from src.models.email_sending import EmailSending
    from src.models.email_template import EmailTemplate
    from src.models.landing_page_template import LandingPageTemplate
    from src.models.sending_profile import SendingProfile
    from src.models.user import User
    from src.models.user_group import UserGroup


MIN_INTERVAL = 6


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
    sending_interval_seconds: int = Field(default=MIN_INTERVAL)
    status: CampaignStatus = Field(default=CampaignStatus.SCHEDULED)

    # FKs
    sending_profile_id: Optional[int] = Field(
        default=None, foreign_key="sendingprofile.id"
    )
    email_template_id: Optional[int] = Field(
        default=None, foreign_key="emailtemplate.id"
    )
    landing_page_template_id: Optional[int] = Field(
        default=None, foreign_key="landingpagetemplate.id"
    )
    creator_id: Optional[str] = Field(default=None, foreign_key="user.keycloak_id")

    realm_name: Optional[str] = Field(
        default=None, foreign_key="realm.name", index=True
    )

    # Relationships

    user_groups: list["UserGroup"] = Relationship(
        back_populates="campaigns", link_model=CampaignUserGroupLink
    )

    sending_profile: Optional["SendingProfile"] = Relationship(
        back_populates="campaigns"
    )

    email_template: Optional["EmailTemplate"] = Relationship(back_populates="campaigns")

    landing_page_template: Optional["LandingPageTemplate"] = Relationship(
        back_populates="campaigns"
    )

    email_sendings: list["EmailSending"] = Relationship(back_populates="campaign")

    creator: Optional["User"] = Relationship(back_populates="created_campaigns")

    realm: Optional["Realm"] = Relationship(back_populates="campaigns")


class CampaignCreate(SQLModel):
    name: str
    description: Optional[str] = None
    begin_date: datetime
    end_date: datetime
    sending_interval_seconds: int = MIN_INTERVAL
    sending_profile_id: int
    email_template_id: int
    landing_page_template_id: int
    user_group_ids: list[str]
    creator_id: str


class CampaignInfo(SQLModel):
    id: int
    name: str
    begin_date: datetime
    end_date: datetime
    status: CampaignStatus
