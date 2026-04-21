"""Tests for the global stats collector."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from src.models import CampaignGlobalStats
from src.services.reports.collectors.global_stats import collect_global_stats


class TestGlobalStatsCollector:
  def test_returns_campaign_global_stats(self, mock_global_stats):
    mock_handler = MagicMock()
    mock_handler.get_global_stats.return_value = mock_global_stats

    with patch(
      "src.services.reports.collectors.global_stats.get_stats_handler",
      return_value=mock_handler,
    ):
      result = collect_global_stats("acme", session=MagicMock())

    assert isinstance(result, CampaignGlobalStats)

  def test_calls_handler_with_realm_and_session(self, mock_global_stats):
    session = MagicMock()
    mock_handler = MagicMock()
    mock_handler.get_global_stats.return_value = mock_global_stats

    with patch(
      "src.services.reports.collectors.global_stats.get_stats_handler",
      return_value=mock_handler,
    ):
      collect_global_stats("acme", session)

    mock_handler.get_global_stats.assert_called_once_with("acme", session)

  def test_returns_correct_total_campaigns(self, mock_global_stats):
    mock_handler = MagicMock()
    mock_handler.get_global_stats.return_value = mock_global_stats

    with patch(
      "src.services.reports.collectors.global_stats.get_stats_handler",
      return_value=mock_handler,
    ):
      result = collect_global_stats("acme", session=MagicMock())

    assert result.total_campaigns == 5
