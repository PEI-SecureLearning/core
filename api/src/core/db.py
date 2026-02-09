from sqlalchemy import text
from sqlmodel import create_engine, SQLModel, Session, select
from src.core.settings import settings

# Import all models so SQLModel knows about them
from src.models import (
    User,
    UserGroup,
    CampaignUserGroupLink,
    Realm,
    Campaign,
    LandingPageTemplate,
    EmailTemplate,
    EmailSending,
    CustomHeader,
    SendingProfile,
    ComplianceAcceptance,
    TenantCompliancePolicy,
    TenantComplianceQuiz,
)

engine = create_engine(str(settings.PGSQL_DATABASE_URI))


async def init_db():
    SQLModel.metadata.create_all(engine)
    # Ensure new quiz settings columns exist for existing databases
    with engine.connect() as conn:
        try:
            conn.execute(
                text(
                    "ALTER TABLE tenant_compliance_quiz "
                    "ADD COLUMN IF NOT EXISTS question_count INTEGER NOT NULL DEFAULT 5"
                )
            )
            conn.execute(
                text(
                    "ALTER TABLE tenant_compliance_quiz "
                    "ADD COLUMN IF NOT EXISTS passing_score INTEGER NOT NULL DEFAULT 80"
                )
            )
            conn.commit()
        except Exception:
            conn.rollback()

    # Ensure at least one sending profile exists for testing flows
    with Session(engine) as session:
        existing_profile = session.exec(select(SendingProfile)).first()
        if not existing_profile:
            session.add(
                SendingProfile(
                    name="Placeholder SMTP",
                    smtp_host="smtp.example.com",
                    smtp_port=587,
                    username="placeholder",
                    password="placeholder",
                    from_fname="Secure",
                    from_lname="Learning",
                    from_email="noreply@example.com",
                    realm_name=None,
                )
            )
            session.commit()
