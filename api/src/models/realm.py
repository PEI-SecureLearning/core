from typing import Optional
from sqlmodel import Relationship, Field, SQLModel


class Realm(SQLModel, table=True):
    name: Optional[str] = Field(default=None, primary_key=True, unique=True)
    domain: str = Field(index=True)

    # Relationships

    campaigns: list["Campaign"] = Relationship(back_populates="realm")
    sending_profiles: list["SendingProfile"] = Relationship(back_populates="realm")
    phishing_kits: list["PhishingKit"] = Relationship(back_populates="realm")


class RealmCreate(SQLModel):
    name: str
    domain: str
    adminEmail: str
    features: dict | None = None


class RealmResponse(SQLModel):
    realm: str


class RealmInfo(SQLModel):
    realm: str
    displayName: str
    enabled: bool = True
    domain: str | None = None
    features: dict[str, bool] = Field(default_factory=dict)
    logoUpdatedAt: str | None = None
    user_count: int = 0
    users: list[dict] = Field(default_factory=list)


class RealmInfoResponse(SQLModel):
    realm: RealmInfo


class UserCreateRequest(SQLModel):
    realm: str
    username: str
    name: str
    email: str
    dept: str
    role: str
    group_id: str | None = None


class GroupCreateRequest(SQLModel):
    name: str
