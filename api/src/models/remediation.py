from typing import Optional

from sqlmodel import Field, Relationship, SQLModel


class RemediationPlan(SQLModel, table=True):
    """Remediation plan model for campaigns"""
    __tablename__ = "remediation_plan"

    id: Optional[int] = Field(default=None, primary_key=True)
    message: str  # Remediation message or instructions
    campaign_id: int = Field(foreign_key="campaign.id", unique=True)
    module_id: int = Field(foreign_key="module.id", unique=True)

    # Relationships
    campaign: "Campaign" = Relationship(back_populates="remediation_plan")
    module: "Module" = Relationship(back_populates="remediation_plan")


class RemediationPlanCreate(SQLModel):
    """Schema for creating a remediation plan"""
    message: str
    campaign_id: int
    module_id: int


class RemediationPlanUpdate(SQLModel):
    """Schema for updating a remediation plan"""
    message: Optional[str] = None
    module_id: Optional[int] = None
