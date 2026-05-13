from typing import Optional, TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from src.models.realm.table import Realm


class RealmRiskConfiguration(SQLModel, table=True):
    __tablename__ = "realm_risk_configuration"

    realm_name: str = Field(foreign_key="realm.name", primary_key=True)
    weight_a: float = Field(default=1.0, description="Knowledge multiplier")
    weight_b: float = Field(default=1.0, description="Sentiment multiplier")
    weight_c: float = Field(default=1.0, description="Engagement multiplier")
    weight_d: float = Field(default=1.0, description="K * E interaction multiplier")
    weight_e: float = Field(default=1.0, description="S * E interaction multiplier")
    weight_t: float = Field(default=1.0, description="Threshold constant")

    realm: Optional["Realm"] = Relationship(back_populates="risk_configuration")
