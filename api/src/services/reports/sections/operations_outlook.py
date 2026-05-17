"""Operations Outlook section — detail-level view for IT and security teams."""

from __future__ import annotations

from src.services.reports.context import ComplianceMetrics, DataContext
from src.services.reports.sections._html import (
  callout,
  empty_state,
  fmt_seconds,
  meta_line,
  stat_row,
  subsection,
)
from src.services.reports.sections.base import ReportSection
from src.services.reports.spec import SectionConfig


class OperationsOutlookSection(ReportSection):
  """Combines campaign, compliance, and global stats detail for the security operations team."""

  def render(self, config: SectionConfig, ctx: DataContext) -> str:
    return (
      '<section class="report-section">'
      "<h2>Operations Outlook</h2>"
      + self._global_summary(ctx)
      + self._campaign_detail(config, ctx)
      + self._compliance_detail(ctx)
      + "</section>"
    )

  # ------------------------------------------------------------------

  @staticmethod
  def _global_summary(ctx: DataContext) -> str:
    s = ctx.global_stats
    if s is None:
      return subsection("Simulation Summary", empty_state("No simulation data available."))

    cards = stat_row(
      [
        ("Scheduled", str(s.total_emails_scheduled), None),
        ("Delivered", str(s.total_emails_sent), f"{s.delivery_rate:.1f}% delivery rate"),
        ("Opened", str(s.total_emails_opened), f"{s.open_rate:.1f}% of sent"),
        ("Clicked Link", str(s.total_emails_clicked), f"{s.click_rate:.1f}% of sent"),
        ("Fell for Simulation", str(s.total_emails_phished), f"{s.phish_rate:.1f}% of sent"),
      ],
      danger=frozenset({4}),
    )

    targeted_for_ratio = s.unique_users_targeted or 1
    clicked = s.users_who_clicked
    ratio = round(targeted_for_ratio / clicked) if clicked else 0
    ratio_text = f"1 in {ratio} targeted employees clicked a link" if clicked and ratio > 1 else (
      "No employees clicked a link" if not clicked else "All targeted employees clicked a link"
    )

    return subsection("Simulation Summary", cards, callout(ratio_text))

  @staticmethod
  def _campaign_detail(config: SectionConfig, ctx: DataContext) -> str:
    if not ctx.campaign_details:
      return subsection("Campaign Detail", empty_state("No campaign data available."))

    target_ids = set(config.campaign_ids) if config.campaign_ids else None
    campaigns = (
      [c for c in ctx.campaign_details if c.id in target_ids] if target_ids else ctx.campaign_details
    )

    if not campaigns:
      return subsection("Campaign Detail", empty_state("No matching campaigns found."))

    entries = []
    for c in campaigns:
      begin = c.begin_date.strftime("%Y-%m-%d")
      end = c.end_date.strftime("%Y-%m-%d")

      summary_rows = [
        ["Status", str(c.status).capitalize(), "Start", begin, "End", end],
        [f"{c.total_recipients} recipients", f"{c.total_sent} sent ({c.delivery_rate:.0f}%)",
         f"{c.total_opened} opened ({c.open_rate:.0f}%)", f"{c.total_clicked} clicked ({c.click_rate:.0f}%)",
         f"{c.total_phished} fell ({c.phish_rate:.0f}%)", f"{c.total_failed} failed"],
      ]
      kit_names = ", ".join(c.phishing_kit_names) or "—"
      meta = (
        f'<p style="font-size:9.5pt; color:#64748b; margin:0.2em 0 0.8em 0;">'
        f'<strong>Status:</strong> {str(c.status).capitalize()}'
        f'&nbsp;&nbsp;·&nbsp;&nbsp;'
        f'<strong>Period:</strong> {begin} — {end}'
        f'&nbsp;&nbsp;·&nbsp;&nbsp;'
        f'<strong>Kit:</strong> {kit_names}'
        f'</p>'
      )
      funnel = (
        '<table style="width:100%; font-size:9pt; border-collapse:collapse; margin:0;">'
        '<thead>'
        '<tr style="background:#0f3460; color:#fff;">'
        '<th style="padding:5pt 8pt; text-align:center; font-weight:600;">Targeted</th>'
        '<th style="padding:5pt 8pt; text-align:center; font-weight:600;">Sent</th>'
        '<th style="padding:5pt 8pt; text-align:center; font-weight:600;">Opened</th>'
        '<th style="padding:5pt 8pt; text-align:center; font-weight:600;">Clicked Link</th>'
        '<th style="padding:5pt 8pt; text-align:center; font-weight:600; background:#7f1d1d;">Fell for Simulation</th>'
        '</tr>'
        '</thead>'
        '<tbody>'
        '<tr style="background:#f8fafc;">'
        f'<td style="padding:6pt 8pt; text-align:center; border:1px solid #e2e8f0; font-size:11pt; font-weight:700;">{c.total_recipients}</td>'
        f'<td style="padding:6pt 8pt; text-align:center; border:1px solid #e2e8f0;"><span style="font-size:11pt; font-weight:700;">{c.total_sent}</span><br><span style="color:#64748b; font-size:8pt;">{c.delivery_rate:.0f}% delivered</span></td>'
        f'<td style="padding:6pt 8pt; text-align:center; border:1px solid #e2e8f0;"><span style="font-size:11pt; font-weight:700;">{c.total_opened}</span><br><span style="color:#64748b; font-size:8pt;">{c.open_rate:.0f}% of sent</span></td>'
        f'<td style="padding:6pt 8pt; text-align:center; border:1px solid #e2e8f0;"><span style="font-size:11pt; font-weight:700;">{c.total_clicked}</span><br><span style="color:#64748b; font-size:8pt;">{c.click_rate:.0f}% of sent</span></td>'
        f'<td style="padding:6pt 8pt; text-align:center; border:1px solid #e2e8f0; background:#fff5f5;"><span style="font-size:11pt; font-weight:700; color:#991b1b;">{c.total_phished}</span><br><span style="color:#991b1b; font-size:8pt;">{c.phish_rate:.0f}% of sent</span></td>'
        '</tr>'
        '</tbody>'
        '</table>'
      )
      timing = meta_line(
        f"Avg. open:{fmt_seconds(c.avg_time_to_open_seconds)}",
        f"Avg. click:{fmt_seconds(c.avg_time_to_click_seconds)}",
      )
      entries.append(
        f'<div class="campaign-entry" style="padding:0.9em 1em; margin-bottom:1em;">'
        f'<h3 style="margin:0 0 0.3em 0; font-size:11pt;">{c.name}</h3>'
        f'{meta}'
        f'{funnel}'
        f'{timing}'
        f'</div>'
      )

    return subsection("Campaign Detail", *entries)

  @staticmethod
  def _compliance_detail(ctx: DataContext) -> str:
    m: ComplianceMetrics | None = ctx.compliance_metrics
    if m is None:
      return subsection("Training Completion", empty_state("No training data available."))

    non_compliant = m.total_users - m.compliant_users
    cards = stat_row(
      [
        ("Total Employees", str(m.total_users), None),
        ("Completed Training", str(m.compliant_users), f"{m.compliance_rate:.1f}% completion rate"),
        ("Yet to Complete", str(non_compliant), "outstanding"),
        ("Avg Quiz Score", f"{m.avg_score:.1f}%", f"{m.avg_attempts_to_pass:.1f} avg attempts"),
      ],
      accent=frozenset({1}),
      danger=frozenset({2}) if non_compliant > 0 else frozenset(),
    )
    gap = (
      callout(
        f"<strong>{non_compliant} employee{'s' if non_compliant != 1 else ''}</strong> still need to complete mandatory security training."
      )
      if non_compliant > 0
      else callout("All employees have completed mandatory training.")
    )
    return subsection("Training Completion", cards, gap)
