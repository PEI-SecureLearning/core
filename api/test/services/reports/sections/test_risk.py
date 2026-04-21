"""Tests for RiskReportSection."""

from __future__ import annotations

import pytest

from src.services.reports.context import DataContext, RiskMetrics
from src.services.reports.sections.risk import RiskReportSection
from src.services.reports.spec import SectionConfig, SectionKind


def _config() -> SectionConfig:
  return SectionConfig(kind=SectionKind.RISK)


class TestRiskReportSection:
  def test_render_contains_risk_heading(self, mock_data_context):
    md = RiskReportSection().render(_config(), mock_data_context)
    assert "Security Awareness Score" in md

  def test_render_hides_scores_when_all_zero(self, mock_data_context):
    # Default fixture has all 0.0 scores — table should be hidden
    md = RiskReportSection().render(_config(), mock_data_context)
    assert "Awareness scoring is pending" in md

  def test_render_contains_knowledge_row_when_scores_populated(self, mock_data_context):
    mock_data_context.risk_metrics.knowledge_score = 60.0
    mock_data_context.risk_metrics.sentiment_score = 80.0
    mock_data_context.risk_metrics.involvement_score = 70.0
    mock_data_context.risk_metrics.overall_score = 70.0
    md = RiskReportSection().render(_config(), mock_data_context)
    assert "Knowledge Score" in md

  def test_render_contains_sentiment_row_when_scores_populated(self, mock_data_context):
    mock_data_context.risk_metrics.knowledge_score = 60.0
    mock_data_context.risk_metrics.sentiment_score = 80.0
    mock_data_context.risk_metrics.involvement_score = 70.0
    md = RiskReportSection().render(_config(), mock_data_context)
    assert "Sentiment Score" in md

  def test_render_contains_engagement_row_when_scores_populated(self, mock_data_context):
    mock_data_context.risk_metrics.knowledge_score = 60.0
    mock_data_context.risk_metrics.sentiment_score = 80.0
    mock_data_context.risk_metrics.involvement_score = 70.0
    md = RiskReportSection().render(_config(), mock_data_context)
    assert "Engagement Score" in md

  def test_render_contains_overall_score_when_populated(self, mock_data_context):
    mock_data_context.risk_metrics.knowledge_score = 60.0
    mock_data_context.risk_metrics.sentiment_score = 80.0
    mock_data_context.risk_metrics.involvement_score = 70.0
    mock_data_context.risk_metrics.overall_score = 70.0
    md = RiskReportSection().render(_config(), mock_data_context)
    assert "Overall Score" in md

  def test_render_overall_score_computed_from_components(self, mock_data_context):
    mock_data_context.risk_metrics.knowledge_score = 60.0
    mock_data_context.risk_metrics.sentiment_score = 80.0
    mock_data_context.risk_metrics.involvement_score = 70.0
    mock_data_context.risk_metrics.overall_score = 70.0
    md = RiskReportSection().render(_config(), mock_data_context)
    assert "70.0" in md

  def test_render_shows_repeat_offenders_count(self, mock_data_context):
    # Emails must NOT appear; only the count is shown
    md = RiskReportSection().render(_config(), mock_data_context)
    assert "user-1" not in md
    assert "user-2" not in md
    assert "2" in md  # count of repeat offenders

  def test_render_no_repeat_offenders_message(self, mock_data_context):
    mock_data_context.global_stats.repeat_offenders = []
    md = RiskReportSection().render(_config(), mock_data_context)
    assert "No repeat clickers" in md

  def test_render_shows_top_vulnerable_campaigns(self, mock_data_context):
    md = RiskReportSection().render(_config(), mock_data_context)
    assert "Test Campaign" in md

  def test_render_no_campaigns_message(self, mock_data_context):
    mock_data_context.campaign_details = []
    md = RiskReportSection().render(_config(), mock_data_context)
    assert "No simulation data available" in md

  def test_render_no_global_stats_shows_fallback(self, mock_data_context):
    mock_data_context.global_stats = None
    md = RiskReportSection().render(_config(), mock_data_context)
    assert "No simulation data available" in md

  def test_render_notes_shown_when_scores_populated(self, mock_data_context):
    mock_data_context.risk_metrics.knowledge_score = 60.0
    mock_data_context.risk_metrics.sentiment_score = 80.0
    mock_data_context.risk_metrics.involvement_score = 70.0
    mock_data_context.risk_metrics.notes = "Risk calculation pending K/S/E data integration."
    md = RiskReportSection().render(_config(), mock_data_context)
    assert "Risk calculation pending" in md
