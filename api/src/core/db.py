from sqlalchemy import text
from sqlmodel import create_engine, SQLModel, Session, select
from src.core.settings import settings
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
    PhishingKit,
    CampaignPhishingKitLink,
    ComplianceAcceptance,
    TenantCompliancePolicy,
    TenantComplianceQuiz,
)

engine = create_engine(str(settings.PGSQL_DATABASE_URI))


async def init_db():
    SQLModel.metadata.create_all(engine)
    #TODO CHECK THIS
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
            conn.execute(
                text(
                    "ALTER TABLE user_progress "
                    "ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITHOUT TIME ZONE"
                )
            )
            conn.execute(
                text(
                    "ALTER TABLE user_progress "
                    "ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITHOUT TIME ZONE"
                )
            )
            conn.execute(
                text(
                    "ALTER TABLE user_progress "
                    "ADD COLUMN IF NOT EXISTS overdue BOOLEAN NOT NULL DEFAULT FALSE"
                )
            )
            conn.execute(
                text(
                    "ALTER TABLE user_progress "
                    "ADD COLUMN IF NOT EXISTS cert_valid_days INTEGER NOT NULL DEFAULT 365"
                )
            )
            conn.execute(
                text(
                    "ALTER TABLE user_progress "
                    "ADD COLUMN IF NOT EXISTS cert_expires_at TIMESTAMP WITHOUT TIME ZONE"
                )
            )
            conn.execute(
                text(
                    "ALTER TABLE user_progress "
                    "ADD COLUMN IF NOT EXISTS expired BOOLEAN NOT NULL DEFAULT FALSE"
                )
            )
            conn.execute(
                text(
                    "ALTER TABLE user_progress "
                    "ADD COLUMN IF NOT EXISTS status VARCHAR NOT NULL DEFAULT 'SCHEDULED'"
                )
            )
            conn.execute(
                text(
                    "ALTER TABLE user_progress "
                    "ADD COLUMN IF NOT EXISTS notified_at TIMESTAMP WITHOUT TIME ZONE"
                )
            )
            conn.commit()
        except Exception:
            conn.rollback()
