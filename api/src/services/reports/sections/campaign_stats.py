"""Per-simulation detailed breakdown section."""

from __future__ import annotations

from src.services.reports.context import DataContext
from src.services.reports.sections._html import (
  empty_state,
  fmt_seconds,
  kv_table,
  subsection,
  table,
)
from src.services.reports.sections.base import ReportSection
from src.services.reports.spec import SectionConfig


class CampaignStatsSection(ReportSection):
  """Renders one HTML sub-block per requested simulation campaign."""

  def render(self, config: SectionConfig, ctx: DataContext) -> str:
    if not ctx.campaign_details:
      return (
        '<section class="report-section">'
        "<h2>Simulation Campaigns — Detailed Breakdown</h2>"
        + empty_state("No simulation data available.")
        + "</section>"
      )

    target_ids = set(config.campaign_ids) if config.campaign_ids else None
    campaigns = (
      [c for c in ctx.campaign_details if c.id in target_ids] if target_ids else ctx.campaign_details
    )

    if not campaigns:
      return (
        '<section class="report-section">'
        "<h2>Simulation Campaigns — Detailed Breakdown</h2>"
        + empty_state("No matching simulations found for the requested selection.")
        + "</section>"
      )

    entries = "\n".join(self._render_campaign(c) for c in campaigns)
    return f'<section class="report-section"><h2>Simulation Campaigns — Detailed Breakdown</h2>{entries}</section>'

  # ------------------------------------------------------------------

  @staticmethod
  def _render_campaign(c: object) -> str:
    begin = c.begin_date.strftime("%Y-%m-%d %H:%M")
    end = c.end_date.strftime("%Y-%m-%d %H:%M")

    meta = subsection(
      "Details",
      kv_table([
        ("Status", str(c.status).capitalize()),
        ("Start date", begin),
        ("End date", end),
        ("Email delivery spacing", fmt_seconds(c.sending_interval_seconds)),
        ("Phishing kits used", ", ".join(c.phishing_kit_names) or "—"),
        ("Sending profiles", ", ".join(c.sending_profile_names) or "—"),
      ]),
      level=4,
    )

    funnel_rows = [
      ["Recipients", str(c.total_recipients), "—"],
      ["Delivered", str(c.total_sent), f"{c.delivery_rate:.1f}%"],
      ["Opened", str(c.total_opened), f"{c.open_rate:.1f}%"],
      ["Clicked link", str(c.total_clicked), f"{c.click_rate:.1f}%"],
      ["Fell for simulation", str(c.total_phished), f"{c.phish_rate:.1f}%"],
      ["Failed to deliver", str(c.total_failed), "—"],
    ]
    funnel = subsection(
      "Results Breakdown",
      table(["Stage", "Count", "Rate"], funnel_rows, num_cols=frozenset({1, 2})),
      level=4,
    )

    timing = subsection(
      "Timing",
      kv_table([
        ("Avg. time to open", fmt_seconds(c.avg_time_to_open_seconds)),
        ("Avg. time to click", fmt_seconds(c.avg_time_to_click_seconds)),
        ("Completion", f"{c.progress_percentage:.1f}%"),
        ("Time elapsed", f"{c.time_elapsed_percentage:.1f}%"),
      ]),
      level=4,
    )

    return (
      f'<div class="campaign-entry">'
      f"<h3>{c.name}</h3>"
      f"{meta}{funnel}{timing}"
      f"</div>"
    )
