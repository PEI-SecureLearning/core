from datetime import datetime
from typing import Optional

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


