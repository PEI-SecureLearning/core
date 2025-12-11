from typing import Optional
from sqlmodel import Relationship, SQLModel, Field


class CampaignUserGroupLink(SQLModel, table=True):
    campaign_id: Optional[int] = Field(
        default=None, foreign_key="campaign.id", primary_key=True
    )
    user_group_id: str = Field(
        foreign_key="usergroup.keycloak_id", primary_key=True
    )


class UserGroup(SQLModel, table=True):
    keycloak_id: str = Field(primary_key=True)

    campaigns: list["Campaign"] = Relationship(
        back_populates="user_groups", link_model=CampaignUserGroupLink
    )
