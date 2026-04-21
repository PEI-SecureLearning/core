"""Security Awareness Score section — renders K/S/E components and overall score."""

from __future__ import annotations

from src.services.reports.context import DataContext, RiskMetrics
from src.services.reports.sections._html import (
  callout,
  empty_state,
  subsection,
  table,
)
from src.services.reports.sections.base import ReportSection
from src.services.reports.spec import SectionConfig


class RiskReportSection(ReportSection):
  """Renders the security awareness score section.

  Displays Knowledge (K), Sentiment (S), and Engagement (E) sub-scores,
  derives an overall score, and surfaces repeat clickers and the
  most exposed simulations.
  """

  def render(self, config: SectionConfig, ctx: DataContext) -> str:
    return (
      '<section class="report-section">'
      "<h2>Security Awareness Score</h2>"
      + self._scores_block(ctx.risk_metrics)
      + self._offenders_block(ctx)
      + self._vulnerable_campaigns_block(ctx)
      + "</section>"
    )

  # ------------------------------------------------------------------

  @staticmethod
  def _scores_block(m: RiskMetrics) -> str:
    if not any([m.knowledge_score, m.sentiment_score, m.involvement_score]):
      return subsection(
        "Awareness Scores",
        callout("Awareness scoring is pending data collection. Scores will appear once Knowledge, Sentiment, and Engagement assessments are completed."),
      )
    rows = [
      ["Knowledge Score", f"{m.knowledge_score:.1f}", "Measures how well employees understand security best practices"],
      ["Sentiment Score", f"{m.sentiment_score:.1f}", "Reflects employee attitudes toward security policies"],
      ["Engagement Score", f"{m.involvement_score:.1f}", "Tracks active participation in security activities"],
      [
        "<strong>Overall Score</strong>",
        f"<strong>{m.overall_score:.1f}</strong>",
        "Combined average of the three scores above",
      ],
    ]
    return subsection(
      "Awareness Scores",
      table(["Component", "Score", "What it measures"], rows, num_cols=frozenset({1})),
      callout(
        f"<strong>Overall Risk Level:</strong> {m.risk_level}",
        f"<em>{m.notes}</em>",
      ),
    )

  @staticmethod
  def _offenders_block(ctx: DataContext) -> str:
    if ctx.global_stats is None:
      return subsection("Repeat Clickers", empty_state("No simulation data available."))
    count = len(ctx.global_stats.repeat_offenders)
    if count == 0:
      return subsection("Repeat Clickers", empty_state("No repeat clickers identified in this period."))
    return subsection(
      "Repeat Clickers",
      callout(
        f"<strong>{count} employee{'s' if count != 1 else ''}</strong> clicked on simulated phishing links more than once.",
        "Individual coaching or targeted training is recommended for these employees.",
      ),
    )

  @staticmethod
  def _vulnerable_campaigns_block(ctx: DataContext) -> str:
    if not ctx.campaign_details:
      return subsection("Simulations with Highest Exposure", empty_state("No simulation data available."))
    top = sorted(ctx.campaign_details, key=lambda c: c.phish_rate, reverse=True)[:5]
    rows = [[c.name, f"{c.phish_rate:.1f}%", f"{c.click_rate:.1f}%"] for c in top]
    return subsection(
      "Simulations with Highest Exposure (Top 5)",
      table(["Simulation Name", "Fell for Simulation", "Clicked Link"], rows, num_cols=frozenset({1, 2})),
    )
