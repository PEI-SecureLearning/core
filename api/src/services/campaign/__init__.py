from src.services.campaign.campaign_handler import CampaignHandler
from src.services.campaign.stats_handler import stats_handler
from src.services.campaign.email_handler import EmailHandler


class CampaignService(CampaignHandler, stats_handler, EmailHandler):
    """Unified campaign service composing all domain handlers."""
    pass
