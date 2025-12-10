from typing import Optional
from sqlmodel import Relationship, Field, SQLModel


class Realm(SQLModel, table=True):
    name: Optional[str] = Field(default=None, primary_key=True, unique=True)
    domain: str

    # Relationships

    campaigns: list["Campaign"] = Relationship(back_populates="realm")
    sending_profiles: list["SendingProfile"] = Relationship(back_populates="realm")


class RealmCreate(SQLModel):
    name: str
    domain: str
    adminEmail: str
    features: dict | None = None
