from typing import Optional, List

from sqlmodel import Field, Relationship, SQLModel

from .tenant import TenantFeatureLink


class Feature(SQLModel, table=True):
    """Feature model for system features/capabilities"""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    tutorial: Optional[str] = None  # Tutorial content or link

    # Relationships
    tenants: List["Tenant"] = Relationship(back_populates="features", link_model=TenantFeatureLink)


class FeatureCreate(SQLModel):
    """Schema for creating a feature"""
    name: str
    tutorial: Optional[str] = None


class FeatureUpdate(SQLModel):
    """Schema for updating a feature"""
    name: Optional[str] = None
    tutorial: Optional[str] = None
