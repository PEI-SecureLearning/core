from typing import TYPE_CHECKING, Optional
from sqlmodel import Relationship, SQLModel, Field

if TYPE_CHECKING:
    from models.campaign import Campaign
    from models.email_sending import EmailSending


class User(SQLModel, table=True):
    keycloak_id: str = Field(primary_key=True)
    email: str
    dept: str
    last_keycloak_sync: Optional[str] = None

    email_sendings: list["EmailSending"] = Relationship(back_populates="user")

    created_campaigns: list["Campaign"] = Relationship(back_populates="creator")
