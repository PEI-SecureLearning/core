from sqlmodel import create_engine, SQLModel
from src.core.settings import settings
# Import all models so SQLModel knows about them
from src.models import (
    User, UserGroupLink,
    Tenant, TenantFeatureLink,
    Group,
    Campaign, CampaignGroupLink,
    Content,
    LandingPageTemplate, LandingPage,
    EmailTemplate, EmailSending, EmailSendingTemplateLink,
    RemediationPlan,
    Module,
    Feature,
)

engine = create_engine(str(settings.PGSQL_DATABASE_URI))


async def init_db():
    SQLModel.metadata.create_all(engine)
