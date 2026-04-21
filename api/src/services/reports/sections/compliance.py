"""Security training completion section."""

from __future__ import annotations

from src.services.reports.context import ComplianceMetrics, DataContext
from src.services.reports.sections._html import (
  callout,
  empty_state,
  subsection,
  table,
)
from src.services.reports.sections.base import ReportSection
from src.services.reports.spec import SectionConfig


class ComplianceSection(ReportSection):
  """Renders security training completion statistics for the realm.

  Highlights:
  - Overall completion rate (users who passed vs total)
  - Training gap (employees still outstanding)
  - Average quiz score across all acceptances
  - Average number of attempts before passing
  """

  def render(self, config: SectionConfig, ctx: DataContext) -> str:
    if ctx.compliance_metrics is None:
      return (
        '<section class="report-section">'
        "<h2>Security Training Completion</h2>"
        + empty_state("No training data available.")
        + "</section>"
      )
    m = ctx.compliance_metrics
    return (
      '<section class="report-section">'
      "<h2>Security Training Completion</h2>"
      + self._overview(m)
      + self._quiz_performance(m)
      + "</section>"
    )

  # ------------------------------------------------------------------

  @staticmethod
  def _overview(m: ComplianceMetrics) -> str:
    non_compliant = m.total_users - m.compliant_users
    rows = [
      ["Total employees", str(m.total_users)],
      ["Completed training", str(m.compliant_users)],
      ["Yet to complete", str(non_compliant)],
      ["Completion rate", f"{m.compliance_rate:.1f}%"],
    ]
    gap_callout = (
      callout(
        f"<strong>{non_compliant} employee{'s' if non_compliant != 1 else ''}</strong> still need to complete mandatory security training.",
        "Follow up with managers to ensure outstanding employees complete training promptly.",
      )
      if non_compliant > 0
      else callout("All employees have completed mandatory security training. Well done.")
    )
    return subsection(
      "Completion Overview",
      table(["Metric", "Value"], rows, num_cols=frozenset({1})),
      gap_callout,
    )

  @staticmethod
  def _quiz_performance(m: ComplianceMetrics) -> str:
    rows = [
      ["Average quiz score", f"{m.avg_score:.1f}%"],
      ["Avg. quiz attempts before passing", f"{m.avg_attempts_to_pass:.1f}"],
    ]
    return subsection("Quiz Performance", table(["Metric", "Value"], rows, num_cols=frozenset({1})))
