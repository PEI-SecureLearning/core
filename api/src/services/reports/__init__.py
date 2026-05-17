"""Reports service package.

Public API::

    from src.services.reports import report_service, ReportBuilder

    spec = (
        ReportBuilder(title="Q1 Report", realm_name="acme")
        .add_risk_report()
        .add_global_stats()
        .add_campaign_stats(campaign_ids=[1, 2, 3])
        .add_compliance()
        .build()
    )
    pdf_bytes = report_service.generate(spec, session)
"""

from src.services.reports.builder import ReportBuilder
from src.services.reports.context import ComplianceMetrics, DataContext, RiskMetrics
from src.services.reports.service import ReportService
from src.services.reports.spec import ReportSpec, SectionConfig, SectionKind

# Module-level singleton — follows the established pattern in this codebase
report_service = ReportService()

__all__ = [
  "report_service",
  "ReportService",
  "ReportBuilder",
  "ReportSpec",
  "SectionConfig",
  "SectionKind",
  "DataContext",
  "RiskMetrics",
  "ComplianceMetrics",
]
