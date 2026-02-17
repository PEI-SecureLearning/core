from src.services.campaign.Campaign_handler import Campaign_handler
from src.services.campaign.Stats_handler import Stats_handler
from src.services.campaign.Email_handler import Email_handler


class CampaignService(Campaign_handler, Stats_handler, Email_handler):
    """Unified campaign service composing all domain handlers."""
    pass
