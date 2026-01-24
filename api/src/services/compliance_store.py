from datetime import datetime

from sqlmodel import Session, select

from src.models import TenantCompliancePolicy, TenantComplianceQuiz
from src.services.compliance_defaults import (
    DEFAULT_PASSING_SCORE,
    DEFAULT_QUESTION_COUNT,
    DEFAULT_QUESTION_BANK,
    read_default_policy_markdown,
)


def ensure_tenant_policy(session: Session, tenant: str) -> TenantCompliancePolicy:
    stmt = select(TenantCompliancePolicy).where(TenantCompliancePolicy.tenant == tenant)
    record = session.exec(stmt).first()
    if record:
        return record

    record = TenantCompliancePolicy(tenant=tenant, content_md=read_default_policy_markdown())
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def ensure_tenant_quiz(session: Session, tenant: str) -> TenantComplianceQuiz:
    stmt = select(TenantComplianceQuiz).where(TenantComplianceQuiz.tenant == tenant)
    record = session.exec(stmt).first()
    if record:
        if record.question_count is None or record.question_count <= 0:
            record.question_count = DEFAULT_QUESTION_COUNT
        if record.passing_score is None or record.passing_score < 0 or record.passing_score > 100:
            record.passing_score = DEFAULT_PASSING_SCORE
        session.add(record)
        session.commit()
        return record

    record = TenantComplianceQuiz(
        tenant=tenant,
        question_bank=DEFAULT_QUESTION_BANK,
        question_count=DEFAULT_QUESTION_COUNT,
        passing_score=DEFAULT_PASSING_SCORE,
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def upsert_tenant_policy(
    session: Session,
    tenant: str,
    content_md: str,
    updated_by: str | None = None,
    published: bool = True,
) -> TenantCompliancePolicy:
    stmt = select(TenantCompliancePolicy).where(TenantCompliancePolicy.tenant == tenant)
    record = session.exec(stmt).first()
    now = datetime.utcnow()
    if record:
        record.content_md = content_md
        record.updated_at = now
        record.updated_by = updated_by
        record.published = published
    else:
        record = TenantCompliancePolicy(
            tenant=tenant,
            content_md=content_md,
            updated_at=now,
            updated_by=updated_by,
            published=published,
        )
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def upsert_tenant_quiz(
    session: Session,
    tenant: str,
    question_bank: list[dict],
    question_count: int | None = None,
    passing_score: int | None = None,
    updated_by: str | None = None,
) -> TenantComplianceQuiz:
    stmt = select(TenantComplianceQuiz).where(TenantComplianceQuiz.tenant == tenant)
    record = session.exec(stmt).first()
    now = datetime.utcnow()
    if record:
        record.question_bank = question_bank
        if question_count is not None:
            record.question_count = question_count
        if passing_score is not None:
            record.passing_score = passing_score
        record.updated_at = now
        record.updated_by = updated_by
    else:
        record = TenantComplianceQuiz(
            tenant=tenant,
            question_bank=question_bank,
            question_count=question_count or DEFAULT_QUESTION_COUNT,
            passing_score=passing_score or DEFAULT_PASSING_SCORE,
            updated_at=now,
            updated_by=updated_by,
        )
    session.add(record)
    session.commit()
    session.refresh(record)
    return record
