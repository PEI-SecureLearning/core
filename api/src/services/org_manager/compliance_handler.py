"""Compliance policy and quiz management for org managers."""

from fastapi import HTTPException, UploadFile
from sqlmodel import Session

from src.models.org_manager_schemas import (
    CompliancePolicyResponse,
    ComplianceQuizPayload,
    ComplianceQuizResponse,
    QuizQuestionPayload,
)
from src.services.compliance import (
    ensure_tenant_policy,
    ensure_tenant_quiz,
    pdf_bytes_to_markdown,
    upsert_tenant_policy,
    upsert_tenant_quiz,
)
from src.services.compliance.token_helpers import resolve_user_identifier
from api.src.services.org_manager.validation_handler import (
    validate_question_bank,
    validate_quiz_settings,
)

MAX_POLICY_UPLOAD_BYTES = 5 * 1024 * 1024
ALLOWED_PDF_TYPES = {"application/pdf"}
ALLOWED_MD_TYPES = {"text/markdown", "text/plain"}


def get_compliance_policy(
    session: Session, realm: str
) -> CompliancePolicyResponse:
    record = ensure_tenant_policy(session, realm)
    return CompliancePolicyResponse(
        tenant=realm,
        content_md=record.content_md,
        updated_at=record.updated_at,
        updated_by=record.updated_by,
    )


def update_compliance_policy(
    session: Session, realm: str, content_md: str, token: str
) -> CompliancePolicyResponse:
    content = (content_md or "").strip()
    if not content:
        raise HTTPException(
            status_code=400, detail="Compliance policy Markdown cannot be empty."
        )
    updated_by = resolve_user_identifier(token, realm)
    record = upsert_tenant_policy(
        session, realm, content, updated_by=updated_by, published=True
    )
    return CompliancePolicyResponse(
        tenant=realm,
        content_md=record.content_md,
        updated_at=record.updated_at,
        updated_by=record.updated_by,
    )


async def import_compliance_policy(
    realm: str, file: UploadFile
) -> dict:
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


def get_compliance_quiz(
    session: Session, realm: str
) -> ComplianceQuizResponse:
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


def update_compliance_quiz(
    session: Session, realm: str, payload: ComplianceQuizPayload, token: str
) -> ComplianceQuizResponse:
    question_bank = validate_question_bank(payload.question_bank)
    question_count, passing_score = validate_quiz_settings(
        payload.question_count, payload.passing_score, len(question_bank)
    )
    updated_by = resolve_user_identifier(token, realm)
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
