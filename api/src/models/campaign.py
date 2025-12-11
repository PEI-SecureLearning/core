from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING, Optional
from sqlmodel import Relationship, SQLModel, Field

from src.models.user_group import CampaignUserGroupLink
from src.models.email_sending import UserSendingInfo

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
    total_recipients: int = Field(default=0)
    total_sent: int = Field(default=0)
    total_opened: int = Field(default=0)
    total_clicked: int = Field(default=0)
    total_phished: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.now)

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

    realm: Optional["Realm"] = Relationship(back_populates="campaigns")


class TemplateSelection(SQLModel):
    """Template coming from the Mongo templates service to persist in Postgres."""

    id: str
    name: Optional[str] = None
    subject: Optional[str] = None
    path: Optional[str] = None


class CampaignCreate(SQLModel):
    name: str
    description: Optional[str] = None
    begin_date: datetime
    end_date: datetime
    sending_interval_seconds: int = MIN_INTERVAL
    sending_profile_id: Optional[int] = None
    creator_id: Optional[str] = None
    email_template_id: Optional[int] = None
    landing_page_template_id: Optional[int] = None
    email_template: Optional[TemplateSelection] = None
    landing_page_template: Optional[TemplateSelection] = None
    user_group_ids: list[str]


class CampaignDisplayInfo(SQLModel):
    id: int
    name: str
    begin_date: datetime
    end_date: datetime
    status: CampaignStatus
    total_sent: int = 0
    total_opened: int = 0
    total_clicked: int = 0


class CampaignDetailInfo(SQLModel):
    """Detailed campaign information for single campaign view."""

    # Core attributes
    id: int
    name: str
    description: Optional[str] = None
    begin_date: datetime
    end_date: datetime
    sending_interval_seconds: int
    status: CampaignStatus
    realm_name: Optional[str] = None

    # Related entity names
    email_template_id: Optional[int] = None
    landing_page_template_id: Optional[int] = None
    creator_id: Optional[str] = None
    creator_email: Optional[str] = None
    sending_profile_name: Optional[str] = None
    email_template_name: Optional[str] = None
    landing_page_template_name: Optional[str] = None

    # Statistics
    total_recipients: int = 0
    total_sent: int = 0
    total_opened: int = 0
    total_clicked: int = 0
    total_phished: int = 0
    total_failed: int = 0

    # Rates
    delivery_rate: float = 0.0
    open_rate: float = 0.0
    click_rate: float = 0.0
    phish_rate: float = 0.0

    # Progress
    progress_percentage: float = 0.0  # % of emails sent vs total
    time_elapsed_percentage: float = 0.0  # % of campaign duration elapsed

    # Time metrics
    avg_time_to_open_seconds: Optional[float] = None
    avg_time_to_click_seconds: Optional[float] = None
    first_open_at: Optional[datetime] = None
    last_open_at: Optional[datetime] = None
    first_click_at: Optional[datetime] = None
    last_click_at: Optional[datetime] = None

    # User breakdown
    user_sendings: list[UserSendingInfo] = []


class CampaignGlobalStats(SQLModel):
    """Global statistics across all campaigns for a realm."""

    # Campaign counts
    total_campaigns: int = 0
    scheduled_campaigns: int = 0
    running_campaigns: int = 0
    completed_campaigns: int = 0
    canceled_campaigns: int = 0

    # Email statistics
    total_emails_scheduled: int = 0
    total_emails_sent: int = 0
    total_emails_opened: int = 0
    total_emails_clicked: int = 0
    total_emails_phished: int = 0
    total_emails_failed: int = 0

    # Rates (percentages)
    delivery_rate: float = 0.0  # sent / scheduled
    open_rate: float = 0.0  # opened / sent
    click_rate: float = 0.0  # clicked / sent
    phish_rate: float = 0.0  # phished / sent

    # User vulnerability
    unique_users_targeted: int = 0
    users_who_opened: int = 0
    users_who_clicked: int = 0
    users_who_phished: int = 0
    repeat_offenders: list[str] = (
        []
    )  # Users who fell for > 50% of campaigns they were in

    # Time-based
    avg_time_to_open_seconds: Optional[float] = None
    avg_time_to_click_seconds: Optional[float] = None
