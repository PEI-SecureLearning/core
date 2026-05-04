from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel

from .table import CampaignStatus, MIN_INTERVAL_SECONDS


class CampaignCreate(SQLModel):
    name: str
    description: Optional[str] = None
    begin_date: datetime
    end_date: datetime
    sending_interval_seconds: int = MIN_INTERVAL_SECONDS
    sending_profile_ids: list[int] = []
    creator_id: Optional[str] = None
    phishing_kit_ids: list[int] = []
    user_group_ids: list[str]


class CampaignUpdate(SQLModel):
    name: str
    description: Optional[str] = None
    begin_date: datetime
    end_date: datetime
    sending_interval_seconds: int = MIN_INTERVAL_SECONDS
    sending_profile_ids: list[int] = []
    phishing_kit_ids: list[int] = []
    user_group_ids: list[str] = []


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

    # Related entities
    user_group_ids: list[str] = []
    phishing_kit_ids: list[int] = []
    sending_profile_ids: list[int] = []
    phishing_kit_names: list[str] = []
    creator_id: Optional[str] = None
    creator_email: Optional[str] = None
    sending_profile_names: list[str] = []

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


class UserCampaignStatDetail(SQLModel):
    """Detailed campaign interaction status for a specific user."""
    campaign_id: int
    campaign_name: str
    interaction_status: str  # e.g., 'ignored', 'opened', 'clicked', 'phished', 'reported'
    sent_at: Optional[datetime] = None


class UserCampaignStatsResponse(SQLModel):
    """Comprehensive breakdown of a user's campaign statistics."""
    total_campaigns: int = 0
    campaigns: list[UserCampaignStatDetail] = []
    risk_score: float = 1.0
    k_score: float = 0.0
    s_score: float = 0.5
    e_score: float = 0.5
