from typing import Optional, TYPE_CHECKING
from sqlmodel import Relationship, Field, SQLModel

if TYPE_CHECKING:
    from ..campaign import Campaign
    from ..phishing_kit import PhishingKit
    from ..sending_profile import SendingProfile


class Realm(SQLModel, table=True):
    name: Optional[str] = Field(default=None, primary_key=True, unique=True)
    domain: str = Field(index=True)

    # Relationships

    campaigns: list["Campaign"] = Relationship(back_populates="realm")
    sending_profiles: list["SendingProfile"] = Relationship(back_populates="realm")
    phishing_kits: list["PhishingKit"] = Relationship(back_populates="realm")
