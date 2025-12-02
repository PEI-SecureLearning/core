from sqlmodel import SQLModel
from sqlmodel import Field

class Realm(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    name: str
    domain: str

class RealmCreate(SQLModel):
    name: str
    domain: str
    adminEmail: str
    userCount: int
    bundle: str | None = None
    features: dict | None = None