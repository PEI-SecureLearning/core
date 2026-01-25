"""
Org Manager Router - API endpoints for org manager operations.

These endpoints use the user's access token for Keycloak authorization
instead of the admin service account.
"""

from datetime import datetime

import jwt
from fastapi import APIRouter, HTTPException, Depends, status, File, UploadFile
import csv
import codecs
from pydantic import BaseModel

from src.core.deps import SessionDep
from src.core.security import oauth_2_scheme
from src.core.security import oauth_2_scheme, valid_resource_access
from src.core.deps import SessionDep
from src.services import org_manager as org_manager_service
from src.services.campaign import CampaignService
from src.services.realm import realm_from_token
from src.services.compliance_store import (
    ensure_tenant_policy,
    ensure_tenant_quiz,
    upsert_tenant_policy,
    upsert_tenant_quiz,
)
from src.services.pdf_to_markdown import pdf_bytes_to_markdown
from src.models.email_template import EmailTemplate
from src.models.landing_page_template import LandingPageTemplate
from src.services import templates as template_service

router = APIRouter()

MAX_POLICY_UPLOAD_BYTES = 5 * 1024 * 1024
ALLOWED_PDF_TYPES = {"application/pdf"}
ALLOWED_MD_TYPES = {"text/markdown", "text/plain"}


class UserCreateRequest(BaseModel):
    username: str
    name: str
    email: str
    role: str
    group_id: str | None = None


class GroupCreateRequest(BaseModel):
    name: str


class CompliancePolicyPayload(BaseModel):
    content_md: str


class QuizQuestionPayload(BaseModel):
    id: str
    prompt: str
    options: list[str]
    answer_index: int
    feedback: str


class ComplianceQuizPayload(BaseModel):
    question_bank: list[QuizQuestionPayload]
    question_count: int | None = None
    passing_score: int | None = None


class CompliancePolicyResponse(BaseModel):
    tenant: str
    content_md: str
    updated_at: datetime
    updated_by: str | None = None


class ComplianceQuizResponse(BaseModel):
    tenant: str
    question_bank: list[QuizQuestionPayload]
    question_count: int
    passing_score: int
    updated_at: datetime
    updated_by: str | None = None


def _validate_realm_access(token: str, realm: str) -> None:
    """Validate that the token's realm matches the requested realm."""
    token_realm = realm_from_token(token)
    if token_realm and token_realm != realm:
        raise HTTPException(
            status_code=403,
            detail="Realm mismatch: token realm does not match requested realm.",
        )


def _resolve_user_identifier(token: str) -> str | None:
    try:
        decoded = jwt.decode(
            token, options={"verify_signature": False, "verify_aud": False}
        )
    except Exception:
        return None
    return (
        decoded.get("preferred_username") or decoded.get("email") or decoded.get("sub")
    )


def _validate_question_bank(questions: list[QuizQuestionPayload]) -> list[dict]:
    if not questions:
        raise HTTPException(
            status_code=400, detail="Quiz question bank cannot be empty."
        )
    seen_ids: set[str] = set()
    for question in questions:
        if not question.id.strip():
            raise HTTPException(status_code=400, detail="Question id is required.")
        if question.id in seen_ids:
            raise HTTPException(
                status_code=400, detail=f"Duplicate question id: {question.id}"
            )
        seen_ids.add(question.id)
        if not question.prompt.strip():
            raise HTTPException(
                status_code=400, detail=f"Question '{question.id}' is missing a prompt."
            )
        if len(question.options) < 2:
            raise HTTPException(
                status_code=400,
                detail=f"Question '{question.id}' must have at least two options.",
            )
        if question.answer_index < 0 or question.answer_index >= len(question.options):
            raise HTTPException(
                status_code=400,
                detail=f"Question '{question.id}' has an invalid answer_index.",
            )
        if not question.feedback.strip():
            raise HTTPException(
                status_code=400,
                detail=f"Question '{question.id}' is missing feedback text.",
            )
    return [q.model_dump() for q in questions]


def _quiz_score_options(question_count: int) -> list[int]:
    return sorted({int((i / question_count) * 100) for i in range(question_count + 1)})


