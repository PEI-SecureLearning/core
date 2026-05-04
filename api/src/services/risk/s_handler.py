import logging
from datetime import datetime

from sqlmodel import Session

from src.core import risk_config
from src.services.risk.base_handler import BaseHandler

logger = logging.getLogger(__name__)


class SHandler(BaseHandler):
  def recalculate_s_factor(self, user_id: str, session: Session):
    """S Factor (Sentiment): Currently hardcoded to the global config."""
    try:
      risk = self._get_or_create_user_risk(user_id, session)
      risk.s_score = risk_config.HARDCODED_S_FACTOR
      risk.last_recalculated_at = datetime.utcnow()
      session.add(risk)
      session.commit()

      print(
        f"--- RISK DEBUG: Recalculated S factor for user {user_id}: {risk.s_score:.4f} ---"
      )
    except Exception as e:
      print(
        f"--- RISK ERROR: Failed to recalculate S factor for user {user_id}: {e} ---"
      )
      logger.error(f"Error recalculating S factor for user {user_id}: {e}")
