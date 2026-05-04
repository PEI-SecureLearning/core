from src.services.risk.k_handler import KHandler
from src.services.risk.e_handler import EHandler
from src.services.risk.s_handler import SHandler
from src.services.risk.total_handler import TotalHandler


class RiskEvaluationService(KHandler, EHandler, SHandler, TotalHandler):
  """Unified risk service composing all factor handlers."""


_instance: RiskEvaluationService | None = None


def get_risk_service() -> RiskEvaluationService:
  global _instance
  if _instance is None:
    _instance = RiskEvaluationService()
  return _instance


risk_service = get_risk_service()
