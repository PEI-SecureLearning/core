"""Phishing simulation summary section."""

from __future__ import annotations

from src.services.reports.context import DataContext
from src.services.reports.sections._html import (
  callout,
  empty_state,
  fmt_seconds,
  subsection,
  table,
)
from src.services.reports.sections.base import ReportSection
from src.services.reports.spec import SectionConfig


class GlobalStatsSection(ReportSection):
  """Renders a global overview of all phishing simulations in the realm."""

  def render(self, config: SectionConfig, ctx: DataContext) -> str:
    if ctx.global_stats is None:
      return (
        '<section class="report-section">'
        "<h2>Phishing Simulation Summary</h2>"
        + empty_state("No data available.")
        + "</section>"
      )
    s = ctx.global_stats
    return (
      '<section class="report-section">'
      "<h2>Phishing Simulation Summary</h2>"
      + self._campaign_overview(s)
      + self._email_funnel(s)
      + self._engagement_rates(s)
      + self._user_vulnerability(s)
      + "</section>"
    )

  # ------------------------------------------------------------------

  @staticmethod
  def _campaign_overview(s: object) -> str:
    rows = [
      ["Total simulations", str(s.total_campaigns)],
      ["Scheduled", str(s.scheduled_campaigns)],
      ["Running", str(s.running_campaigns)],
      ["Completed", str(s.completed_campaigns)],
      ["Canceled", str(s.canceled_campaigns)],
    ]
    return subsection("Simulation Overview", table(["Metric", "Count"], rows, num_cols=frozenset({1})))

  @staticmethod
  def _email_funnel(s: object) -> str:
    rows = [
      ["Scheduled", str(s.total_emails_scheduled)],
      ["Delivered", str(s.total_emails_sent)],
      ["Opened", str(s.total_emails_opened)],
      ["Clicked link", str(s.total_emails_clicked)],
      ["Fell for simulation", str(s.total_emails_phished)],
      ["Failed to deliver", str(s.total_emails_failed)],
    ]
    return subsection("Simulation Delivery Summary", table(["Stage", "Count"], rows, num_cols=frozenset({1})))

  @staticmethod
  def _engagement_rates(s: object) -> str:
    avg_open = fmt_seconds(s.avg_time_to_open_seconds)
    avg_click = fmt_seconds(s.avg_time_to_click_seconds)
    rows = [
      ["Delivery rate", f"{s.delivery_rate:.1f}%"],
      ["Open rate", f"{s.open_rate:.1f}%"],
      ["Click-through rate", f"{s.click_rate:.1f}%"],
      ["Simulation success rate", f"{s.phish_rate:.1f}%"],
      ["Avg. time to open", avg_open],
      ["Avg. time to click", avg_click],
    ]
    return subsection("Engagement Rates", table(["Metric", "Value"], rows, num_cols=frozenset({1})))

  @staticmethod
  def _user_vulnerability(s: object) -> str:
    repeat_count = len(s.repeat_offenders)
    targeted = s.unique_users_targeted or 1
    clicked = s.users_who_clicked
    ratio_num = round(targeted / clicked) if clicked else 0
    ratio_text = (
      f"1 in {ratio_num} targeted employees clicked a link"
      if clicked and ratio_num > 1
      else ("All targeted employees avoided the link" if not clicked else "Every targeted employee clicked a link")
    )
    rows = [
      ["Employees targeted", str(s.unique_users_targeted)],
      ["Opened the email", str(s.users_who_opened)],
      ["Clicked a link", str(s.users_who_clicked)],
      ["Fell for simulation", str(s.users_who_phished)],
      ["Repeat clickers", str(repeat_count)],
    ]
    return subsection(
      "Employee Exposure",
      table(["Metric", "Count"], rows, num_cols=frozenset({1})),
      callout(ratio_text),
    )
