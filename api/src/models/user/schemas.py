from typing import Optional
from sqlmodel import SQLModel


class UserDTO(SQLModel):
    id: str
    username: Optional[str] = None
    email: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email_verified: Optional[bool] = None
    enabled: Optional[bool] = None
    is_org_manager: bool = False


class UserCreatedInRealmDTO(SQLModel):
    realm: str
    username: str
    status: str
    temporary_password: str


class UserListInRealmDTO(SQLModel):
    realm: str
    total: int
    users: list[UserDTO]
    org_managers: list[UserDTO]
