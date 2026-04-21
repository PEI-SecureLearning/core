"""Tests for OperationsOutlookSection."""

from __future__ import annotations

import pytest

from src.services.reports.context import ComplianceMetrics
from src.services.reports.sections.operations_outlook import OperationsOutlookSection
from src.services.reports.spec import SectionConfig, SectionKind


def _config(campaign_ids: list[int] | None = None) -> SectionConfig:
  return SectionConfig(kind=SectionKind.OPERATIONS_OUTLOOK, campaign_ids=campaign_ids or [])


class TestOperationsOutlookSection:
  def test_render_contains_heading(self, mock_data_context):
    html = OperationsOutlookSection().render(_config([1]), mock_data_context)
    assert "Operations Outlook" in html

  def test_render_contains_simulation_summary(self, mock_data_context):
    html = OperationsOutlookSection().render(_config([1]), mock_data_context)
    assert "Simulation Summary" in html

  def test_render_shows_email_funnel(self, mock_data_context):
    html = OperationsOutlookSection().render(_config([1]), mock_data_context)
    assert "Delivered" in html
    assert "Fell for Simulation" in html

  def test_render_shows_campaign_detail(self, mock_data_context):
    html = OperationsOutlookSection().render(_config([1]), mock_data_context)
    assert "Campaign Detail" in html
    assert "Test Campaign" in html

  def test_render_shows_compliance_detail(self, mock_data_context):
    html = OperationsOutlookSection().render(_config([1]), mock_data_context)
    assert "Training Completion" in html
    assert "80.0%" in html

  def test_render_no_global_stats_fallback(self, mock_data_context):
    mock_data_context.global_stats = None
    html = OperationsOutlookSection().render(_config([1]), mock_data_context)
    assert "No simulation data available" in html

  def test_render_no_campaign_details_fallback(self, mock_data_context):
    mock_data_context.campaign_details = []
    html = OperationsOutlookSection().render(_config([1]), mock_data_context)
    assert "No campaign data available" in html

  def test_render_no_compliance_metrics_fallback(self, mock_data_context):
    mock_data_context.compliance_metrics = None
    html = OperationsOutlookSection().render(_config([1]), mock_data_context)
    assert "No training data available" in html

  def test_render_no_matching_campaign_ids_fallback(self, mock_data_context):
    html = OperationsOutlookSection().render(_config([999]), mock_data_context)
    assert "No matching campaigns found" in html

  def test_render_all_campaigns_when_no_ids(self, mock_data_context):
    html = OperationsOutlookSection().render(_config([]), mock_data_context)
    assert "Test Campaign" in html

  def test_render_shows_gap_callout_when_non_compliant(self, mock_data_context):
    html = OperationsOutlookSection().render(_config([1]), mock_data_context)
    assert "still need to complete" in html

  def test_render_shows_ratio_callout(self, mock_data_context):
    html = OperationsOutlookSection().render(_config([1]), mock_data_context)
    assert "in" in html  # ratio framing

  def test_render_all_compliant_positive_callout(self, mock_data_context):
    mock_data_context.compliance_metrics = ComplianceMetrics(
      total_users=50,
      compliant_users=50,
      compliance_rate=100.0,
      avg_score=95.0,
      avg_attempts_to_pass=1.0,
    )
    html = OperationsOutlookSection().render(_config([1]), mock_data_context)
    assert "All employees" in html

  def test_render_shows_human_readable_timing(self, mock_data_context):
    # avg_time_to_open_seconds=90.0 → "1 min 30 sec"
    html = OperationsOutlookSection().render(_config([1]), mock_data_context)
    assert "1 min 30 sec" in html
