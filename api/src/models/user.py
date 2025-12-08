from typing import TYPE_CHECKING, Optional
from sqlmodel import Relationship, SQLModel, Field

if TYPE_CHECKING:
    from src.models.campaign import Campaign
    from src.models.email_sending import EmailSending


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    keycloak_id: str

    email_sendings: list["EmailSending"] = Relationship(back_populates="user")

    created_campaigns: list["Campaign"] = Relationship(back_populates="creator")
