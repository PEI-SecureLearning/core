import logging
from datetime import datetime

from sqlmodel import Session, select

from src.core import risk_config
from src.models import UserProgress, ComplianceAcceptance
from src.services.risk.base_handler import BaseHandler

logger = logging.getLogger(__name__)


class KHandler(BaseHandler):
  def recalculate_k_factor(self, user_id: str, session: Session):
    """
    K Factor (Knowledge): Average of course_score + compliance score (0-1).
    course_score = 1 / (1 + errors_count) + (completed_sections / total_sections)
    """
    try:
      progresses = session.exec(
        select(UserProgress).where(UserProgress.user_id == user_id)
      ).all()

      course_scores = [
        p.course_score for p in progresses if p.course_score is not None
      ]
      avg_course_score = (
        sum(course_scores) / len(course_scores) if course_scores else 0.0
      )

      compliance = session.exec(
        select(ComplianceAcceptance)
        .where(ComplianceAcceptance.user_identifier == user_id)
        .order_by(ComplianceAcceptance.accepted_at.desc())
      ).first()

      compliance_score = (compliance.score / 100.0) if compliance else 0.0

      # K = (avg course score) + compliance_score. May exceed 1; weights (a*K) scale it.
      k_factor = avg_course_score + compliance_score

      risk = self._get_or_create_user_risk(user_id, session)
      risk.k_score = k_factor
      risk.last_recalculated_at = datetime.utcnow()
      session.add(risk)
      session.commit()

      print(
        f"--- RISK DEBUG: Recalculated K factor for user {user_id}: {k_factor:.4f} ---"
      )
    except Exception as e:
      print(
        f"--- RISK ERROR: Failed to recalculate K factor for user {user_id}: {e} ---"
      )
      logger.error(f"Error recalculating K factor for user {user_id}: {e}")
