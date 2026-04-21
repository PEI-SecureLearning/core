"""Fluent builder for constructing a ReportSpec."""

from __future__ import annotations

from datetime import datetime

from src.services.reports.spec import ReportSpec, SectionConfig, SectionKind


class ReportBuilder:
  """Fluent API for composing a ReportSpec.

  Usage::

      spec = (
          ReportBuilder(title="Q1 Security Report", realm_name="acme")
          .add_risk_report()
          .add_global_stats()
          .add_campaign_stats(campaign_ids=[1, 2, 3])
          .add_compliance()
          .build()
      )
  """

  def __init__(self, title: str, realm_name: str) -> None:
    self._title = title
    self._realm_name = realm_name
    self._sections: list[SectionConfig] = []

  # ------------------------------------------------------------------
  # Section registration helpers
  # ------------------------------------------------------------------

  def add_risk_report(self) -> ReportBuilder:
    """Append a risk overview section (K/S/E components + overall score)."""
    self._sections.append(SectionConfig(kind=SectionKind.RISK))
    return self

  def add_global_stats(self) -> ReportBuilder:
    """Append a global campaign statistics section."""
    self._sections.append(SectionConfig(kind=SectionKind.GLOBAL_STATS))
    return self

  def add_campaign_stats(self, campaign_ids: list[int]) -> ReportBuilder:
    """Append a per-campaign statistics section for the given campaign IDs."""
    self._sections.append(
      SectionConfig(kind=SectionKind.CAMPAIGN_STATS, campaign_ids=campaign_ids)
    )
    return self

  def add_compliance(self) -> ReportBuilder:
    """Append a compliance quiz summary section (avg score + avg attempts)."""
    self._sections.append(SectionConfig(kind=SectionKind.COMPLIANCE))
    return self

  def add_executive_summary(self) -> ReportBuilder:
    """Append an executive summary section (posture badge, key findings, actions)."""
    self._sections.append(SectionConfig(kind=SectionKind.EXECUTIVE_SUMMARY))
    return self

  def add_risk_outlook(self) -> ReportBuilder:
    """Append a board-level risk outlook section (plain language, human framing)."""
    self._sections.append(SectionConfig(kind=SectionKind.RISK_OUTLOOK))
    return self

  def add_operations_outlook(self, campaign_ids: list[int] | None = None) -> ReportBuilder:
    """Append an operations outlook section (campaign detail + compliance for IT teams)."""
    self._sections.append(
      SectionConfig(kind=SectionKind.OPERATIONS_OUTLOOK, campaign_ids=campaign_ids or [])
    )
    return self

  # ------------------------------------------------------------------
  # Build
  # ------------------------------------------------------------------

  def build(self) -> ReportSpec:
    """Produce an immutable ReportSpec from the current configuration."""
    return ReportSpec(
      title=self._title,
      realm_name=self._realm_name,
      generated_at=datetime.now(),
      sections=tuple(self._sections),
    )
