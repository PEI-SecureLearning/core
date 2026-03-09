from datetime import datetime
from typing import Optional

from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel


class ComplianceAcceptance(SQLModel, table=True):
    """Records a user's acceptance of a compliance version."""

    __tablename__ = "compliance_acceptance"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_identifier: str = Field(index=True, description="Identifier from token (preferred_username/email/sub)")
    tenant: Optional[str] = Field(
        default=None,
        index=True,
        description="Tenant/realm/domain identifier extracted from token",
    )
    version: str = Field(index=True, description="Hash/id of the compliance document")
    score: int = Field(default=0, description="Last passing score percentage")
    accepted_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


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
