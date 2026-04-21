"""Tests for ExecutiveSummarySection."""

from __future__ import annotations

import pytest

from src.services.reports.context import ComplianceMetrics, DataContext
from src.services.reports.sections.executive_summary import ExecutiveSummarySection, _posture
from src.services.reports.spec import SectionConfig, SectionKind


def _config() -> SectionConfig:
  return SectionConfig(kind=SectionKind.EXECUTIVE_SUMMARY)


class TestPostureHelper:
  def test_strong_when_low_phish_and_high_compliance(self):
    label, level = _posture(phish_rate=3.0, compliance_rate=90.0)
    assert label == "Strong"
    assert level == "green"

  def test_improving_when_moderate(self):
    label, level = _posture(phish_rate=7.0, compliance_rate=75.0)
    assert label == "Improving"
    assert level == "amber"

  def test_needs_attention_when_high_phish(self):
    label, level = _posture(phish_rate=15.0, compliance_rate=60.0)
    assert label == "Needs Attention"
    assert level == "red"

  def test_boundary_strong_phish_threshold(self):
    # phish_rate == 5.0 is NOT < 5, so not Strong
    label, _ = _posture(phish_rate=5.0, compliance_rate=90.0)
    assert label != "Strong"

  def test_boundary_improving_phish_threshold(self):
    # phish_rate == 10.0 is NOT < 10, so falls to Needs Attention
    label, _ = _posture(phish_rate=10.0, compliance_rate=75.0)
    assert label == "Needs Attention"


class TestExecutiveSummarySection:
  def test_render_contains_heading(self, mock_data_context):
    html = ExecutiveSummarySection().render(_config(), mock_data_context)
    assert "Executive Summary" in html

  def test_render_contains_at_a_glance(self, mock_data_context):
    html = ExecutiveSummarySection().render(_config(), mock_data_context)
    assert "At a Glance" in html

  def test_render_contains_realm_name(self, mock_data_context):
    html = ExecutiveSummarySection().render(_config(), mock_data_context)
    assert "acme" in html

  def test_render_contains_posture_badge(self, mock_data_context):
    html = ExecutiveSummarySection().render(_config(), mock_data_context)
    assert "badge" in html

  def test_render_contains_phish_rate(self, mock_data_context):
    html = ExecutiveSummarySection().render(_config(), mock_data_context)
    assert "8.9%" in html

  def test_render_contains_compliance_rate(self, mock_data_context):
    html = ExecutiveSummarySection().render(_config(), mock_data_context)
    assert "80.0%" in html

  def test_render_contains_key_findings(self, mock_data_context):
    html = ExecutiveSummarySection().render(_config(), mock_data_context)
    assert "Key Findings" in html

  def test_render_contains_recommended_actions(self, mock_data_context):
    html = ExecutiveSummarySection().render(_config(), mock_data_context)
    assert "Recommended Actions" in html

  def test_render_no_global_stats(self, mock_data_context):
    mock_data_context.global_stats = None
    html = ExecutiveSummarySection().render(_config(), mock_data_context)
    assert "Executive Summary" in html  # still renders

  def test_render_no_compliance_metrics(self, mock_data_context):
    mock_data_context.compliance_metrics = None
    html = ExecutiveSummarySection().render(_config(), mock_data_context)
    assert "Executive Summary" in html

  def test_render_shows_repeat_clicker_recommendation_when_present(self, mock_data_context):
    # fixture has 2 repeat offenders
    html = ExecutiveSummarySection().render(_config(), mock_data_context)
    assert "coaching" in html.lower() or "repeat" in html.lower()

  def test_render_shows_training_gap_recommendation_when_low_compliance(self, mock_data_context):
    mock_data_context.compliance_metrics.compliance_rate = 50.0
    mock_data_context.compliance_metrics.compliant_users = 25
    html = ExecutiveSummarySection().render(_config(), mock_data_context)
    assert "training" in html.lower()

  def test_render_positive_callout_when_all_good(self, mock_data_context):
    mock_data_context.global_stats.phish_rate = 3.0
    mock_data_context.global_stats.repeat_offenders = []
    mock_data_context.compliance_metrics.compliance_rate = 95.0
    mock_data_context.compliance_metrics.compliant_users = 50
    html = ExecutiveSummarySection().render(_config(), mock_data_context)
    assert "momentum" in html.lower() or "strong" in html.lower()

  def test_render_shows_ratio_in_findings(self, mock_data_context):
    # clicked=100, targeted=300 → 1 in 3
    html = ExecutiveSummarySection().render(_config(), mock_data_context)
    assert "1 in" in html
