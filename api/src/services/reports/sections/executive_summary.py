"""Executive summary section — single-page at-a-glance overview for leadership."""

from __future__ import annotations

from src.services.reports.context import DataContext
from src.services.reports.sections._html import badge, callout, meta_line, stat_row, subsection
from src.services.reports.sections.base import ReportSection
from src.services.reports.spec import SectionConfig


def _posture(phish_rate: float, compliance_rate: float) -> tuple[str, str]:
  """Return (label, badge_level) based on phish + compliance thresholds."""
  if phish_rate < 5 and compliance_rate >= 85:
    return "Strong", "green"
  if phish_rate < 10 and compliance_rate >= 70:
    return "Improving", "amber"
  return "Needs Attention", "red"


class ExecutiveSummarySection(ReportSection):
  """Single-page executive overview — posture, key findings, and recommended actions."""

  def render(self, config: SectionConfig, ctx: DataContext) -> str:
    return (
      '<section class="report-section">'
      "<h2>Executive Summary</h2>"
      + self._snapshot(ctx)
      + self._findings(ctx)
      + self._recommendations(ctx)
      + "</section>"
    )

  # ------------------------------------------------------------------

  @staticmethod
  def _snapshot(ctx: DataContext) -> str:
    s = ctx.global_stats
    m = ctx.compliance_metrics

    phish_rate = s.phish_rate if s else 0.0
    compliance_rate = m.compliance_rate if m else 0.0
    total_targeted = s.unique_users_targeted if s else 0
    users_phished = s.users_who_phished if s else 0
    compliant = m.compliant_users if m else 0
    total_users = m.total_users if m else 0
    posture_label, posture_level = _posture(phish_rate, compliance_rate)

    period = ctx.generated_at.strftime("%B %Y")
    cards = stat_row(
      [
        ("Employees Targeted", str(total_targeted), None),
        ("Fell for Simulation", f"{phish_rate:.1f}%", f"{users_phished} employees"),
        ("Training Completion", f"{compliance_rate:.1f}%", f"{compliant} of {total_users} completed"),
        ("Overall Posture", badge(posture_label, posture_level), None),
      ],
      danger=frozenset({1}),
      accent=frozenset({2, 3}),
    )
    return subsection("At a Glance", meta_line(f"Period:{period}", f"Organisation:{ctx.realm_name}") + cards)

  @staticmethod
  def _findings(ctx: DataContext) -> str:
    s = ctx.global_stats
    m = ctx.compliance_metrics
    items: list[str] = []

    if s:
      targeted = s.unique_users_targeted or 1
      clicked = s.users_who_clicked
      ratio = round(targeted / clicked) if clicked else 0
      if clicked and ratio > 1:
        benchmark = 12
        comparison = (
          "above the industry benchmark of 1 in 12"
          if ratio < benchmark
          else "in line with or better than the industry benchmark of 1 in 12"
        )
        items.append(f"1 in {ratio} employees clicked a link in a simulated phishing email — {comparison}.")
      elif not clicked:
        items.append("No employees clicked a link in any simulated phishing email this period.")

      repeat_count = len(s.repeat_offenders)
      if repeat_count > 0:
        items.append(
          f"{repeat_count} employee{'s' if repeat_count != 1 else ''} clicked on simulated phishing links more than once, indicating a need for targeted follow-up."
        )

    if m:
      non_compliant = m.total_users - m.compliant_users
      if non_compliant > 0:
        items.append(
          f"{m.compliant_users} of {m.total_users} employees ({m.compliance_rate:.0f}%) have completed mandatory security training — "
          f"{non_compliant} still outstanding."
        )
      else:
        items.append(f"All {m.total_users} employees have completed mandatory security training.")

    if not items:
      items.append("Insufficient data to generate findings for this period.")

    bullets = "".join(f"<li>{item}</li>" for item in items)
    return subsection("Key Findings", f"<ul>{bullets}</ul>")

  @staticmethod
  def _recommendations(ctx: DataContext) -> str:
    s = ctx.global_stats
    m = ctx.compliance_metrics
    items: list[str] = []

    phish_rate = s.phish_rate if s else 0.0
    compliance_rate = m.compliance_rate if m else 100.0
    repeat_count = len(s.repeat_offenders) if s else 0

    if phish_rate > 10:
      items.append(
        "<strong>Priority — Reduce phishing exposure:</strong> Roll out a targeted refresher campaign focused on email recognition. "
        "Consider simulating more advanced scenarios for high-risk departments."
      )
    if repeat_count > 0:
      items.append(
        f"<strong>Targeted coaching:</strong> The {repeat_count} employee{'s' if repeat_count != 1 else ''} flagged as repeat clickers "
        "would benefit from one-on-one security coaching or an accelerated training module."
      )
    if compliance_rate < 70:
      non_compliant = (m.total_users - m.compliant_users) if m else 0
      items.append(
        f"<strong>Close the training gap:</strong> {non_compliant} employees have not completed mandatory training. "
        "Escalate to line managers and set a firm completion deadline."
      )

    if not items:
      items.append(
        "<strong>Maintain momentum:</strong> Security posture is strong. Continue running regular simulations and "
        "refresher training to keep awareness levels high."
      )

    content = "".join(callout(item) for item in items)
    return subsection("Recommended Actions", content)
