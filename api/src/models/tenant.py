from typing import Optional, List

from sqlmodel import Field, Relationship, SQLModel


class TenantFeatureLink(SQLModel, table=True):
    """Link table for Tenant-Feature many-to-many relationship"""
    __tablename__ = "tenant_feature_link"

    tenant_id: Optional[int] = Field(default=None, foreign_key="tenant.id", primary_key=True)
    feature_id: Optional[int] = Field(default=None, foreign_key="feature.id", primary_key=True)


class Tenant(SQLModel, table=True):
    """Tenant model for multi-tenancy support"""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    domain: str = Field(unique=True, index=True)

    # Relationships
    groups: List["Group"] = Relationship(back_populates="tenant")
    features: List["Feature"] = Relationship(back_populates="tenants", link_model=TenantFeatureLink)


class TenantCreate(SQLModel):
    """Schema for creating a tenant"""
    name: str
    domain: str


class TenantUpdate(SQLModel):
    """Schema for updating a tenant"""
    name: Optional[str] = None
    domain: Optional[str] = None
