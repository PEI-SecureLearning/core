from sqlmodel import Session

from src.models.user_risk.table import UserRisk


class BaseHandler:
  def _get_or_create_user_risk(self, user_id: str, session: Session) -> UserRisk:
    risk = session.get(UserRisk, user_id)
    if not risk:
      risk = UserRisk(user_id=user_id)
      session.add(risk)
      session.commit()
      session.refresh(risk)
    return risk
