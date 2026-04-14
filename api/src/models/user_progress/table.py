from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import String, JSON
from sqlalchemy.dialects import postgresql
from enum import StrEnum


class AssignmentStatus(StrEnum):
    SCHEDULED = "SCHEDULED"
    ACTIVE = "ACTIVE"
    OVERDUE = "OVERDUE"
    COMPLETED = "COMPLETED"
    RENEWAL_REQUIRED = "RENEWAL_REQUIRED"


class UserProgress(SQLModel, table=True):
    __tablename__ = "user_progress"
    user_id: str = Field(primary_key=True)
    course_id: str = Field(primary_key=True)
    progress_data: dict = Field(
        default={},
        sa_column=Column(JSON().with_variant(postgresql.JSONB(), "postgresql")),
    )
    completed_sections: list[str] = Field(
        default=[],
        sa_column=Column(JSON().with_variant(postgresql.ARRAY(String), "postgresql")),
    )
    total_completed_tasks: int = Field(default=0)
    is_certified: bool = Field(default=False)
    start_date: datetime | None = Field(default=None)
    deadline: datetime | None = Field(default=None)
    cert_valid_days: float = Field(default=365.0)
    cert_expires_at: datetime | None = Field(default=None)
    overdue: bool = Field(default=False)
    expired: bool = Field(default=False)
    status: AssignmentStatus = Field(default=AssignmentStatus.SCHEDULED)
    realm_name: Optional[str] = Field(default=None, index=True)
    notified_at: Optional[datetime] = Field(default=None)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
