# Import order matters for SQLModel relationships
# Import link tables and models without relationships first
from .user_group import CampaignUserGroupLink, UserGroup
from .realm import Realm, RealmCreate
from .user import User
from .custom_header import CustomHeader
from .email_template import EmailTemplate
from .landing_page import LandingPageTemplate
from .phishing_kit import PhishingKit, PhishingKitCreate, PhishingKitDisplayInfo, CampaignPhishingKitLink, PhishingKitSendingProfileLink
from .sending_profile import SendingProfile, CampaignSendingProfileLink
from .campaign import Campaign, CampaignCreate, CampaignStatus
from .email_sending import EmailSending, RabbitMQEmailMessage, SMTPConfig
from .compliance import ComplianceAcceptance
from .tenant_compliance import TenantCompliancePolicy, TenantComplianceQuiz


__all__ = [
    # User
    "User",
    # Campaign
    "Campaign",
    "CampaignCreate",
    "CampaignStatus",
    # PhishingKit
    "PhishingKit",
    "PhishingKitCreate",
    "PhishingKitDisplayInfo",
    "CampaignPhishingKitLink",
    "PhishingKitSendingProfileLink",
    # Email Template
    "EmailTemplate",
    # Email Sending
    "EmailSending",
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
    "CampaignSendingProfileLink",
    # User Group
    "UserGroup",
    "CampaignUserGroupLink",
    # Compliance
    "ComplianceAcceptance",
    "TenantCompliancePolicy",
    "TenantComplianceQuiz",
]
