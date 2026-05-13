import logging
import math
from datetime import UTC, datetime

from sqlmodel import Session, select

from src.core import risk_config
from src.models import UserProgress
from src.services.realm_risk_configuration import get_effective_realm_risk_configuration
from src.services.risk.base_handler import BaseHandler

logger = logging.getLogger(__name__)


class TotalHandler(BaseHandler):
    def recalculate_total_risk(self, user_id: str, session: Session):
        """
        Total Risk: R = 1 - C
        C = 1 / (1 + exp(-(aK + bS + cE + d(K*E) + e(S*E) - t)))
        """
        try:
            risk = self._get_or_create_user_risk(user_id, session)
            latest_progress = session.exec(
                select(UserProgress)
                .where(UserProgress.user_id == user_id)
                .order_by(UserProgress.updated_at.desc())
            ).first()

            realm_configuration = get_effective_realm_risk_configuration(
                session, latest_progress.realm_name if latest_progress else None
            )

            k = risk.k_score
            s = risk.s_score
            e = risk.e_score

            a = realm_configuration.weight_a
            b = realm_configuration.weight_b
            c = realm_configuration.weight_c
            d = realm_configuration.weight_d
            int_e = realm_configuration.weight_e
            t = realm_configuration.weight_t

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
            risk.last_recalculated_at = datetime.now(UTC).replace(tzinfo=None)
            session.add(risk)
            session.commit()

            return r_val
        except Exception as exc:
            print(
                f"--- RISK ERROR: Failed to recalculate total risk for user {user_id}: {exc} ---"
            )
            logger.error(f"Error recalculating total risk for user {user_id}: {exc}")
            return 1.0
