"""Tests for RiskOutlookSection."""

from __future__ import annotations

import pytest

from src.services.reports.sections.risk_outlook import RiskOutlookSection
from src.services.reports.spec import SectionConfig, SectionKind


def _config() -> SectionConfig:
  return SectionConfig(kind=SectionKind.RISK_OUTLOOK)


class TestRiskOutlookSection:
  def test_render_contains_heading(self, mock_data_context):
    html = RiskOutlookSection().render(_config(), mock_data_context)
    assert "Risk Outlook" in html

  def test_render_contains_phishing_exposure_block(self, mock_data_context):
    html = RiskOutlookSection().render(_config(), mock_data_context)
    assert "Phishing Exposure" in html

  def test_render_shows_click_ratio(self, mock_data_context):
    # clicked=100, targeted=300 → 1 in 3
    html = RiskOutlookSection().render(_config(), mock_data_context)
    assert "1 in 3" in html

  def test_render_shows_benchmark_comparison(self, mock_data_context):
    html = RiskOutlookSection().render(_config(), mock_data_context)
    assert "benchmark" in html.lower() or "industry" in html.lower()

  def test_render_hides_scores_when_all_zero(self, mock_data_context):
    html = RiskOutlookSection().render(_config(), mock_data_context)
    assert "Awareness scoring is pending" in html

  def test_render_shows_scores_when_populated(self, mock_data_context):
    mock_data_context.risk_metrics.knowledge_score = 70.0
    mock_data_context.risk_metrics.sentiment_score = 65.0
    mock_data_context.risk_metrics.involvement_score = 80.0
    mock_data_context.risk_metrics.overall_score = 71.7
    html = RiskOutlookSection().render(_config(), mock_data_context)
    assert "Knowledge" in html
    assert "Sentiment" in html
    assert "Engagement" in html

  def test_render_shows_repeat_clickers_count(self, mock_data_context):
    html = RiskOutlookSection().render(_config(), mock_data_context)
    assert "2" in html  # count of repeat offenders
    assert "user-1" not in html  # no PII

  def test_render_no_repeat_clickers_positive_message(self, mock_data_context):
    mock_data_context.global_stats.repeat_offenders = []
    html = RiskOutlookSection().render(_config(), mock_data_context)
    assert "No employees were caught" in html

  def test_render_shows_campaign_risk_breakdown(self, mock_data_context):
    html = RiskOutlookSection().render(_config(), mock_data_context)
    assert "Simulation Risk Breakdown" in html
    assert "Test Campaign" in html

  def test_render_no_global_stats_fallback(self, mock_data_context):
    mock_data_context.global_stats = None
    html = RiskOutlookSection().render(_config(), mock_data_context)
    assert "No simulation data available" in html

  def test_render_no_campaign_details_omits_breakdown(self, mock_data_context):
    mock_data_context.campaign_details = []
    html = RiskOutlookSection().render(_config(), mock_data_context)
    assert "Simulation Risk Breakdown" not in html

  def test_render_no_clicks_positive_message(self, mock_data_context):
    mock_data_context.global_stats.users_who_clicked = 0
    html = RiskOutlookSection().render(_config(), mock_data_context)
    assert "No employees clicked" in html

  def test_render_shows_speed_block(self, mock_data_context):
    # avg_time_to_click_seconds=300.0 → "Moderate" category
    html = RiskOutlookSection().render(_config(), mock_data_context)
    assert "Speed of Compromise" in html

  def test_render_speed_block_hidden_when_no_time(self, mock_data_context):
    mock_data_context.global_stats.avg_time_to_click_seconds = None
    html = RiskOutlookSection().render(_config(), mock_data_context)
    assert "Speed of Compromise" not in html

  def test_render_shows_risk_signals(self, mock_data_context):
    html = RiskOutlookSection().render(_config(), mock_data_context)
    assert "Risk Signals" in html

  def test_render_scores_show_descriptions_when_pending(self, mock_data_context):
    html = RiskOutlookSection().render(_config(), mock_data_context)
    assert "Measures" in html  # description table column header

  def test_render_campaign_breakdown_shows_avg_click_time(self, mock_data_context):
    # campaign fixture has avg_time_to_click_seconds=240.0 → "4 min"
    html = RiskOutlookSection().render(_config(), mock_data_context)
    assert "4 min" in html
