from sqlmodel import create_engine, SQLModel
from src.core.settings import settings
# Import all models so SQLModel knows about them
from src.models import (
    User,
    UserGroup,
    CampaignUserGroupLink,
    Tenant,
    Realm,
    Campaign,
    LandingPageTemplate,
    EmailTemplate,
    EmailSending,
    CustomHeader,
    SendingProfile,
)

engine = create_engine(str(settings.PGSQL_DATABASE_URI))


async def init_db():
    SQLModel.metadata.create_all(engine)
