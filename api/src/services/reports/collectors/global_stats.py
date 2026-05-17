"""Global stats collector — wraps StatsHandler to populate DataContext."""

from __future__ import annotations

from sqlmodel import Session

from src.models import CampaignGlobalStats
from src.services.campaign.stats_handler import get_stats_handler


def collect_global_stats(realm_name: str, session: Session) -> CampaignGlobalStats:
  """Fetch global campaign statistics for the given realm."""
  handler = get_stats_handler()
  return handler.get_global_stats(realm_name, session)
