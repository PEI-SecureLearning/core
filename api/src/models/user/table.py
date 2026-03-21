from typing import TYPE_CHECKING
from sqlmodel import Relationship, SQLModel, Field

if TYPE_CHECKING:
    from .email_sending import EmailSending


class User(SQLModel, table=True):
    __tablename__ = "users"
    keycloak_id: str = Field(primary_key=True)
    email: str
    is_org_manager: bool = Field(default=False, nullable=False)

    email_sendings: list["EmailSending"] = Relationship(back_populates="user")
