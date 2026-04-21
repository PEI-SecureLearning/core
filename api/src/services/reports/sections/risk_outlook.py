"""Risk Outlook section — in-depth risk analysis for board and security leadership."""

from __future__ import annotations

from src.services.reports.context import DataContext, RiskMetrics
from src.services.reports.sections._html import (
  badge,
  callout,
  empty_state,
  fmt_seconds,
  stat_row,
  subsection,
  table,
)
from src.services.reports.sections.base import ReportSection
from src.services.reports.spec import SectionConfig

_INDUSTRY_CLICK_BENCHMARK = 12  # 1-in-N benchmark (Proofpoint State of the Phish 2024)


class RiskOutlookSection(ReportSection):
  """Deep risk analysis — phishing exposure, speed of compromise, K/S/E awareness, risk signals."""

  def render(self, config: SectionConfig, ctx: DataContext) -> str:
    return (
      '<section class="report-section">'
      "<h2>Risk Outlook</h2>"
      + self._exposure_block(ctx)
      + self._speed_block(ctx)
      + self._campaign_risk_breakdown(ctx)
      + self._scores_block(ctx.risk_metrics)
      + self._repeat_clickers_block(ctx)
      + self._risk_signals_block(ctx)
      + "</section>"
    )

  # ------------------------------------------------------------------

  @staticmethod
  def _exposure_block(ctx: DataContext) -> str:
    s = ctx.global_stats
    if s is None:
      return subsection("Phishing Exposure", empty_state("No simulation data available for this period."))

    actual_targeted = s.unique_users_targeted
    targeted_for_ratio = actual_targeted or 1
    clicked = s.users_who_clicked
    phished = s.users_who_phished
    ratio = round(targeted_for_ratio / clicked) if clicked else 0

    click_sub = f"{clicked / targeted_for_ratio * 100:.1f}% of targeted" if actual_targeted else None
    cards = stat_row(
      [
        ("Employees Targeted", str(actual_targeted), None),
        ("Clicked Link", str(clicked), click_sub),
        ("Fell for Simulation", str(phished), f"{s.phish_rate:.1f}% of sent"),
        ("Avg. Time to Click", fmt_seconds(s.avg_time_to_click_seconds), "from delivery"),
      ],
      danger=frozenset({2}),
    )

    if not clicked:
      narrative = "No employees clicked a link in any simulated phishing email this period. Excellent result."
    elif ratio >= _INDUSTRY_CLICK_BENCHMARK:
      narrative = (
        f"1 in {ratio} employees clicked a link in a simulated phishing email — "
        f"in line with or better than the industry benchmark of 1 in {_INDUSTRY_CLICK_BENCHMARK}."
      )
    else:
      narrative = (
        f"1 in {ratio} employees clicked a link in a simulated phishing email. "
        f"The industry benchmark is 1 in {_INDUSTRY_CLICK_BENCHMARK} — your organisation is above average risk."
      )

    lines = [narrative]
    if phished:
      lines.append(
        f"Of those who clicked, {phished} went further and submitted credentials or took a harmful action."
      )

    return subsection("Phishing Exposure", cards + callout(*lines))

  @staticmethod
  def _speed_block(ctx: DataContext) -> str:
    s = ctx.global_stats
    if s is None or s.avg_time_to_click_seconds is None:
      return ""

    avg = s.avg_time_to_click_seconds
    avg_str = fmt_seconds(avg)

    if avg < 60:
      interpretation = (
        f"Employees who clicked did so within <strong>{avg_str}</strong> on average — under 1 minute. "
        "This indicates <strong>reflexive, uncritical behavior</strong>: emails were acted on without "
        "checking the sender or destination link. Highest-risk response profile."
      )
      risk_label, risk_level = "Critical", "red"
    elif avg < 300:
      interpretation = (
        f"Employees who clicked did so within <strong>{avg_str}</strong> on average. "
        "Responses under 5 minutes suggest <strong>limited scrutiny</strong> before acting. "
        "Training should reinforce the 'pause and verify' habit before clicking any link."
      )
      risk_label, risk_level = "Elevated", "amber"
    else:
      interpretation = (
        f"Employees who clicked did so after <strong>{avg_str}</strong> on average. "
        "Longer response times indicate <strong>some consideration</strong> before acting — "
        "a positive signal, though susceptibility remains. Continue reinforcing verification steps."
      )
      risk_label, risk_level = "Moderate", "amber"

    return subsection(
      "Speed of Compromise",
      callout(interpretation, f"Response risk level: {badge(risk_label, risk_level)}"),
    )

  @staticmethod
  def _campaign_risk_breakdown(ctx: DataContext) -> str:
    if not ctx.campaign_details:
      return ""
    ranked = sorted(ctx.campaign_details, key=lambda c: c.phish_rate, reverse=True)[:5]
    rows = [
      [
        c.name,
        str(c.total_recipients),
        f"{c.phish_rate:.1f}%",
        f"{c.click_rate:.1f}%",
        fmt_seconds(c.avg_time_to_click_seconds),
      ]
      for c in ranked
    ]
    return subsection(
      "Simulation Risk Breakdown",
      table(
        ["Simulation", "Recipients", "Fell for Sim.", "Clicked", "Avg. Click Time"],
        rows,
        num_cols=frozenset({1, 2, 3}),
      ),
    )

  @staticmethod
  def _scores_block(m: RiskMetrics) -> str:
    if not any([m.knowledge_score, m.sentiment_score, m.involvement_score]):
      desc_rows = [
        ["Knowledge", "Security threat awareness and recognition of best practices"],
        ["Sentiment", "Employee attitudes and confidence around security policies"],
        ["Engagement", "Active participation in security activities and training"],
      ]
      return subsection(
        "Awareness Assessment",
        callout(
          "Awareness scoring is pending for this period. "
          "Scores will populate as K/S/E assessment data is collected."
        ),
        table(["Score", "Measures"], desc_rows),
      )

    cards = stat_row(
      [
        ("Knowledge", f"{m.knowledge_score:.1f} / 100", "Threat awareness"),
        ("Sentiment", f"{m.sentiment_score:.1f} / 100", "Security attitudes"),
        ("Engagement", f"{m.involvement_score:.1f} / 100", "Active participation"),
        ("Overall", f"{m.overall_score:.1f} / 100", "Combined average"),
      ],
      accent=frozenset({3}),
    )
    return subsection(
      "Awareness Assessment",
      cards,
      callout(f"<strong>Current risk level:</strong> {m.risk_level}", f"<em>{m.notes}</em>"),
    )

  @staticmethod
  def _repeat_clickers_block(ctx: DataContext) -> str:
    if ctx.global_stats is None:
      return ""
    count = len(ctx.global_stats.repeat_offenders)
    if count == 0:
      return subsection(
        "Repeat Clickers",
        callout("No employees were caught clicking on simulated phishing links more than once this period."),
      )
    return subsection(
      "Repeat Clickers",
      callout(
        f"<strong>{count} employee{'s' if count != 1 else ''}</strong> clicked on simulated phishing links more than once.",
        "Repeat clickers represent the highest-risk individuals. One-on-one coaching or an accelerated training module is recommended.",
      ),
    )

  @staticmethod
  def _risk_signals_block(ctx: DataContext) -> str:
    s = ctx.global_stats
    m = ctx.compliance_metrics

    phish_rate = s.phish_rate if s else 0.0
    compliance_rate = m.compliance_rate if m else 100.0
    repeat_count = len(s.repeat_offenders) if s else 0

    if phish_rate > 10:
      phish_signal = f"{badge('High Susceptibility', 'red')} &nbsp; {phish_rate:.1f}% of simulated targets fell — above 10% threshold"
    elif phish_rate > 5:
      phish_signal = f"{badge('Moderate', 'amber')} &nbsp; {phish_rate:.1f}% fell — within elevated range (5–10%)"
    else:
      phish_signal = f"{badge('Low', 'green')} &nbsp; {phish_rate:.1f}% fell — below 5% threshold"

    if compliance_rate < 70:
      train_signal = f"{badge('Training Gap', 'red')} &nbsp; {compliance_rate:.1f}% trained — significant coverage gap"
    elif compliance_rate < 85:
      train_signal = f"{badge('Improving', 'amber')} &nbsp; {compliance_rate:.1f}% trained — approaching target coverage"
    else:
      train_signal = f"{badge('Good Coverage', 'green')} &nbsp; {compliance_rate:.1f}% trained — strong baseline"

    if repeat_count > 0:
      repeat_signal = f"{badge('Repeat Exposure', 'amber')} &nbsp; {repeat_count} employee{'s' if repeat_count != 1 else ''} clicked multiple times — targeted intervention needed"
    else:
      repeat_signal = f"{badge('No Repeats', 'green')} &nbsp; No repeat clickers detected this period"

    bullets = "".join(
      f'<li style="margin:0.5em 0;">{sig}</li>'
      for sig in [phish_signal, train_signal, repeat_signal]
    )
    return subsection("Risk Signals", f'<ul style="list-style:none; padding:0;">{bullets}</ul>')
