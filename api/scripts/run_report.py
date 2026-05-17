#!/usr/bin/env python3
"""Standalone dev tool — renders a full executive report using synthetic data.

No database, no Keycloak, no RabbitMQ required.

    uv run python scripts/run_report.py                        # HTML to stdout
    uv run python scripts/run_report.py --out /tmp/report.html
    uv run python scripts/run_report.py --pdf --out /tmp/report.pdf
    uv run python scripts/run_report.py --realm acme --title "Q2 2025 Report"

Design note
-----------
src/services/reports/__init__.py imports ReportService → collectors → campaign service
→ keycloak → pydantic Settings (requires live env vars). This script bypasses that
entirely using importlib to load only the rendering layer by absolute file path.
"""

from __future__ import annotations

import argparse
import importlib.util
import sys
from datetime import datetime
from pathlib import Path
from types import ModuleType, SimpleNamespace
from typing import Any

# ---------------------------------------------------------------------------
# Locate src tree
# ---------------------------------------------------------------------------
_HERE = Path(__file__).resolve().parent
_API_ROOT = _HERE.parent
_SRC = _API_ROOT / "src"
_REPORTS = _SRC / "services" / "reports"


def _load_module(name: str, path: Path) -> ModuleType:
  if name in sys.modules:
    return sys.modules[name]
  spec = importlib.util.spec_from_file_location(name, path)
  if spec is None or spec.loader is None:
    raise ImportError(f"Cannot locate module at {path}")
  mod = importlib.util.module_from_spec(spec)
  sys.modules[name] = mod
  spec.loader.exec_module(mod)  # type: ignore[union-attr]
  return mod


def _bootstrap() -> None:
  if str(_API_ROOT) not in sys.path:
    sys.path.insert(0, str(_API_ROOT))
  p = "src.services.reports"
  _load_module(f"{p}.spec",                            _REPORTS / "spec.py")
  _load_module(f"{p}.context",                         _REPORTS / "context.py")
  _load_module(f"{p}.sections._html",                  _REPORTS / "sections" / "_html.py")
  _load_module(f"{p}.sections.base",                   _REPORTS / "sections" / "base.py")
  _load_module(f"{p}.sections.risk",                   _REPORTS / "sections" / "risk.py")
  _load_module(f"{p}.sections.global_stats",           _REPORTS / "sections" / "global_stats.py")
  _load_module(f"{p}.sections.campaign_stats",         _REPORTS / "sections" / "campaign_stats.py")
  _load_module(f"{p}.sections.compliance",             _REPORTS / "sections" / "compliance.py")
  _load_module(f"{p}.sections.executive_summary",      _REPORTS / "sections" / "executive_summary.py")
  _load_module(f"{p}.sections.risk_outlook",           _REPORTS / "sections" / "risk_outlook.py")
  _load_module(f"{p}.sections.operations_outlook",     _REPORTS / "sections" / "operations_outlook.py")
  _load_module(f"{p}.sections",                        _REPORTS / "sections" / "__init__.py")
  _load_module(f"{p}.renderer",                        _REPORTS / "renderer.py")
  _load_module(f"{p}.builder",                         _REPORTS / "builder.py")


_bootstrap()

from src.services.reports.builder import ReportBuilder          # noqa: E402
from src.services.reports.context import (                      # noqa: E402
  ComplianceMetrics,
  DataContext,
  RiskMetrics,
)
from src.services.reports.renderer import ReportRenderer        # noqa: E402


# ---------------------------------------------------------------------------
# Synthetic fixtures
# ---------------------------------------------------------------------------

def _global_stats() -> Any:
  return SimpleNamespace(
    total_campaigns=5,
    scheduled_campaigns=1,
    running_campaigns=1,
    completed_campaigns=3,
    canceled_campaigns=0,
    total_emails_scheduled=1_100,
    total_emails_sent=1_000,
    total_emails_opened=450,
    total_emails_clicked=200,
    total_emails_phished=80,
    total_emails_failed=10,
    delivery_rate=99.0,
    open_rate=45.0,
    click_rate=20.0,
    phish_rate=8.0,
    avg_time_to_open_seconds=135.0,
    avg_time_to_click_seconds=310.0,
    unique_users_targeted=300,
    users_who_opened=180,
    users_who_clicked=60,
    users_who_phished=24,
    repeat_offenders=["user_001", "user_002"],  # anonymised IDs, not emails
  )


