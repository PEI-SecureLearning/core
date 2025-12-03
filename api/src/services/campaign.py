from sqlmodel import Session, select
from src.models.campaign import Campaign, CampaignCreate
from src.models.user import User


class CampaignService:
    """Service class for managing campaigns."""

    def create_campaign(self, campaign: CampaignCreate, session: Session) -> bool:
        """Create a new campaign."""

        if not session.get(User, campaign.creator_id):
            return False  # Creator user does not exist

        new_campaign = Campaign.model_validate(campaign)
        session.add(new_campaign)
        session.commit()
        session.refresh(new_campaign)
        return True

    def get_all_campaigns(self, session: Session) -> list[Campaign]:
        """Fetch all campaigns."""
        campaigns = session.exec(select(Campaign)).all()
        return [Campaign.model_validate(c) for c in campaigns]
