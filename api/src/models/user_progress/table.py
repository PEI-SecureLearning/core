from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy import String
from enum import StrEnum

class AssignmentStatus(StrEnum):
    SCHEDULED = "SCHEDULED"
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    COMPLETED = "COMPLETED"


class UserProgress(SQLModel, table=True):
    __tablename__ = "user_progress"
    user_id: str = Field(primary_key=True)
    course_id: str = Field(primary_key=True)
    progress_data: dict = Field(default={}, sa_column=Column(JSONB))
    completed_sections: list[str] = Field(default=[], sa_column=Column(ARRAY(String)))
    total_completed_tasks: int = Field(default=0)
    is_certified: bool = Field(default=False)
    start_date: datetime | None = Field(default=None)
    deadline: datetime | None = Field(default=None)
    expired: bool = Field(default=False)
    status: AssignmentStatus = Field(default=AssignmentStatus.SCHEDULED)
    realm_name: Optional[str] = Field(default=None, index=True)
    notified_at: Optional[datetime] = Field(default=None)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
