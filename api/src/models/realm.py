from typing import Optional
from sqlmodel import SQLModel
from sqlmodel import Field


class Realm(SQLModel, table=True):
    name: Optional[str] = Field(default=None, primary_key=True, unique=True)
    domain: str


class RealmCreate(SQLModel):
    name: str
    domain: str
    adminEmail: str
    features: dict | None = None