def _validate_quiz_settings(
    question_count: int | None, passing_score: int | None, bank_len: int
) -> tuple[int | None, int | None]:
    if question_count is not None and question_count <= 0:
        raise HTTPException(
            status_code=400, detail="Question count must be a positive integer."
        )
    if question_count is not None and question_count > bank_len:
        raise HTTPException(
            status_code=400,
            detail="Question count cannot exceed the number of questions in the bank.",
        )
    if passing_score is not None and not (0 <= passing_score <= 100):
        raise HTTPException(
            status_code=400, detail="Passing score must be between 0 and 100."
        )
    if (
        passing_score is not None
        and question_count is not None
        and passing_score not in _quiz_score_options(question_count)
    ):
        raise HTTPException(
            status_code=400,
            detail="Passing score must match possible quiz outcomes.",
        )
    return question_count, passing_score


# ============ User Endpoints ============


@router.get(
    "/{realm}/users", dependencies=[Depends(valid_resource_access("org_manager", "view"))]
)
def list_users(realm: str, token: str = Depends(oauth_2_scheme)):
    """List users in the realm using the user's token."""
    _validate_realm_access(token, realm)
    return org_manager_service.list_users(realm, token)


@router.post(
    "/{realm}/users", dependencies=[Depends(valid_resource_access("org_manager", "manage"))]
)
def create_user(
    realm: str,
    user: UserCreateRequest,
    session: SessionDep,
    token: str = Depends(oauth_2_scheme),
):
    """Create a user in the realm using the user's token."""
    _validate_realm_access(token, realm)
    return org_manager_service.create_user(
        session,
        realm=realm,
        token=token,
        username=user.username,
        name=user.name,
        email=user.email,
        role=user.role,
        group_id=user.group_id,
    )


@router.delete(
    "/{realm}/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(valid_resource_access("org_manager", "manage"))],
)
def delete_user(
    realm: str, user_id: str, session: SessionDep, token: str = Depends(oauth_2_scheme)
):
    """Delete a user from the realm using the user's token."""
    _validate_realm_access(token, realm)
    org_manager_service.delete_user(realm, token, user_id, session)
    return None


@router.get("/{realm}/campaigns", dependencies=[Depends(valid_resource_access("org_manager" , "view"))])
def list_realm_campaigns(realm: str, session: SessionDep, token: str = Depends(oauth_2_scheme)):
    """List campaigns for the specified realm (org manager scope)."""
    _validate_realm_access(token, realm)
    service = CampaignService()
    campaigns = service.get_campaigns(realm, session)
    return {"campaigns": campaigns}


@router.get(
    "/{realm}/campaigns/{campaign_id}",
    dependencies=[Depends(valid_resource_access("org_manager", "view"))],
)
async def get_realm_campaign_detail(
    realm: str, campaign_id: int, session: SessionDep, token: str = Depends(oauth_2_scheme)
):
    """Get campaign detail including linked templates for the specified realm."""
    _validate_realm_access(token, realm)
    service = CampaignService()
    detail = service.get_campaign_by_id(campaign_id, realm, session)
    if not detail:
        raise HTTPException(status_code=404, detail="Campaign not found")

    email_template = None
    landing_page_template = None

    tmpl = session.get(EmailTemplate, detail.email_template_id) if detail.email_template_id else None
    if tmpl and tmpl.content_link:
        try:
            doc = await template_service.get_template(str(tmpl.content_link))
            email_template = doc.model_dump()  # type: ignore[assignment]
            email_template["content_link"] = tmpl.content_link
        except Exception:
            email_template = None

    ltmpl = session.get(LandingPageTemplate, detail.landing_page_template_id) if detail.landing_page_template_id else None
    if ltmpl and ltmpl.content_link:
        try:
            doc = await template_service.get_template(str(ltmpl.content_link))
            landing_page_template = doc.model_dump()  # type: ignore[assignment]
            landing_page_template["content_link"] = ltmpl.content_link
        except Exception:
            landing_page_template = None

    return {
        "campaign": detail,
        "email_template": email_template,
        "landing_page_template": landing_page_template,
    }


