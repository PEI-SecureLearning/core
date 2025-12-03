from typing import Optional
from sqlmodel import Field, SQLModel, Relationship

from src.models.campaign import Campaign


class EmailTemplate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    subject: str
    content_link: str

    # Relationships
    campaigns: list["Campaign"] = Relationship(back_populates="email_template")
