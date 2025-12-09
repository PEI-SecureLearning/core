from typing import TYPE_CHECKING, Optional
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from models.campaign import Campaign


class EmailTemplate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    subject: str
    content_link: str

    # Relationships
    campaigns: list["Campaign"] = Relationship(back_populates="email_template")
