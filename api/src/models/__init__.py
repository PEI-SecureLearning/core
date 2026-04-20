# Import order matters for SQLModel relationships
# Import link tables and models without relationships first
from .user_group import (
    CampaignUserGroupLink,
    UserGroup,
    KeycloakGroupDTO,
)
from .realm import (
    Realm,
    RealmCreate,
    RealmResponse,
    RealmInfo,
    RealmInfoResponse,
    RealmUserCreate,
    RealmGroupCreate,
)
from .user import User, UserDTO, UserCreatedInRealmDTO, UserListInRealmDTO
from .user_risk.table import UserRisk
from .email_template import EmailTemplate
from .landing_page import LandingPageTemplate
from .phishing_kit import (
    PhishingKit,
    PhishingKitCreate,
    PhishingKitDisplayInfo,
    CampaignPhishingKitLink,
    PhishingKitSendingProfileLink,
)
from .sending_profile import (
    SendingProfile,
    SendingProfileCreate,
    SendingProfileDisplayInfo,
    SendingProfileRead,
    CampaignSendingProfileLink,
    CustomHeader,
    CustomHeaderCreate,
    CustomHeaderRead,
)
from .campaign import (
    Campaign,
    CampaignCreate,
    CampaignStatus,
    CampaignDisplayInfo,
    CampaignDetailInfo,
    CampaignGlobalStats,
    CampaignUpdate,
    MIN_INTERVAL_SECONDS,
    UserCampaignStatDetail,
    UserCampaignStatsResponse,
)
from .email_sending import (
    EmailSending,
    EmailSendingStatus,
    UserSendingInfo,
    CampaignSendingsResponse,
    RabbitMQEmailMessage,
    SMTPConfig,
)
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
from .user_progress import UserProgress, AssignmentStatus
from .org_manager import (
    OrgUserCreate,
    OrgGroupCreate,
    CompliancePolicyPayload,
    QuizQuestionPayload,
    ComplianceQuizPayload,
    CompliancePolicyResponse,
    ComplianceQuizResponse,
    CourseEnrollmentPayload,
)
from .module import (
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
from .course import (
    CourseDifficulty,
    CourseCreate,
    CourseUpdate,
    CoursePatch,
    CourseOut,
    PaginatedCourses,
)
from .user_progress import UserProgress, AssignmentStatus


__all__ = [
    # User
    "User",
    "UserDTO",
    "UserCreatedInRealmDTO",
    "UserListInRealmDTO",
    "UserRisk",
    # Campaign
    "Campaign",
    "CampaignCreate",
    "CampaignUpdate",
    "CampaignStatus",
    "CampaignDisplayInfo",
    "CampaignDetailInfo",
    "CampaignGlobalStats",
    "MIN_INTERVAL_SECONDS",
    "UserCampaignStatDetail",
    "UserCampaignStatsResponse",
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
    "CampaignSendingsResponse",
    "RabbitMQEmailMessage",
    "SMTPConfig",
    # Custom Header
    "CustomHeader",
    "CustomHeaderCreate",
    "CustomHeaderRead",
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
    "SendingProfileRead",
    # User Group
    "UserGroup",
    "KeycloakGroupDTO",
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
    "CourseEnrollmentPayload",
    # Learning Module
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
    # Course
    "CourseDifficulty",
    "CourseCreate",
    "CourseUpdate",
    "CoursePatch",
    "CourseOut",
    "PaginatedCourses",
    "UserProgress",
    "AssignmentStatus",
]