@router.delete(
    "/{realm}/campaigns/{campaign_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(valid_resource_access("org_manager", "manage"))],
)
def delete_realm_campaign(
    realm: str, campaign_id: int, session: SessionDep, token: str = Depends(oauth_2_scheme)
):
    """Delete a campaign from the realm using the user's token."""
    _validate_realm_access(token, realm)
    service = CampaignService()
    service.delete_campaign(campaign_id, realm, session)
    return None


@router.post("/upload", dependencies=[Depends(valid_resource_access("org_manager", "manage"))])
def upload_user_csv(file: UploadFile = File(...)):
    """Upload CSV with user data; accessible to org managers (and admins via policy)."""
    reader = csv.DictReader(codecs.iterdecode(file.file, "utf-8"))
    data = [row for row in reader]
    file.file.close()
    return data


# ============ Group Endpoints ============


@router.get(
    "/{realm}/groups", dependencies=[Depends(valid_resource_access("org_manager", "view"))]
)
def list_groups(realm: str, token: str = Depends(oauth_2_scheme)):
    """List groups in the realm using the user's token."""
    _validate_realm_access(token, realm)
    return org_manager_service.list_groups(realm, token)


@router.post(
    "/{realm}/groups",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(valid_resource_access("org_manager", "manage"))],
)
def create_group(
    realm: str,
    group: GroupCreateRequest,
    session: SessionDep,
    token: str = Depends(oauth_2_scheme),
):
    """Create a group in the realm using the user's token."""
    _validate_realm_access(token, realm)
    return org_manager_service.create_group(session, realm, token, group.name)


@router.delete(
    "/{realm}/groups/{group_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(valid_resource_access("org_manager", "manage"))],
)
def delete_group(
    realm: str, group_id: str, session: SessionDep, token: str = Depends(oauth_2_scheme)
):
    """Delete a group from the realm using the user's token."""
    _validate_realm_access(token, realm)
    org_manager_service.delete_group(session, realm, token, group_id)
    return None


@router.put(
    "/{realm}/groups/{group_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(valid_resource_access("org_manager", "manage"))],
)
def update_group(
    realm: str,
    group_id: str,
    group: GroupCreateRequest,
    token: str = Depends(oauth_2_scheme),
):
    """Update a group in the realm using the user's token."""
    _validate_realm_access(token, realm)
    org_manager_service.update_group(realm, token, group_id, group.name)
    return None


# ============ Group Membership Endpoints ============


@router.post(
    "/{realm}/groups/{group_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(valid_resource_access("org_manager", "manage"))],
)
def add_user_to_group(
    realm: str, group_id: str, user_id: str, token: str = Depends(oauth_2_scheme)
):
    """Add a user to a group using the user's token."""
    _validate_realm_access(token, realm)
    org_manager_service.add_user_to_group(realm, token, user_id, group_id)
    return None


@router.get(
    "/{realm}/groups/{group_id}/members",
    dependencies=[Depends(valid_resource_access("org_manager", "view"))],
)
def list_group_members(realm: str, group_id: str, token: str = Depends(oauth_2_scheme)):
    """List members of a group using the user's token."""
    _validate_realm_access(token, realm)
    return org_manager_service.list_group_members(realm, token, group_id)


@router.delete(
    "/{realm}/groups/{group_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_user_from_group(
    realm: str, group_id: str, user_id: str, token: str = Depends(oauth_2_scheme)
):
    """Remove a user from a group using the user's token."""
    _validate_realm_access(token, realm)
    org_manager_service.remove_user_from_group(realm, token, user_id, group_id)
    return None


# ============ Compliance (Tenant) Endpoints ============


@router.get(
    "/{realm}/compliance/policy",
    response_model=CompliancePolicyResponse,
    dependencies=[Depends(valid_resource_access("org_manager", "manage"))],
)
def get_compliance_policy(
    realm: str, session: SessionDep, token: str = Depends(oauth_2_scheme)
):
    _validate_realm_access(token, realm)
    record = ensure_tenant_policy(session, realm)
    return CompliancePolicyResponse(
        tenant=realm,
        content_md=record.content_md,
        updated_at=record.updated_at,
        updated_by=record.updated_by,
    )


