from sqlmodel import SQLModel, Field
from src.models.user.schemas import UserDTO


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
    users: list[UserDTO] = Field(default_factory=list)


class RealmInfoResponse(SQLModel):
    realm: RealmInfo


class RealmUserCreate(SQLModel):
    realm: str
    username: str
    name: str
    email: str
    dept: str
    role: str
    group_id: str | None = None


class RealmGroupCreate(SQLModel):
    name: str
