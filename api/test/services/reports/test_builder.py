"""Tests for ReportBuilder."""

from __future__ import annotations

import pytest

from src.services.reports.builder import ReportBuilder
from src.services.reports.spec import SectionKind


class TestReportBuilder:
  def test_build_returns_spec_with_correct_title(self):
    spec = ReportBuilder(title="My Report", realm_name="test").build()
    assert spec.title == "My Report"

  def test_build_returns_spec_with_correct_realm(self):
    spec = ReportBuilder(title="R", realm_name="acme").build()
    assert spec.realm_name == "acme"

  def test_adds_risk_section(self):
    spec = ReportBuilder("R", "t").add_risk_report().build()
    assert len(spec.sections) == 1
    assert spec.sections[0].kind == SectionKind.RISK

  def test_adds_global_stats_section(self):
    spec = ReportBuilder("R", "t").add_global_stats().build()
    assert spec.sections[0].kind == SectionKind.GLOBAL_STATS

  def test_adds_campaign_stats_section_with_ids(self):
    spec = ReportBuilder("R", "t").add_campaign_stats(campaign_ids=[1, 2]).build()
    assert spec.sections[0].kind == SectionKind.CAMPAIGN_STATS
    assert spec.sections[0].campaign_ids == [1, 2]

  def test_adds_compliance_section(self):
    spec = ReportBuilder("R", "t").add_compliance().build()
    assert spec.sections[0].kind == SectionKind.COMPLIANCE

  def test_section_order_preserved(self):
    spec = (
      ReportBuilder("R", "t")
      .add_risk_report()
      .add_global_stats()
      .add_campaign_stats([])
      .add_compliance()
      .build()
    )
    kinds = [s.kind for s in spec.sections]
    assert kinds == [
      SectionKind.RISK,
      SectionKind.GLOBAL_STATS,
      SectionKind.CAMPAIGN_STATS,
      SectionKind.COMPLIANCE,
    ]

  def test_build_produces_immutable_spec(self):
    spec = ReportBuilder("R", "t").add_risk_report().build()
    with pytest.raises(Exception):
      spec.title = "mutated"  # type: ignore[misc]

  def test_chaining_returns_builder(self):
    builder = ReportBuilder("R", "t")
    result = builder.add_risk_report()
    assert result is builder

  def test_empty_spec_has_no_sections(self):
    spec = ReportBuilder("R", "t").build()
    assert len(spec.sections) == 0

  def test_generated_at_is_set(self):
    spec = ReportBuilder("R", "t").build()
    assert spec.generated_at is not None

  def test_adds_executive_summary_section(self):
    spec = ReportBuilder("R", "t").add_executive_summary().build()
    assert spec.sections[0].kind == SectionKind.EXECUTIVE_SUMMARY

  def test_adds_risk_outlook_section(self):
    spec = ReportBuilder("R", "t").add_risk_outlook().build()
    assert spec.sections[0].kind == SectionKind.RISK_OUTLOOK

  def test_adds_operations_outlook_section_with_ids(self):
    spec = ReportBuilder("R", "t").add_operations_outlook(campaign_ids=[1, 2]).build()
    assert spec.sections[0].kind == SectionKind.OPERATIONS_OUTLOOK
    assert spec.sections[0].campaign_ids == [1, 2]

  def test_adds_operations_outlook_section_no_ids(self):
    spec = ReportBuilder("R", "t").add_operations_outlook().build()
    assert spec.sections[0].kind == SectionKind.OPERATIONS_OUTLOOK
    assert spec.sections[0].campaign_ids == []

  def test_executive_layout_order_preserved(self):
    spec = (
      ReportBuilder("R", "t")
      .add_executive_summary()
      .add_risk_outlook()
      .add_operations_outlook(campaign_ids=[1])
      .build()
    )
    kinds = [s.kind for s in spec.sections]
    assert kinds == [
      SectionKind.EXECUTIVE_SUMMARY,
      SectionKind.RISK_OUTLOOK,
      SectionKind.OPERATIONS_OUTLOOK,
    ]
