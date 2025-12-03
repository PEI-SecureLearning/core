from typing import Optional
from sqlmodel import Field, Relationship, SQLModel

from src.models.sending_profile import SendingProfile


class CustomHeader(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    value: str

    # FK to SendingProfile
    profile_id: int = Field(foreign_key="sendingprofile.id")

    # Relationship back to SendingProfile
    profile: Optional[SendingProfile] = Relationship(back_populates="custom_headers")
