"""Tests for ReportRenderer — HTML output."""

from __future__ import annotations

from unittest.mock import patch

from src.services.reports.context import DataContext, RiskMetrics
from src.services.reports.renderer import ReportRenderer
from src.services.reports.spec import SectionKind


class TestReportRenderer:
  def test_render_contains_title(self, full_spec, mock_data_context):
    html = ReportRenderer().render(full_spec, mock_data_context)
    assert "Full Report" in html

  def test_render_contains_realm(self, full_spec, mock_data_context):
    html = ReportRenderer().render(full_spec, mock_data_context)
    assert "acme" in html

  def test_render_contains_footer(self, full_spec, mock_data_context):
    html = ReportRenderer().render(full_spec, mock_data_context)
    assert "SecureLearning" in html

  def test_render_is_valid_html_document(self, full_spec, mock_data_context):
    html = ReportRenderer().render(full_spec, mock_data_context)
    assert html.startswith("<!DOCTYPE html>")
    assert "<html" in html
    assert "</html>" in html

  def test_render_includes_risk_section_heading(self, full_spec, mock_data_context):
    html = ReportRenderer().render(full_spec, mock_data_context)
    assert "Security Awareness Score" in html

  def test_render_includes_global_stats_heading(self, full_spec, mock_data_context):
    html = ReportRenderer().render(full_spec, mock_data_context)
    assert "Phishing Simulation Summary" in html

  def test_render_includes_campaign_stats_heading(self, full_spec, mock_data_context):
    html = ReportRenderer().render(full_spec, mock_data_context)
    assert "Simulation Campaigns" in html

  def test_render_includes_compliance_heading(self, full_spec, mock_data_context):
    html = ReportRenderer().render(full_spec, mock_data_context)
    assert "Security Training Completion" in html

  def test_render_minimal_spec_only_risk(self, minimal_spec, mock_data_context):
    html = ReportRenderer().render(minimal_spec, mock_data_context)
    assert "Security Awareness Score" in html
    assert "Phishing Simulation Summary" not in html

  def test_render_unknown_section_kind(self, mock_data_context):
    from src.services.reports import renderer as renderer_module
    from src.services.reports.spec import SectionConfig, ReportSpec, SectionKind
    from datetime import datetime

    spec = ReportSpec(
      title="T",
      realm_name="r",
      generated_at=datetime(2025, 1, 1),
      sections=(SectionConfig(kind=SectionKind.COMPLIANCE),),
    )
    with patch.object(renderer_module, "_SECTION_REGISTRY", {}):
      html = ReportRenderer().render(spec, mock_data_context)
    assert "Unknown section" in html

  def test_sections_separated_by_horizontal_rule(self, full_spec, mock_data_context):
    html = ReportRenderer().render(full_spec, mock_data_context)
    assert "<hr>" in html
