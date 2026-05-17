"""Tests for the campaign stats collector."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from src.models import CampaignDetailInfo
from src.services.reports.collectors.campaign_stats import collect_campaign_stats


class TestCampaignStatsCollector:
  def test_returns_empty_list_for_empty_ids(self):
    result = collect_campaign_stats([], session=MagicMock())
    assert result == []

  def test_returns_list_of_detail_info(self, mock_campaign_detail):
    mock_campaign = MagicMock()
    mock_handler = MagicMock()
    mock_handler._to_detail_info.return_value = mock_campaign_detail

    session = MagicMock()
    session.exec.return_value.all.return_value = [mock_campaign]

    with patch(
      "src.services.reports.collectors.campaign_stats.get_stats_handler",
      return_value=mock_handler,
    ):
      result = collect_campaign_stats([1], session)

    assert len(result) == 1
    assert result[0] is mock_campaign_detail

  def test_calls_to_detail_info_once_per_campaign(self, mock_campaign_detail):
    mock_campaigns = [MagicMock(), MagicMock()]
    mock_handler = MagicMock()
    mock_handler._to_detail_info.return_value = mock_campaign_detail

    session = MagicMock()
    session.exec.return_value.all.return_value = mock_campaigns

    with patch(
      "src.services.reports.collectors.campaign_stats.get_stats_handler",
      return_value=mock_handler,
    ):
      collect_campaign_stats([1, 2], session)

    assert mock_handler._to_detail_info.call_count == 2

  def test_skips_missing_campaigns_gracefully(self):
    session = MagicMock()
    session.exec.return_value.all.return_value = []  # nothing found

    mock_handler = MagicMock()
    with patch(
      "src.services.reports.collectors.campaign_stats.get_stats_handler",
      return_value=mock_handler,
    ):
      result = collect_campaign_stats([999], session)

    assert result == []
