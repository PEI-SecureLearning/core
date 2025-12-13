from typing import TYPE_CHECKING, Optional
from sqlmodel import Relationship, SQLModel, Field

if TYPE_CHECKING:
    from models.campaign import Campaign


class LandingPageTemplate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    content_link: str

    campaigns: list["Campaign"] = Relationship(back_populates="landing_page_template")
