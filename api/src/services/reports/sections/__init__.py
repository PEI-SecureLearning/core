"""Sections package — re-exports all concrete section classes."""

from src.services.reports.sections.base import ReportSection
from src.services.reports.sections.campaign_stats import CampaignStatsSection
from src.services.reports.sections.compliance import ComplianceSection
from src.services.reports.sections.executive_summary import ExecutiveSummarySection
from src.services.reports.sections.global_stats import GlobalStatsSection
from src.services.reports.sections.operations_outlook import OperationsOutlookSection
from src.services.reports.sections.risk import RiskReportSection
from src.services.reports.sections.risk_outlook import RiskOutlookSection

__all__ = [
  "ReportSection",
  "ReportSection",
  "RiskReportSection",
  "GlobalStatsSection",
  "CampaignStatsSection",
  "ComplianceSection",
  "ExecutiveSummarySection",
  "RiskOutlookSection",
  "OperationsOutlookSection",
]
