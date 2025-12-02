from typing import Optional

from sqlmodel import Field, Relationship, SQLModel


class Module(SQLModel, table=True):
    """Training/Learning module model"""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None

    # Relationships
    remediation_plan: Optional["RemediationPlan"] = Relationship(back_populates="module")


class ModuleCreate(SQLModel):
    """Schema for creating a module"""
    name: str
    description: Optional[str] = None


class ModuleUpdate(SQLModel):
    """Schema for updating a module"""
    name: Optional[str] = None
    description: Optional[str] = None
