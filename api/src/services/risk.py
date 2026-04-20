import math
from datetime import datetime
from sqlmodel import Session, select
import logging

from src.core import risk_config
from src.models import User, UserProgress, ComplianceAcceptance, EmailSending, EmailSendingStatus
from src.models.user_risk.table import UserRisk

logger = logging.getLogger(__name__)


class RiskEvaluationService:
    """Service to handle the recalculation of the user risk metrics based on the mathematical model."""

    def _get_or_create_user_risk(self, user_id: str, session: Session) -> UserRisk:
        risk = session.get(UserRisk, user_id)
        if not risk:
            risk = UserRisk(user_id=user_id)
            session.add(risk)
            session.commit()
            session.refresh(risk)
        return risk

    def recalculate_k_factor(self, user_id: str, session: Session):
        """
        K Factor (Knowledge): Average of course_score + compliance score (0-1).
        course_score = 1 / (1 + errors_count) + (completed_sections / total_sections)
        """
        try:
            progresses = session.exec(
                select(UserProgress).where(UserProgress.user_id == user_id)
            ).all()

            course_scores = [p.course_score for p in progresses if p.course_score is not None]
            avg_course_score = sum(course_scores) / len(course_scores) if course_scores else 0.0

            # Get compliance score
            compliance = session.exec(
                select(ComplianceAcceptance)
                .where(ComplianceAcceptance.user_identifier == user_id)
                .order_by(ComplianceAcceptance.accepted_at.desc())
            ).first()
            
            compliance_score = (compliance.score / 100.0) if compliance else 0.0
            
            # Since K should be bound roughly to (0,1) or normalized depending on exact weights,
            # we just sum or average them. RISK.md says: K = (avg course score) + compliance_score.
            # This might exceed 1, but the mathematical model uses weights (a*K) to scale it.
            k_factor = avg_course_score + compliance_score

            risk = self._get_or_create_user_risk(user_id, session)
            risk.k_score = k_factor
            risk.last_recalculated_at = datetime.utcnow()
            session.add(risk)
            session.commit()
            
            print(f"--- RISK DEBUG: Recalculated K factor for user {user_id}: {k_factor:.4f} ---")
        except Exception as e:
            print(f"--- RISK ERROR: Failed to recalculate K factor for user {user_id}: {e} ---")
            logger.error(f"Error recalculating K factor for user {user_id}: {e}")

    def recalculate_e_factor(self, user_id: str, session: Session):
        """
        E Factor (Engagement): Based on phishing reporting.
        - Reported = 1
        - Opened/No action = 0.5
        - Clicked = 0.25
        - Phished = 0
        Lowest value per campaign wins. Average across campaigns.
        """
        try:
            sendings = session.exec(
                select(EmailSending).where(EmailSending.user_id == user_id)
            ).all()

            campaign_scores = []
            for s in sendings:
                if not s.campaign_id or not s.sent_at:
                    continue
                
                # Evaluate from worst to best; the final assignment is the actual state
                if s.phished_at or s.status == EmailSendingStatus.PHISHED:
                    score = 0.0
                elif s.clicked_at or s.status == EmailSendingStatus.CLICKED:
                    score = 0.25
                elif s.opened_at or s.status == EmailSendingStatus.OPENED:
                    # Check if they reported it after opening
                    if s.reported_at or s.status == EmailSendingStatus.REPORTED:
                        score = 1.0
                    else:
                        score = 0.5
                else:
                    score = 0.5 # Sent but no action
                
                campaign_scores.append(score)

            e_factor = sum(campaign_scores) / len(campaign_scores) if campaign_scores else 1.0
            
            print(f"--- RISK DEBUG: Individual scores for user {user_id}: {campaign_scores} ---")

            risk = self._get_or_create_user_risk(user_id, session)
            risk.e_score = e_factor
            risk.last_recalculated_at = datetime.utcnow()
            session.add(risk)
            session.commit()
            
            print(f"--- RISK DEBUG: Recalculated E factor for user {user_id}: {e_factor:.4f} ---")
        except Exception as e:
            print(f"--- RISK ERROR: Failed to recalculate E factor for user {user_id}: {e} ---")
            logger.error(f"Error recalculating E factor for user {user_id}: {e}")

    def recalculate_s_factor(self, user_id: str, session: Session):
        """
        S Factor (Sentiment): Currently hardcoded to the global config.
        """
        try:
            risk = self._get_or_create_user_risk(user_id, session)
            risk.s_score = risk_config.HARDCODED_S_FACTOR
            risk.last_recalculated_at = datetime.utcnow()
            session.add(risk)
            session.commit()
            
            print(f"--- RISK DEBUG: Recalculated S factor for user {user_id}: {risk.s_score:.4f} ---")
        except Exception as e:
            print(f"--- RISK ERROR: Failed to recalculate S factor for user {user_id}: {e} ---")
            logger.error(f"Error recalculating S factor for user {user_id}: {e}")

    def recalculate_total_risk(self, user_id: str, session: Session):
        """
        Total Risk: R = 1 - C
        C = 1 / (1 + exp(-(aK + bS + cE + d(K*E) + e(S*E) - t)))
        """
        try:
            risk = self._get_or_create_user_risk(user_id, session)
            
            k = risk.k_score
            s = risk.s_score
            e = risk.e_score
            
            a = risk_config.RISK_WEIGHT_A
            b = risk_config.RISK_WEIGHT_B
            c = risk_config.RISK_WEIGHT_C
            d = risk_config.RISK_WEIGHT_D
            int_e = risk_config.RISK_WEIGHT_E
            t = risk_config.RISK_WEIGHT_T
            
            old_risk = risk.risk_score
            z = (a * k) + (b * s) + (c * e) + (d * (k * e)) + (int_e * (s * e)) - t
            c_val = 1 / (1 + math.exp(-z))
            r_val = 1 - c_val
            
            print(
                f"--- RISK DEBUG: Recalculating Total Risk for user {user_id} ---\n"
                f"  Old Risk Score: {old_risk:.4f}\n"
                f"  Factors: K={k:.4f}, S={s:.4f}, E={e:.4f}\n"
                f"  Weights: a={a}, b={b}, c={c}, d={d}, e={int_e}, t={t}\n"
                f"  Intermediate: z={z:.4f}, C={c_val:.4f}\n"
                f"  New Risk Score: {r_val:.4f}"
            )
            
            risk.risk_score = r_val
            risk.last_recalculated_at = datetime.utcnow()
            session.add(risk)
            session.commit()
            
            return r_val
        except Exception as exc:
            print(f"--- RISK ERROR: Failed to recalculate total risk for user {user_id}: {exc} ---")
            logger.error(f"Error recalculating total risk for user {user_id}: {exc}")
            return 1.0


risk_service = RiskEvaluationService()
