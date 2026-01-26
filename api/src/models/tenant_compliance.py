from datetime import datetime
from typing import Optional

from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel


class TenantCompliancePolicy(SQLModel, table=True):
    """Tenant-scoped compliance/ToS policy stored as Markdown."""

    __tablename__ = "tenant_compliance_policy"

    id: Optional[int] = Field(default=None, primary_key=True)
    tenant: str = Field(index=True, unique=True)
    content_md: str = Field(nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_by: Optional[str] = Field(default=None, index=True)
    published: bool = Field(default=True, nullable=False)


class TenantComplianceQuiz(SQLModel, table=True):
    """Tenant-scoped compliance quiz question bank."""

    __tablename__ = "tenant_compliance_quiz"

    id: Optional[int] = Field(default=None, primary_key=True)
    tenant: str = Field(index=True, unique=True)
    question_count: int = Field(default=5, nullable=False)
    passing_score: int = Field(default=80, nullable=False)
    question_bank: list[dict] = Field(
        default_factory=list,
        sa_column=Column(JSON),
        description="Quiz questions with answers stored as JSON.",
    )
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_by: Optional[str] = Field(default=None, index=True)
