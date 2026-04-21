"""Tests for the risk collector."""

from __future__ import annotations

from src.services.reports.collectors.risk import collect_risk_metrics
from src.services.reports.context import RiskMetrics


class TestRiskCollector:
  def test_returns_risk_metrics(self):
    result = collect_risk_metrics("acme")
    assert isinstance(result, RiskMetrics)

  def test_scores_are_placeholder_zeros(self):
    result = collect_risk_metrics("acme")
    assert result.knowledge_score == 0.0
    assert result.sentiment_score == 0.0
    assert result.involvement_score == 0.0

  def test_overall_score_computed_from_components(self):
    result = collect_risk_metrics("acme")
    # With all zeros, overall should be 0.0
    assert result.overall_score == 0.0

  def test_risk_level_is_na(self):
    result = collect_risk_metrics("acme")
    assert result.risk_level == "N/A"

  def test_notes_indicate_pending(self):
    result = collect_risk_metrics("acme")
    assert "pending" in result.notes.lower()

  def test_different_realms_return_same_shape(self):
    r1 = collect_risk_metrics("realm-a")
    r2 = collect_risk_metrics("realm-b")
    assert r1.knowledge_score == r2.knowledge_score
