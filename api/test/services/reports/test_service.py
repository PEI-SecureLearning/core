"""Tests for ReportService."""

from __future__ import annotations

from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest

from src.services.reports.builder import ReportBuilder
from src.services.reports.context import DataContext, RiskMetrics
from src.services.reports.service import ReportService


def _make_service(markdown="# Mock Report\n", pdf=b"%PDF-mock"):
  renderer = MagicMock()
  renderer.render.return_value = markdown
  converter = MagicMock()
  converter.convert.return_value = pdf
  return ReportService(renderer=renderer, converter=converter), renderer, converter


class TestReportService:
  def test_generate_returns_bytes(self, full_spec):
    service, _, _ = _make_service()
    result = service.generate(full_spec, session=MagicMock())
    assert isinstance(result, bytes)

  def test_generate_calls_renderer(self, full_spec):
    service, renderer, _ = _make_service()
    with patch.object(service, "_collect", return_value=MagicMock(spec=DataContext)):
      service.generate(full_spec, session=MagicMock())
    renderer.render.assert_called_once()

  def test_generate_calls_converter(self, full_spec):
    service, renderer, converter = _make_service()
    with patch.object(service, "_collect", return_value=MagicMock(spec=DataContext)):
      service.generate(full_spec, session=MagicMock())
    converter.convert.assert_called_once_with(renderer.render.return_value)

  def test_render_html_skips_converter(self, full_spec):
    service, renderer, converter = _make_service()
    with patch.object(service, "_collect", return_value=MagicMock(spec=DataContext)):
      result = service.render_html(full_spec, session=MagicMock())
    converter.convert.assert_not_called()
    assert result == renderer.render.return_value

  def test_collect_only_fetches_global_stats_when_needed(self, minimal_spec):
    """Risk section also requires global_stats for repeat offenders."""
    service, _, _ = _make_service()
    session = MagicMock()
    with (
      patch("src.services.reports.service.collect_global_stats", return_value=MagicMock()) as mock_gs,
      patch("src.services.reports.service.collect_campaign_stats", return_value=[]),
      patch("src.services.reports.service.collect_risk_metrics", return_value=RiskMetrics()),
      patch("src.services.reports.service.collect_compliance_metrics", return_value=None),
    ):
      service._collect(minimal_spec, session)
    mock_gs.assert_called_once_with(minimal_spec.realm_name, session)

  def test_collect_skips_compliance_when_not_in_spec(self, minimal_spec):
    service, _, _ = _make_service()
    session = MagicMock()
    with (
      patch("src.services.reports.service.collect_global_stats", return_value=MagicMock()),
      patch("src.services.reports.service.collect_campaign_stats", return_value=[]),
      patch("src.services.reports.service.collect_risk_metrics", return_value=RiskMetrics()),
      patch("src.services.reports.service.collect_compliance_metrics") as mock_comp,
    ):
      service._collect(minimal_spec, session)
    mock_comp.assert_not_called()

  def test_collect_skips_campaign_stats_when_not_in_spec(self, minimal_spec):
    service, _, _ = _make_service()
    session = MagicMock()
    with (
      patch("src.services.reports.service.collect_global_stats", return_value=MagicMock()),
      patch("src.services.reports.service.collect_campaign_stats") as mock_cs,
      patch("src.services.reports.service.collect_risk_metrics", return_value=RiskMetrics()),
      patch("src.services.reports.service.collect_compliance_metrics", return_value=None),
    ):
      service._collect(minimal_spec, session)
    mock_cs.assert_not_called()
