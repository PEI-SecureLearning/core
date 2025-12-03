from typing import Optional
from sqlmodel import Relationship, SQLModel, Field

from src.models.email_sending import EmailSending


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    keycloak_id: str

    email_sendings: list["EmailSending"] = Relationship(back_populates="user")
