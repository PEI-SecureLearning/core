"""Lightweight HTML fragment helpers shared by all report section renderers.

All functions return plain strings of HTML — no DOM, no dependencies.
Sections compose these building blocks to produce their HTML fragments.
"""

from __future__ import annotations


def table(
  headers: list[str],
  rows: list[list[str]],
  num_cols: frozenset[int] = frozenset(),
) -> str:
  """Render a ``<table>`` with a styled header row.

  Args:
      headers: Column header labels.
      rows: Each inner list is one row of cell values (already-safe strings).
      num_cols: Column indices that should be right-aligned (numeric data).
  """
  ths = "".join(f"<th>{h}</th>" for h in headers)
  trs = []
  for row in rows:
    tds = "".join(
      f'<td class="num">{v}</td>' if i in num_cols else f"<td>{v}</td>"
      for i, v in enumerate(row)
    )
    trs.append(f"<tr>{tds}</tr>")
  return (
    f"<table><thead><tr>{ths}</tr></thead>"
    f"<tbody>{''.join(trs)}</tbody></table>"
  )


def kv_table(rows: list[tuple[str, str]]) -> str:
  """Two-column key → value table (no header row)."""
  trs = "".join(f"<tr><th>{k}</th><td>{v}</td></tr>" for k, v in rows)
  return f"<table class='kv'><tbody>{trs}</tbody></table>"


def subsection(title: str, *content: str, level: int = 3) -> str:
  """Wrap content in a titled ``<div class="sub">`` block."""
  body = "\n".join(content)
  return f'<div class="sub"><h{level}>{title}</h{level}>{body}</div>'


def callout(*lines: str) -> str:
  """Render a highlighted callout box."""
  inner = "".join(f"<p>{line}</p>" for line in lines)
  return f'<div class="callout">{inner}</div>'


def empty_state(msg: str) -> str:
  """Muted italic placeholder for missing data."""
  return f'<p class="empty">{msg}</p>'


def badge(text: str, level: str) -> str:
  """Inline status badge. level: 'green' | 'amber' | 'red' | 'blue'."""
  return f'<span class="badge badge-{level}">{text}</span>'


def stat_row(
  cells: list[tuple[str, str, str | None]],
  *,
  danger: frozenset[int] = frozenset(),
  accent: frozenset[int] = frozenset(),
) -> str:
  """Horizontal stat table matching the campaign-detail design.

  cells: [(label, value, sublabel|None), ...]
  danger: column indices rendered red  (bad metric — fell for simulation, outstanding)
  accent: column indices rendered dark blue (key summary figure)
  """
  _TH = "padding:5pt 8pt; text-align:center; font-weight:600;"
  _TD = "padding:6pt 8pt; text-align:center; border:1px solid #e2e8f0;"

  ths, tds = [], []
  for i, (label, value, sub) in enumerate(cells):
    if i in danger:
      ths.append(f'<th style="{_TH} background:#7f1d1d;">{label}</th>')
      td_s = f"{_TD} background:#fff5f5;"
      val_s = "font-size:11pt; font-weight:700; color:#991b1b;"
      sub_s = "color:#991b1b; font-size:8pt;"
    elif i in accent:
      ths.append(f'<th style="{_TH} background:#16213e;">{label}</th>')
      td_s = f"{_TD} background:#eef2ff;"
      val_s = "font-size:11pt; font-weight:700; color:#0f3460;"
      sub_s = "color:#0f3460; font-size:8pt;"
    else:
      ths.append(f'<th style="{_TH}">{label}</th>')
      td_s, val_s, sub_s = _TD, "font-size:11pt; font-weight:700;", "color:#64748b; font-size:8pt;"

    sub_html = f'<br><span style="{sub_s}">{sub}</span>' if sub else ""
    tds.append(f'<td style="{td_s}"><span style="{val_s}">{value}</span>{sub_html}</td>')

  return (
    '<table style="width:100%; font-size:9pt; border-collapse:collapse; margin:0.6em 0;">'
    '<thead><tr style="background:#0f3460; color:#fff;">'
    + "".join(ths)
    + '</tr></thead><tbody><tr style="background:#f8fafc;">'
    + "".join(tds)
    + "</tr></tbody></table>"
  )


def meta_line(*parts: str) -> str:
  """Muted meta line with dot separators between parts."""
  sep = '&nbsp;&nbsp;·&nbsp;&nbsp;'
  joined = sep.join(f"<strong>{p.split(':', 1)[0]}:</strong> {p.split(':', 1)[1]}" if ":" in p else p for p in parts)
  return f'<p style="font-size:9.5pt; color:#64748b; margin:0.2em 0 0.8em 0;">{joined}</p>'


def fmt_seconds(seconds: float | None) -> str:
  """Convert seconds to human-readable 'X min Y sec'."""
  if seconds is None:
    return "N/A"
  total = int(seconds)
  mins, secs = divmod(total, 60)
  if mins and secs:
    return f"{mins} min {secs} sec"
  if mins:
    return f"{mins} min"
  return f"{secs} sec"
