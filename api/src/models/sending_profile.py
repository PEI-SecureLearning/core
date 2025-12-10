from typing import TYPE_CHECKING, Optional
from sqlmodel import Relationship, SQLModel, Field

if TYPE_CHECKING:
    from models.campaign import Campaign
    from models.custom_header import CustomHeader


class SendingProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    smtp_host: str
    smtp_port: int
    username: str
    password: str
    from_fname: str
    from_lname: str
    from_email: str

    # FK

    realm_name: Optional[str] = Field(
        default=None, foreign_key="realm.name", index=True
    )

    # Relationships

    campaigns: list["Campaign"] = Relationship(back_populates="sending_profile")
    custom_headers: list["CustomHeader"] = Relationship(back_populates="profile")
    realm: Optional["Realm"] = Relationship(back_populates="sending_profiles")
