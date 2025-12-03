from datetime import datetime
from typing import Optional
from sqlmodel import Relationship, SQLModel, Field

from src.models.email_sending import EmailSending
from src.models.email_template import EmailTemplate
from src.models.landing_page_template import LandingPageTemplate
from src.models.sending_profile import SendingProfile
from src.models.user_group import UserGroup


class Campaign(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
    begin_date: datetime
    end_date: datetime
    sending_interval: int

    # FKs
    sending_profile_id: Optional[int] = Field(
        default=None, foreign_key="sendingprofile.id"
    )
    email_template_id: Optional[int] = Field(
        default=None, foreign_key="emailtemplate.id"
    )
    landing_page_template_id: Optional[int] = Field(
        default=None, foreign_key="landingpagetemplate.id"
    )

    # Relationships

    user_groups: list[UserGroup] = Relationship(
        back_populates="campaigns", link_model="CampaignUserGroupLink"
    )

    sending_profile: Optional[SendingProfile] = Relationship(back_populates="campaigns")

    email_template: Optional[EmailTemplate] = Relationship(back_populates="campaigns")

    landing_page_template: Optional[LandingPageTemplate] = Relationship(
        back_populates="campaigns"
    )

    email_sendings: list["EmailSending"] = Relationship(back_populates="campaign")
