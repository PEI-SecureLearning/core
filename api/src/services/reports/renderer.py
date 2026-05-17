"""ReportRenderer — assembles a full HTML document from a ReportSpec and DataContext."""

from __future__ import annotations

from src.services.reports.context import DataContext
from src.services.reports.sections import (
  CampaignStatsSection,
  ComplianceSection,
  ExecutiveSummarySection,
  GlobalStatsSection,
  OperationsOutlookSection,
  ReportSection,
  RiskOutlookSection,
  RiskReportSection,
)
from src.services.reports.spec import ReportSpec, SectionKind

# Registry mapping SectionKind → concrete section class
_SECTION_REGISTRY: dict[SectionKind, type[ReportSection]] = {
  SectionKind.RISK: RiskReportSection,
  SectionKind.GLOBAL_STATS: GlobalStatsSection,
  SectionKind.CAMPAIGN_STATS: CampaignStatsSection,
  SectionKind.COMPLIANCE: ComplianceSection,
  SectionKind.EXECUTIVE_SUMMARY: ExecutiveSummarySection,
  SectionKind.RISK_OUTLOOK: RiskOutlookSection,
  SectionKind.OPERATIONS_OUTLOOK: OperationsOutlookSection,
}

# ---------------------------------------------------------------------------
# Stylesheet — embedded directly in the generated HTML so the document is
# fully self-contained (no external CSS files needed for WeasyPrint).
# ---------------------------------------------------------------------------
_CSS = """
:root {
  --blue:       #0f3460;
  --navy:       #16213e;
  --text:       #1e293b;
  --muted:      #64748b;
  --border:     #e2e8f0;
  --surface:    #f8fafc;
  --callout-bg: #eef2ff;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'DejaVu Sans', Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.6;
  color: var(--text);
  max-width: 21cm;
  margin: 0 auto;
}

@page {
  size: A4;
  margin: 2.2cm 2.5cm;
  @bottom-center {
    content: counter(page) " of " counter(pages);
    font-size: 8pt;
    color: var(--muted);
  }
}

/* ── Header ── */
header            { margin-bottom: 2em; text-align: center; }
header h1         { font-size: 24pt; font-weight: 700; color: var(--blue);
                    border-bottom: 3px solid var(--blue); padding-bottom: 0.5em;
                    margin-bottom: 0.6em; display: inline-block; }
.meta             { font-size: 10pt; color: var(--muted); text-align: center; }
.meta strong      { color: var(--text); font-weight: 600; }

/* ── Sections ── */
.report-section        { margin-bottom: 2.5em; padding: 0; }
.report-section > h2   { font-size: 16pt; font-weight: 700; color: var(--navy);
                         border-bottom: 2px solid var(--blue);
                         padding-bottom: 0.4em; margin-bottom: 1em; margin-top: 0; }

.sub              { margin: 0.8em 0 1.2em; padding: 0; }
.sub h3           { font-size: 12pt; font-weight: 700; color: var(--navy); margin-bottom: 0.6em; }
.sub h4           { font-size: 10.5pt; font-weight: 600; color: var(--muted); margin-bottom: 0.4em; }

.campaign-entry          { border: 1px solid var(--border); border-radius: 4pt;
                           padding: 1.2em; margin-bottom: 1.5em; background: #fafbfc; }
.campaign-entry > h3     { font-size: 12pt; font-weight: 700; color: var(--blue); margin-bottom: 1em; }

/* ── Tables ── */
table             { border-collapse: collapse; width: 100%; margin: 0.6em 0 1.2em; font-size: 10pt; }
thead tr          { background: var(--blue); color: #fff; }
th, td            { padding: 7pt 10pt; text-align: left; border: 0.5px solid #ddd; }
tbody tr:nth-child(even)  { background: var(--surface); }
tbody td          { border-bottom: 0.5px solid var(--border); }
tbody tr:last-child td    { border-bottom: 0.5px solid var(--border); }

/* key-value table */
table.kv          { margin: 0.6em 0 1em; }
table.kv th       { background: var(--surface); font-weight: 600; width: 45%;
                    text-align: left; padding: 7pt 10pt; }
table.kv td       { padding: 7pt 10pt; }
table.kv tr:last-child th,
table.kv tr:last-child td { border-bottom: none; }

.num              { text-align: right; }

/* ── Callout ── */
.callout          { border-left: 5px solid var(--blue); background: var(--callout-bg);
                    padding: 0.8em 1.2em; border-radius: 0 4pt 4pt 0; margin: 0.8em 0; }
.callout p        { margin: 0.25em 0; font-size: 10pt; line-height: 1.5; }

/* ── Misc ── */
ul                { padding-left: 1.5em; margin: 0.4em 0; }
li                { margin: 0.2em 0; font-size: 10pt; }
code              { font-family: 'DejaVu Sans Mono', Courier, monospace; font-size: 9pt;
                    background: var(--surface); padding: 1pt 4pt; border-radius: 2pt; }
hr                { border: none; border-top: 1px solid var(--border); margin: 1.5em 0; }
.section-sep      { border: none; border-top: 2px solid #c7d2e0; margin: 2.5em 0; }
.empty            { color: var(--muted); font-style: italic; font-size: 10pt; }

/* ── Badges ── */
.badge            { display: inline-block; padding: 2pt 7pt; border-radius: 3pt;
                    font-size: 9pt; font-weight: 600; }
.badge-green      { background: #dcfce7; color: #166534; }
.badge-amber      { background: #fef9c3; color: #854d0e; }
.badge-red        { background: #fee2e2; color: #991b1b; }
.badge-blue       { background: #dbeafe; color: #1e40af; }

/* ── Financial figures ── */
.fig              { font-size: 12pt; font-weight: 700; color: var(--blue); }

/* ── Executive card ── */
.exec-card        { border: 1px solid var(--border); border-radius: 4pt;
                    padding: 1em 1.2em; margin-bottom: 1em; background: var(--surface); }

/* ── Footer ── */
footer            { margin-top: 3em; padding-top: 1em; font-size: 9pt;
                    color: var(--muted); text-align: center;
                    border-top: 1px solid var(--border); }
"""


