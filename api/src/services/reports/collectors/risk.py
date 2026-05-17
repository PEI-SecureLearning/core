"""Risk collector — returns placeholder RiskMetrics (K/S/E pending integration)."""

from __future__ import annotations

from src.services.reports.context import RiskMetrics


def collect_risk_metrics(realm_name: str) -> RiskMetrics:  # noqa: ARG001
  """Return a RiskMetrics object for the given realm.

  Currently returns zeroed placeholder values.  When K / S / E data sources
  are available, this function will query them and populate the real scores.
  The overall_score is computed automatically in RiskMetrics.__post_init__.
  """
  return RiskMetrics(
    knowledge_score=0.0,
    sentiment_score=0.0,
    involvement_score=0.0,
    risk_level="N/A",
    notes="Risk calculation pending K/S/E data integration.",
  )
