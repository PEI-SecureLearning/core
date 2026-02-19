# Import order matters for SQLModel relationships
# Import link tables and models without relationships first
from .user_group import CampaignUserGroupLink, UserGroup
from .realm import Realm, RealmCreate
from .user import User
from .custom_header import CustomHeader
from .sending_profile import SendingProfile
from .email_template import EmailTemplate
from .landing_page_template import LandingPageTemplate
from .campaign import Campaign, CampaignCreate, CampaignStatus
from .email_sending import EmailSending, EmailSendingCreate, RabbitMQEmailMessage, SMTPConfig
from .compliance import ComplianceAcceptance
from .tenant_compliance import TenantCompliancePolicy, TenantComplianceQuiz


__all__ = [
    # User
    "User",
    # Campaign
    "Campaign",
    "CampaignCreate",
    "CampaignStatus",
    # Email Template
    "EmailTemplate",
    # Email Sending
    "EmailSending",
    "EmailSendingCreate",
    "RabbitMQEmailMessage",
    "SMTPConfig",
    # Custom Header
    "CustomHeader",
    # Landing Page Template
    "LandingPageTemplate",
    # Realm
    "Realm",
    "RealmCreate",
    # Sending Profile
    "SendingProfile",
    # User Group
    "UserGroup",
    "CampaignUserGroupLink",
    # Compliance
    "ComplianceAcceptance",
    "TenantCompliancePolicy",
    "TenantComplianceQuiz",
]
