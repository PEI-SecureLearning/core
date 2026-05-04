import logging
from datetime import datetime

from sqlmodel import Session, select

from src.models import EmailSending, EmailSendingStatus
from src.services.risk.base_handler import BaseHandler

logger = logging.getLogger(__name__)


class EHandler(BaseHandler):
  def recalculate_e_factor(self, user_id: str, session: Session):
    """
    E Factor (Engagement): Based on phishing reporting.
    - Reported = 1
    - Opened/No action = 0.5
    - Clicked = 0.25
    - Phished = 0
    Average across campaigns.
    """
    try:
      sendings = session.exec(
        select(EmailSending).where(EmailSending.user_id == user_id)
      ).all()

      campaign_scores = []
      for s in sendings:
        if not s.campaign_id or not s.sent_at:
          continue

        if s.phished_at or s.status == EmailSendingStatus.PHISHED:
          score = 0.0
        elif s.clicked_at or s.status == EmailSendingStatus.CLICKED:
          score = 0.25
        elif s.reported_at or s.status == EmailSendingStatus.REPORTED:
          score = 1.0
        else:
          score = 0.5  # Sent but no action or opened

        campaign_scores.append(score)

      e_factor = (
        sum(campaign_scores) / len(campaign_scores) if campaign_scores else 1.0
      )

      print(
        f"--- RISK DEBUG: Individual scores for user {user_id}: {campaign_scores} ---"
      )

      risk = self._get_or_create_user_risk(user_id, session)
      risk.e_score = e_factor
      risk.last_recalculated_at = datetime.utcnow()
      session.add(risk)
      session.commit()

      print(
        f"--- RISK DEBUG: Recalculated E factor for user {user_id}: {e_factor:.4f} ---"
      )
    except Exception as e:
      print(
        f"--- RISK ERROR: Failed to recalculate E factor for user {user_id}: {e} ---"
      )
      logger.error(f"Error recalculating E factor for user {user_id}: {e}")
