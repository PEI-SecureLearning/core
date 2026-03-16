# Import order matters for SQLModel relationships
# Import link tables and models without relationships first
from .user_group import CampaignUserGroupLink, UserGroup
from .realm import Realm, RealmCreate, RealmResponse, RealmInfo, RealmInfoResponse, RealmUserCreate, RealmGroupCreate
from .user import User
from .email_template import EmailTemplate
from .landing_page import LandingPageTemplate
from .phishing_kit import PhishingKit, PhishingKitCreate, PhishingKitDisplayInfo, CampaignPhishingKitLink, PhishingKitSendingProfileLink
from .sending_profile import SendingProfile, SendingProfileCreate, SendingProfileDisplayInfo, CampaignSendingProfileLink, CustomHeader, CustomHeaderCreate
from .campaign import Campaign, CampaignCreate, CampaignStatus, CampaignDisplayInfo, CampaignDetailInfo, CampaignGlobalStats, CampaignUpdate, MIN_INTERVAL_SECONDS
from .email_sending import EmailSending, EmailSendingStatus, UserSendingInfo, RabbitMQEmailMessage, SMTPConfig
from .compliance import (
    ComplianceAcceptance,
    TenantCompliancePolicy,
    TenantComplianceQuiz,
    Question,
    ComplianceDocumentResponse,
    QuizQuestionResponse,
    QuizResponse,
    Answer,
    SubmitRequest,
    QuestionFeedback,
    SubmitResponse,
    AcceptRequest,
    ComplianceStatusResponse,
)
from .org_manager import (
    OrgUserCreate,
    OrgGroupCreate,
    CompliancePolicyPayload,
    QuizQuestionPayload,
    ComplianceQuizPayload,
    CompliancePolicyResponse,
    ComplianceQuizResponse,
)
from .module import (
    ModuleStatus,
    Difficulty,
    QuestionType,
    RichMediaType,
    Choice,
    QuestionModel,
    TextBlock,
    RichContentBlock,
    QuestionBlock,
    Block,
    Section,
    ModuleCreate,
    ModuleUpdate,
    ModulePatch,
    ModuleOut,
    PaginatedModules,
)


__all__ = [
    # User
    "User",
    # Campaign
    "Campaign",
    "CampaignCreate",
    "CampaignUpdate",
    "CampaignStatus",
    "CampaignDisplayInfo",
    "CampaignDetailInfo",
    "CampaignGlobalStats",
    "MIN_INTERVAL_SECONDS",
    "CampaignUserGroupLink",
    "CampaignPhishingKitLink",
    "CampaignSendingProfileLink",
    # PhishingKit
    "PhishingKit",
    "PhishingKitCreate",
    "PhishingKitDisplayInfo",
    "PhishingKitSendingProfileLink",
    # Email Template
    "EmailTemplate",
    # Email Sending
    "EmailSending",
    "EmailSendingStatus",
    "UserSendingInfo",
    "RabbitMQEmailMessage",
    "SMTPConfig",
    # Custom Header
    "CustomHeader",
    "CustomHeaderCreate",
    # Landing Page Template
    "LandingPageTemplate",
    # Realm
    "Realm",
    "RealmCreate",
    "RealmResponse",
    "RealmInfo",
    "RealmInfoResponse",
    "RealmUserCreate",
    "RealmGroupCreate",
    # Sending Profile
    "SendingProfile",
    "SendingProfileCreate",
    "SendingProfileDisplayInfo",
    # User Group
    "UserGroup",
    # Compliance
    "ComplianceAcceptance",
    "TenantCompliancePolicy",
    "TenantComplianceQuiz",
    # Compliance Schemas
    "Question",
    "ComplianceDocumentResponse",
    "QuizQuestionResponse",
    "QuizResponse",
    "Answer",
    "SubmitRequest",
    "QuestionFeedback",
    "SubmitResponse",
    "AcceptRequest",
    "ComplianceStatusResponse",
    # Org Manager Schemas
    "OrgUserCreate",
    "OrgGroupCreate",
    "CompliancePolicyPayload",
    "QuizQuestionPayload",
    "ComplianceQuizPayload",
    "CompliancePolicyResponse",
    "ComplianceQuizResponse",
    # Learning Module
    "ModuleStatus",
    "Difficulty",
    "QuestionType",
    "RichMediaType",
    "Choice",
    "QuestionModel",
    "TextBlock",
    "RichContentBlock",
    "QuestionBlock",
    "Block",
    "Section",
    "ModuleCreate",
    "ModuleUpdate",
    "ModulePatch",
    "ModuleOut",
    "PaginatedModules",
]
