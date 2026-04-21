"""Tests for GlobalStatsSection."""

from __future__ import annotations

import pytest

from src.services.reports.sections.global_stats import GlobalStatsSection
from src.services.reports.spec import SectionConfig, SectionKind


def _config() -> SectionConfig:
  return SectionConfig(kind=SectionKind.GLOBAL_STATS)


class TestGlobalStatsSection:
  def test_render_contains_heading(self, mock_data_context):
    md = GlobalStatsSection().render(_config(), mock_data_context)
    assert "Phishing Simulation Summary" in md

  def test_render_shows_total_campaigns(self, mock_data_context):
    md = GlobalStatsSection().render(_config(), mock_data_context)
    assert "5" in md  # total_campaigns

  def test_render_shows_delivery_rate(self, mock_data_context):
    md = GlobalStatsSection().render(_config(), mock_data_context)
    assert "90.0%" in md

  def test_render_shows_phish_rate(self, mock_data_context):
    md = GlobalStatsSection().render(_config(), mock_data_context)
    assert "8.9%" in md

  def test_render_shows_email_funnel_stages(self, mock_data_context):
    md = GlobalStatsSection().render(_config(), mock_data_context)
    for stage in ("Scheduled", "Delivered", "Opened", "Clicked link", "Fell for simulation", "Failed to deliver"):
      assert stage in md

  def test_render_shows_repeat_clicker_count(self, mock_data_context):
    md = GlobalStatsSection().render(_config(), mock_data_context)
    assert "Repeat clickers" in md
    assert "2" in md  # two repeat offenders in fixture
    # Emails must not be exposed
    assert "user-1" not in md
    assert "user-2" not in md

  def test_render_shows_avg_time_to_open(self, mock_data_context):
    # 120s = 2 min 0 sec
    md = GlobalStatsSection().render(_config(), mock_data_context)
    assert "2 min" in md

  def test_render_shows_na_when_avg_times_missing(self, mock_data_context):
    mock_data_context.global_stats.avg_time_to_open_seconds = None
    mock_data_context.global_stats.avg_time_to_click_seconds = None
    md = GlobalStatsSection().render(_config(), mock_data_context)
    assert "N/A" in md

  def test_render_no_data_fallback(self, mock_data_context):
    mock_data_context.global_stats = None
    md = GlobalStatsSection().render(_config(), mock_data_context)
    assert "No data available" in md

  def test_render_shows_click_ratio_callout(self, mock_data_context):
    md = GlobalStatsSection().render(_config(), mock_data_context)
    assert "in" in md.lower()  # ratio framing: "1 in X targeted employees"
