from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from src.models.user.table import User


class UserRisk(SQLModel, table=True):
    __tablename__ = "user_risks"

    user_id: str = Field(primary_key=True, foreign_key="users.keycloak_id")
    
    k_score: float = Field(default=0.0, description="Knowledge factor")
    s_score: float = Field(default=0.5, description="Sentiment factor")
    e_score: float = Field(default=0.5, description="Engagement factor")
    risk_score: float = Field(default=1.0, description="Final calculated risk (R)")
    
    last_recalculated_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional["User"] = Relationship(back_populates="risk")