@router.put(
    "/{realm}/compliance/policy",
    response_model=CompliancePolicyResponse,
    dependencies=[Depends(valid_resource_access("org_manager", "manage"))],
)
def update_compliance_policy(
    realm: str,
    payload: CompliancePolicyPayload,
    session: SessionDep,
    token: str = Depends(oauth_2_scheme),
):
    _validate_realm_access(token, realm)
    content = (payload.content_md or "").strip()
    if not content:
        raise HTTPException(
            status_code=400, detail="Compliance policy Markdown cannot be empty."
        )
    updated_by = _resolve_user_identifier(token)
    record = upsert_tenant_policy(
        session, realm, content, updated_by=updated_by, published=True
    )
    return CompliancePolicyResponse(
        tenant=realm,
        content_md=record.content_md,
        updated_at=record.updated_at,
        updated_by=record.updated_by,
    )


@router.post(
    "/{realm}/compliance/policy/import",
    dependencies=[Depends(valid_resource_access("org_manager", "manage"))],
)
async def import_compliance_policy(
    realm: str,
    file: UploadFile = File(...),
    token: str = Depends(oauth_2_scheme),
):
    _validate_realm_access(token, realm)
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(data) > MAX_POLICY_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds 5MB limit.")

    filename = file.filename.lower()
    content_type = (file.content_type or "").lower()

    if filename.endswith((".md", ".markdown")) or content_type in ALLOWED_MD_TYPES:
        try:
            content_md = data.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise HTTPException(
                status_code=400, detail="Markdown file must be UTF-8 encoded."
            ) from exc
    elif filename.endswith(".pdf") or content_type in ALLOWED_PDF_TYPES:
        try:
            content_md = pdf_bytes_to_markdown(data)
        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail="Unable to extract text from PDF.",
            ) from exc
    else:
        raise HTTPException(
            status_code=400, detail="Unsupported file type. Upload PDF or Markdown."
        )

    if not content_md.strip():
        raise HTTPException(
            status_code=400, detail="Uploaded file has no usable text."
        )

    return {"content_md": content_md}


@router.get(
    "/{realm}/compliance/quiz",
    response_model=ComplianceQuizResponse,
    dependencies=[Depends(valid_resource_access("org_manager", "manage"))],
)
def get_compliance_quiz(
    realm: str, session: SessionDep, token: str = Depends(oauth_2_scheme)
):
    _validate_realm_access(token, realm)
    record = ensure_tenant_quiz(session, realm)
    question_bank = [
        QuizQuestionPayload(**q) for q in (record.question_bank or [])
    ]
    return ComplianceQuizResponse(
        tenant=realm,
        question_bank=question_bank,
        question_count=record.question_count,
        passing_score=record.passing_score,
        updated_at=record.updated_at,
        updated_by=record.updated_by,
    )


@router.put(
    "/{realm}/compliance/quiz",
    response_model=ComplianceQuizResponse,
    dependencies=[Depends(valid_resource_access("org_manager", "manage"))],
)
def update_compliance_quiz(
    realm: str,
    payload: ComplianceQuizPayload,
    session: SessionDep,
    token: str = Depends(oauth_2_scheme),
):
    _validate_realm_access(token, realm)
    question_bank = _validate_question_bank(payload.question_bank)
    question_count, passing_score = _validate_quiz_settings(
        payload.question_count, payload.passing_score, len(question_bank)
    )
    updated_by = _resolve_user_identifier(token)
    record = upsert_tenant_quiz(
        session,
        realm,
        question_bank,
        question_count=question_count,
        passing_score=passing_score,
        updated_by=updated_by,
    )
    question_bank_payload = [
        QuizQuestionPayload(**q) for q in (record.question_bank or [])
    ]
    return ComplianceQuizResponse(
        tenant=realm,
        question_bank=question_bank_payload,
        question_count=record.question_count,
        passing_score=record.passing_score,
        updated_at=record.updated_at,
        updated_by=record.updated_by,
    )
