from typing import Optional
from sqlmodel import Relationship, SQLModel, Field


class CampaignUserGroupLink(SQLModel, table=True):
    campaign_id: Optional[int] = Field(
        default=None, foreign_key="campaign.id", primary_key=True
    )
    user_group_id: Optional[int] = Field(
        default=None, foreign_key="usergroup.id", primary_key=True
    )


class UserGroup(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    keycloak_token: str

    campaigns: list["Campaign"] = Relationship(
        back_populates="user_groups", link_model=CampaignUserGroupLink
    )