class ReportRenderer:
  """Orchestrates HTML generation from a ReportSpec and DataContext.

  Sections are rendered in the order they appear in the spec.  The renderer
  itself is stateless — all state lives in the spec and context.
  """

  def render(self, spec: ReportSpec, ctx: DataContext) -> str:
    """Produce a complete, self-contained HTML document string."""
    section_html = []
    for section_config in spec.sections:
      section_cls = _SECTION_REGISTRY.get(section_config.kind)
      if section_cls is None:
        section_html.append(
          f'<section class="report-section">'
          f"<p><em>Unknown section: {section_config.kind}</em></p>"
          f"</section>"
        )
        continue
      section_html.append(section_cls().render(section_config, ctx))

    body = '<div class="section-sep"></div>'.join(section_html)
    generated = spec.generated_at.strftime("%Y-%m-%d %H:%M UTC")

    return (
      "<!DOCTYPE html>"
      '<html lang="en">'
      "<head>"
      '<meta charset="UTF-8">'
      f"<title>{spec.title}</title>"
      f"<style>{_CSS}</style>"
      "</head>"
      "<body>"
      "<header>"
      f"<h1>{spec.title}</h1>"
      f'<p class="meta"><strong>Realm:</strong> {spec.realm_name} &nbsp;|&nbsp; '
      f"<strong>Generated:</strong> {generated}</p>"
      "</header>"
      "<hr>"
      f"{body}"
      "<hr>"
      f"<footer>Report generated on {spec.generated_at.strftime('%Y-%m-%d')} "
      "by SecureLearning.</footer>"
      "</body>"
      "</html>"
    )
