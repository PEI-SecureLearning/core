from typing import Optional
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime

from src.models.campaign import Campaign
from src.models.user import User


class EmailSending(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    scheduled_date: datetime
    status: str

    campaign_id: Optional[int] = Field(default=None, foreign_key="campaign.id")

    campaign: Optional["Campaign"] = Relationship(back_populates="email_sendings")
    user: Optional["User"] = Relationship(
        back_populates="email_sendings"
    )  # Assuming a User model exists
