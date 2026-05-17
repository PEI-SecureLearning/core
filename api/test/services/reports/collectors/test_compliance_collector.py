"""Tests for the compliance metrics collector."""

from __future__ import annotations

from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest

from src.services.reports.collectors.compliance import collect_compliance_metrics
from src.services.reports.context import ComplianceMetrics


def _make_record(user_id: str, score: int = 85):
  rec = MagicMock()
  rec.user_identifier = user_id
  rec.score = score
  return rec


class TestComplianceCollector:
  def test_returns_compliance_metrics(self):
    session = MagicMock()
    session.exec.return_value.all.return_value = []
    result = collect_compliance_metrics("acme", session)
    assert isinstance(result, ComplianceMetrics)

  def test_empty_records_returns_zero_metrics(self):
    session = MagicMock()
    session.exec.return_value.all.return_value = []
    result = collect_compliance_metrics("acme", session)
    assert result.total_users == 0
    assert result.compliance_rate == 0.0
    assert result.avg_score == 0.0

  def test_calculates_compliant_users(self):
    records = [_make_record("u1", score=80), _make_record("u2", score=0)]
    session = MagicMock()
    session.exec.return_value.all.return_value = records
    result = collect_compliance_metrics("acme", session)
    assert result.total_users == 2
    assert result.compliant_users == 1

  def test_calculates_compliance_rate(self):
    records = [_make_record("u1", 80), _make_record("u2", 90)]
    session = MagicMock()
    session.exec.return_value.all.return_value = records
    result = collect_compliance_metrics("acme", session)
    assert result.compliance_rate == 100.0

  def test_calculates_avg_score(self):
    records = [_make_record("u1", 80), _make_record("u2", 100)]
    session = MagicMock()
    session.exec.return_value.all.return_value = records
    result = collect_compliance_metrics("acme", session)
    assert result.avg_score == 90.0

  def test_calculates_avg_attempts_single_per_user(self):
    records = [_make_record("u1"), _make_record("u2")]
    session = MagicMock()
    session.exec.return_value.all.return_value = records
    result = collect_compliance_metrics("acme", session)
    assert result.avg_attempts_to_pass == 1.0

  def test_calculates_avg_attempts_multiple_per_user(self):
    # u1 appears 3 times (3 attempts), u2 appears once
    records = [
      _make_record("u1"), _make_record("u1"), _make_record("u1"),
      _make_record("u2"),
    ]
    session = MagicMock()
    session.exec.return_value.all.return_value = records
    result = collect_compliance_metrics("acme", session)
    # mean([3, 1]) = 2.0
    assert result.avg_attempts_to_pass == 2.0

  def test_total_users_counts_unique_identifiers(self):
    records = [_make_record("u1"), _make_record("u1"), _make_record("u2")]
    session = MagicMock()
    session.exec.return_value.all.return_value = records
    result = collect_compliance_metrics("acme", session)
    assert result.total_users == 2
