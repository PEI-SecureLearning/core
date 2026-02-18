from api.src.services.campaign.campaign_handler import Campaign_handler
from api.src.services.campaign.stats_handler import Stats_handler
from api.src.services.campaign.email_handler import Email_handler


class CampaignService(Campaign_handler, Stats_handler, Email_handler):
    """Unified campaign service composing all domain handlers."""
    pass
