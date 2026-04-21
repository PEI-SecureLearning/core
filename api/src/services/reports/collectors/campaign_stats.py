"""Campaign stats collector — fetches detail info for a list of campaign IDs."""

from __future__ import annotations

from sqlmodel import Session, select

from src.models import Campaign, CampaignDetailInfo
from src.services.campaign.stats_handler import get_stats_handler


def collect_campaign_stats(
  campaign_ids: list[int], session: Session
) -> list[CampaignDetailInfo]:
  """Fetch CampaignDetailInfo for each of the given campaign IDs.

  Campaigns that are not found in the database are silently skipped.
  """
  if not campaign_ids:
    return []

  handler = get_stats_handler()
  campaigns = session.exec(
    select(Campaign).where(Campaign.id.in_(campaign_ids))  # type: ignore[attr-defined]
  ).all()

  return [handler._to_detail_info(c) for c in campaigns]