def _campaign_detail(campaign_id: int) -> Any:
  class _Status(str):
    def __new__(cls) -> "_Status":
      obj = str.__new__(cls, "completed")
      obj.value = "completed"
      return obj

  profiles: dict[int, dict] = {
    1: dict(
      name="Finance Department — Q1 Phishing Simulation",
      description="Credential-harvest simulation targeting finance staff.",
      begin_date=datetime(2025, 1, 6, 9, 0),
      end_date=datetime(2025, 1, 31, 18, 0),
      user_group_ids=["group-finance"],
      phishing_kit_names=["DocuSign Invoice Request"],
      sending_profile_names=["SMTP-Primary"],
      total_recipients=80,
      total_sent=78,
      total_opened=52,
      total_clicked=28,
      total_phished=14,
      total_failed=2,
      delivery_rate=97.5,
      open_rate=66.7,
      click_rate=35.9,
      phish_rate=17.9,
      avg_time_to_open_seconds=95.0,
      avg_time_to_click_seconds=220.0,
    ),
    2: dict(
      name="IT Team — Q1 Post-Training Verification",
      description="Follow-up simulation after mandatory awareness training.",
      begin_date=datetime(2025, 2, 3, 9, 0),
      end_date=datetime(2025, 2, 28, 18, 0),
      user_group_ids=["group-it"],
      phishing_kit_names=["Microsoft 365 Login Page"],
      sending_profile_names=["SMTP-Primary"],
      total_recipients=45,
      total_sent=45,
      total_opened=18,
      total_clicked=5,
      total_phished=2,
      total_failed=0,
      delivery_rate=100.0,
      open_rate=40.0,
      click_rate=11.1,
      phish_rate=4.4,
      avg_time_to_open_seconds=180.0,
      avg_time_to_click_seconds=420.0,
    ),
  }
  defaults = dict(
    name=f"General Simulation (ID {campaign_id})",
    description="Quarterly phishing awareness simulation.",
    begin_date=datetime(2025, 3, 1, 9, 0),
    end_date=datetime(2025, 3, 31, 18, 0),
    user_group_ids=["group-all-staff"],
    phishing_kit_names=["Generic Login Page"],
    sending_profile_names=["SMTP-Primary"],
    total_recipients=120,
    total_sent=118,
    total_opened=60,
    total_clicked=22,
    total_phished=9,
    total_failed=2,
    delivery_rate=98.3,
    open_rate=50.8,
    click_rate=18.6,
    phish_rate=7.6,
    avg_time_to_open_seconds=120.0,
    avg_time_to_click_seconds=270.0,
  )
  data = profiles.get(campaign_id, defaults)
  return SimpleNamespace(
    id=campaign_id,
    realm_name="acme",
    status=_Status(),
    sending_interval_seconds=3_600,
    progress_percentage=100.0,
    time_elapsed_percentage=100.0,
    first_open_at=data["begin_date"],
    last_open_at=data["end_date"],
    first_click_at=data["begin_date"],
    last_click_at=data["end_date"],
    **data,
  )


def _risk_metrics() -> RiskMetrics:
  return RiskMetrics(
    knowledge_score=0.0,
    sentiment_score=0.0,
    involvement_score=0.0,
    risk_level="N/A",
    notes="Risk scoring pending K/S/E data integration.",
  )


def _compliance_metrics() -> ComplianceMetrics:
  return ComplianceMetrics(
    total_users=300,
    compliant_users=240,
    compliance_rate=80.0,
    avg_score=78.5,
    avg_attempts_to_pass=1.6,
  )


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(description="Render a SecureLearning executive report with synthetic data.")
  parser.add_argument("--realm", default="acme-demo", help="Realm/tenant name.")
  parser.add_argument("--title", default="Security Awareness Report", help="Report title.")
  parser.add_argument("--pdf", action="store_true", help="Output PDF instead of HTML.")
  parser.add_argument("--out", type=Path, default=None, help="Write output to PATH. Default: stdout.")
  return parser.parse_args()


def _build(args: argparse.Namespace) -> str:
  campaign_ids = [1, 2]
  spec = (
    ReportBuilder(title=args.title, realm_name=args.realm)
    .add_executive_summary()
    .add_risk_outlook()
    .add_operations_outlook(campaign_ids=campaign_ids)
    .build()
  )
  ctx = DataContext(
    realm_name=spec.realm_name,
    generated_at=spec.generated_at,
    global_stats=_global_stats(),
    campaign_details=[_campaign_detail(cid) for cid in campaign_ids],
    risk_metrics=_risk_metrics(),
    compliance_metrics=_compliance_metrics(),
  )
  return ReportRenderer().render(spec, ctx)


def _to_pdf(html: str) -> bytes:
  try:
    from weasyprint import HTML
  except ImportError as exc:
    raise RuntimeError("weasyprint not installed — run: uv add weasyprint") from exc
  return HTML(string=html).write_pdf()


def main() -> int:
  args = _parse_args()
  want_pdf = args.pdf or (args.out and args.out.suffix.lower() == ".pdf")

  html = _build(args)

  if want_pdf:
    print("⏳  Converting HTML → PDF via WeasyPrint …", file=sys.stderr)
    try:
      output = _to_pdf(html)
    except RuntimeError as exc:
      print(f"❌  {exc}", file=sys.stderr)
      return 1
    if args.out:
      args.out.parent.mkdir(parents=True, exist_ok=True)
      args.out.write_bytes(output)
      print(f"✅  PDF written → {args.out}", file=sys.stderr)
    else:
      sys.stdout.buffer.write(output)
  else:
    if args.out:
      args.out.parent.mkdir(parents=True, exist_ok=True)
      args.out.write_text(html, encoding="utf-8")
      print(f"✅  HTML written → {args.out}", file=sys.stderr)
    else:
      print(html)

  return 0


if __name__ == "__main__":
  sys.exit(main())
