from typing import Optional
from sqlmodel import Relationship, SQLModel, Field

from src.models.campaign import Campaign


class LandingPageTemplate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)  # type: ignore
    name: str
    content_link: str

    campaigns: list[Campaign] = Relationship(back_populates="landing_page_template")
