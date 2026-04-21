"""Compliance collector — aggregates quiz acceptance records for the realm."""

from __future__ import annotations

from collections import defaultdict

from sqlmodel import Session, select

from src.models import ComplianceAcceptance
from src.services.reports.context import ComplianceMetrics


def collect_compliance_metrics(realm_name: str, session: Session) -> ComplianceMetrics:
  """Compute compliance statistics from ComplianceAcceptance records.

  Derives:
  - compliance_rate: users with at least one accepted record / unique users seen
  - avg_score: mean score across all acceptance records
  - avg_attempts_to_pass: mean number of attempts a user needed before their
    first accepted record (approximated from record count per user)
  """
  records = session.exec(
    select(ComplianceAcceptance).where(ComplianceAcceptance.tenant == realm_name)
  ).all()

  if not records:
    return ComplianceMetrics()

  # Group records by user
  by_user: dict[str, list[ComplianceAcceptance]] = defaultdict(list)
  for rec in records:
    by_user[rec.user_identifier].append(rec)

  total_users = len(by_user)
  # A user is "compliant" if they have at least one passing record (score > 0)
  compliant_users = sum(
    1 for user_records in by_user.values() if any(r.score > 0 for r in user_records)
  )
  compliance_rate = round(compliant_users / total_users * 100, 2) if total_users else 0.0

  all_scores = [r.score for r in records]
  avg_score = round(sum(all_scores) / len(all_scores), 2) if all_scores else 0.0

  # Approximate attempts per user as the number of records they have
  attempts_per_user = [len(user_records) for user_records in by_user.values()]
  avg_attempts = (
    round(sum(attempts_per_user) / len(attempts_per_user), 2) if attempts_per_user else 0.0
  )

  return ComplianceMetrics(
    total_users=total_users,
    compliant_users=compliant_users,
    compliance_rate=compliance_rate,
    avg_score=avg_score,
    avg_attempts_to_pass=avg_attempts,
  )
