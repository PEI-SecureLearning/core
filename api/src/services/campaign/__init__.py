from src.services.campaign.campaign_handler import campaign_handler
from src.services.campaign.stats_handler import stats_handler
from src.services.campaign.email_handler import email_handler


class CampaignService(campaign_handler, stats_handler, email_handler):
    """Unified campaign service composing all domain handlers."""
    pass
