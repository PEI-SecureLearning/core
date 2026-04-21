import logging
import math
from datetime import datetime

from sqlmodel import Session

from src.core import risk_config
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
      print(
        f"--- RISK ERROR: Failed to recalculate total risk for user {user_id}: {exc} ---"
      )
      logger.error(f"Error recalculating total risk for user {user_id}: {exc}")
      return 1.0
