"""Tests for CampaignStatsSection."""

from __future__ import annotations

import pytest

from src.services.reports.sections.campaign_stats import CampaignStatsSection
from src.services.reports.spec import SectionConfig, SectionKind


def _config(campaign_ids: list[int] | None = None) -> SectionConfig:
  return SectionConfig(
    kind=SectionKind.CAMPAIGN_STATS,
    campaign_ids=campaign_ids or [],
  )


class TestCampaignStatsSection:
  def test_render_contains_heading(self, mock_data_context):
    md = CampaignStatsSection().render(_config([1]), mock_data_context)
    assert "Simulation Campaigns" in md

  def test_render_shows_campaign_name(self, mock_data_context):
    md = CampaignStatsSection().render(_config([1]), mock_data_context)
    assert "Test Campaign" in md

  def test_render_shows_status(self, mock_data_context):
    md = CampaignStatsSection().render(_config([1]), mock_data_context)
    assert "completed" in md.lower()

  def test_render_shows_delivery_rate(self, mock_data_context):
    md = CampaignStatsSection().render(_config([1]), mock_data_context)
    assert "95.0%" in md

  def test_render_shows_phish_rate(self, mock_data_context):
    md = CampaignStatsSection().render(_config([1]), mock_data_context)
    assert "7.9%" in md

  def test_render_shows_avg_time_to_open_human_readable(self, mock_data_context):
    # 90s = 1 min 30 sec
    md = CampaignStatsSection().render(_config([1]), mock_data_context)
    assert "1 min 30 sec" in md

  def test_render_no_matching_campaign_ids(self, mock_data_context):
    md = CampaignStatsSection().render(_config([999]), mock_data_context)
    assert "No matching simulations" in md

  def test_render_empty_campaign_details(self, mock_data_context):
    mock_data_context.campaign_details = []
    md = CampaignStatsSection().render(_config([1]), mock_data_context)
    assert "No simulation data available" in md

  def test_render_all_campaigns_when_no_ids_specified(self, mock_data_context):
    md = CampaignStatsSection().render(_config([]), mock_data_context)
    assert "Test Campaign" in md

  def test_render_shows_kit_names(self, mock_data_context):
    md = CampaignStatsSection().render(_config([1]), mock_data_context)
    assert "Kit Alpha" in md

  def test_render_shows_progress(self, mock_data_context):
    md = CampaignStatsSection().render(_config([1]), mock_data_context)
    assert "100.0%" in md

  def test_render_uses_friendly_label_fell_for_simulation(self, mock_data_context):
    md = CampaignStatsSection().render(_config([1]), mock_data_context)
    assert "Fell for simulation" in md
