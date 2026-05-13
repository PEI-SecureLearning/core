import logging
from datetime import UTC, datetime

from sqlmodel import Session, select

from src.core import risk_config
from src.models import SurveyResponse
from src.services.risk.base_handler import BaseHandler

logger = logging.getLogger(__name__)


class SHandler(BaseHandler):
    def recalculate_s_factor(self, user_id: str, session: Session):
        """S Factor (Sentiment): Use the most recent stored survey score when available."""
        try:
            risk = self._get_or_create_user_risk(user_id, session)

            latest_response = session.exec(
                select(SurveyResponse)
                .where(SurveyResponse.user_id == user_id)
                .order_by(SurveyResponse.submitted_at.desc())
            ).first()

            risk.s_score = (
                latest_response.normalized_score
                if latest_response is not None
                else risk_config.HARDCODED_S_FACTOR
            )
            risk.last_recalculated_at = datetime.now(UTC).replace(tzinfo=None)
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
