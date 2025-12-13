from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlmodel import Relationship, SQLModel, Field

if TYPE_CHECKING:
    from models.campaign import Campaign
    from models.email_sending import EmailSending


class User(SQLModel, table=True):
    __tablename__ = "useres"
    keycloak_id: str = Field(primary_key=True)
    email: str

    email_sendings: list["EmailSending"] = Relationship(back_populates="user")
