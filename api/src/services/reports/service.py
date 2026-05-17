"""ReportService — top-level orchestrator for report generation."""

from __future__ import annotations

from sqlmodel import Session

from src.services.reports.collectors import (
  collect_campaign_stats,
  collect_compliance_metrics,
  collect_global_stats,
  collect_risk_metrics,
)
from src.services.reports.context import DataContext
from src.services.reports.pdf_converter import PdfConverter
from src.services.reports.renderer import ReportRenderer
from src.services.reports.spec import ReportSpec, SectionKind


class ReportService:
  """Orchestrates data collection, Markdown rendering, and PDF conversion.

  Usage::

      from src.services.reports import report_service

      spec = ReportBuilder(...).build()
      pdf_bytes = report_service.generate(spec, session)
      html_str  = report_service.render_html(spec, session)
  """

  def __init__(
    self,
    renderer: ReportRenderer | None = None,
    converter: PdfConverter | None = None,
  ) -> None:
    self._renderer = renderer or ReportRenderer()
    self._converter = converter or PdfConverter()

  def generate(self, spec: ReportSpec, session: Session) -> bytes:
    """Generate a PDF report from the given spec.

    Args:
        spec: Immutable report specification produced by ReportBuilder.
        session: SQLModel sync session (same pattern as all other services).

    Returns:
        PDF file as raw bytes.
    """
    ctx = self._collect(spec, session)
    html = self._renderer.render(spec, ctx)
    return self._converter.convert(html)

  def render_html(self, spec: ReportSpec, session: Session) -> str:
    """Return the HTML document string without converting to PDF.

    Useful for previewing, testing, or future plain-HTML export.
    """
    ctx = self._collect(spec, session)
    return self._renderer.render(spec, ctx)

  # ------------------------------------------------------------------
  # Private
  # ------------------------------------------------------------------

  def _collect(self, spec: ReportSpec, session: Session) -> DataContext:
    """Run all required collectors and assemble a DataContext."""
    kinds = {sc.kind for sc in spec.sections}

    # Gather global stats if any section needs them
    global_stats = (
      collect_global_stats(spec.realm_name, session)
      if SectionKind.GLOBAL_STATS in kinds or SectionKind.RISK in kinds
      else None
    )

    # Gather per-campaign stats only if a CAMPAIGN_STATS section is present
    campaign_details = []
    for section in spec.sections:
      if section.kind == SectionKind.CAMPAIGN_STATS:
        campaign_details = collect_campaign_stats(section.campaign_ids, session)
        break

    # Risk metrics (placeholder impl)
    risk_metrics = (
      collect_risk_metrics(spec.realm_name)
      if SectionKind.RISK in kinds
      else None
    )

    # Compliance metrics
    compliance_metrics = (
      collect_compliance_metrics(spec.realm_name, session)
      if SectionKind.COMPLIANCE in kinds
      else None
    )

    from src.services.reports.context import RiskMetrics  # avoid circular at module level
    return DataContext(
      realm_name=spec.realm_name,
      generated_at=spec.generated_at,
      global_stats=global_stats,
      campaign_details=campaign_details,
      risk_metrics=risk_metrics or RiskMetrics(),
      compliance_metrics=compliance_metrics,
    )
