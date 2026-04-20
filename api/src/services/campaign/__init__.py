from src.services.campaign.campaign_handler import CampaignHandler
from src.services.campaign.stats_handler import StatsHandler
from src.services.campaign.email_handler import EmailHandler


class CampaignService(CampaignHandler, StatsHandler, EmailHandler):
    """Unified campaign service composing all domain handlers."""

    def __init__(self):
        StatsHandler.__init__(self)


_instance: CampaignService | None = None


def get_campaign_service() -> CampaignService:
    global _instance
    if _instance is None:
        _instance = CampaignService()
    return _instance
