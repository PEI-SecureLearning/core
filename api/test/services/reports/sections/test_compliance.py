"""Tests for ComplianceSection."""

from __future__ import annotations

import pytest

from src.services.reports.context import ComplianceMetrics
from src.services.reports.sections.compliance import ComplianceSection
from src.services.reports.spec import SectionConfig, SectionKind


def _config() -> SectionConfig:
  return SectionConfig(kind=SectionKind.COMPLIANCE)


class TestComplianceSection:
  def test_render_contains_heading(self, mock_data_context):
    md = ComplianceSection().render(_config(), mock_data_context)
    assert "Security Training Completion" in md

  def test_render_shows_total_users(self, mock_data_context):
    md = ComplianceSection().render(_config(), mock_data_context)
    assert "50" in md  # total_users

  def test_render_shows_compliant_users(self, mock_data_context):
    md = ComplianceSection().render(_config(), mock_data_context)
    assert "40" in md  # compliant_users

  def test_render_shows_non_compliant_users(self, mock_data_context):
    md = ComplianceSection().render(_config(), mock_data_context)
    assert "10" in md  # 50 - 40

  def test_render_shows_compliance_rate(self, mock_data_context):
    md = ComplianceSection().render(_config(), mock_data_context)
    assert "80.0%" in md

  def test_render_shows_avg_score(self, mock_data_context):
    md = ComplianceSection().render(_config(), mock_data_context)
    assert "82.5%" in md

  def test_render_shows_avg_attempts(self, mock_data_context):
    md = ComplianceSection().render(_config(), mock_data_context)
    assert "1.4" in md

  def test_render_shows_gap_callout_when_non_compliant(self, mock_data_context):
    md = ComplianceSection().render(_config(), mock_data_context)
    assert "still need to complete" in md

  def test_render_no_compliance_data_fallback(self, mock_data_context):
    mock_data_context.compliance_metrics = None
    md = ComplianceSection().render(_config(), mock_data_context)
    assert "No training data available" in md

  def test_render_zero_users_edge_case(self, mock_data_context):
    mock_data_context.compliance_metrics = ComplianceMetrics(
      total_users=0,
      compliant_users=0,
      compliance_rate=0.0,
      avg_score=0.0,
      avg_attempts_to_pass=0.0,
    )
    md = ComplianceSection().render(_config(), mock_data_context)
    assert "Security Training Completion" in md
    assert "0.0%" in md

  def test_render_all_compliant_shows_positive_callout(self, mock_data_context):
    mock_data_context.compliance_metrics = ComplianceMetrics(
      total_users=50,
      compliant_users=50,
      compliance_rate=100.0,
      avg_score=90.0,
      avg_attempts_to_pass=1.1,
    )
    md = ComplianceSection().render(_config(), mock_data_context)
    assert "All employees" in md
