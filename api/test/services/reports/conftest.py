"""Shared fixtures for the reports service test suite."""

from __future__ import annotations

from datetime import datetime

import pytest

from src.models import CampaignDetailInfo, CampaignGlobalStats, CampaignStatus
from src.services.reports.builder import ReportBuilder
from src.services.reports.context import ComplianceMetrics, DataContext, RiskMetrics
from src.services.reports.spec import ReportSpec, SectionConfig, SectionKind


# ------------------------------------------------------------------
# Stat fixtures
# ------------------------------------------------------------------


@pytest.fixture()
def mock_global_stats() -> CampaignGlobalStats:
  return CampaignGlobalStats(
    total_campaigns=5,
    scheduled_campaigns=1,
    running_campaigns=2,
    completed_campaigns=2,
    canceled_campaigns=0,
    total_emails_scheduled=1000,
    total_emails_sent=900,
    total_emails_opened=450,
    total_emails_clicked=200,
    total_emails_phished=80,
    total_emails_failed=10,
    delivery_rate=90.0,
    open_rate=50.0,
    click_rate=22.2,
    phish_rate=8.9,
    unique_users_targeted=300,
    users_who_opened=200,
    users_who_clicked=100,
    users_who_phished=40,
    repeat_offenders=["user-1", "user-2"],
    avg_time_to_open_seconds=120.5,
    avg_time_to_click_seconds=300.0,
  )


@pytest.fixture()
def mock_campaign_detail() -> CampaignDetailInfo:
  return CampaignDetailInfo(
    id=1,
    name="Test Campaign",
    description="A test phishing campaign",
    begin_date=datetime(2025, 1, 1, 9, 0),
    end_date=datetime(2025, 1, 31, 18, 0),
    sending_interval_seconds=3600,
    status=CampaignStatus.COMPLETED,
    realm_name="acme",
    user_group_ids=["group-a"],
    phishing_kit_ids=[10],
    sending_profile_ids=[5],
    phishing_kit_names=["Kit Alpha"],
    sending_profile_names=["Profile A"],
    total_recipients=200,
    total_sent=190,
    total_opened=95,
    total_clicked=40,
    total_phished=15,
    total_failed=5,
    delivery_rate=95.0,
    open_rate=50.0,
    click_rate=21.1,
    phish_rate=7.9,
    progress_percentage=100.0,
    time_elapsed_percentage=100.0,
    avg_time_to_open_seconds=90.0,
    avg_time_to_click_seconds=240.0,
    first_open_at=datetime(2025, 1, 2),
    last_open_at=datetime(2025, 1, 28),
    first_click_at=datetime(2025, 1, 3),
    last_click_at=datetime(2025, 1, 27),
  )


@pytest.fixture()
def mock_risk_metrics() -> RiskMetrics:
  return RiskMetrics(
    knowledge_score=0.0,
    sentiment_score=0.0,
    involvement_score=0.0,
    risk_level="N/A",
    notes="Risk calculation pending K/S/E data integration.",
  )


@pytest.fixture()
def mock_compliance_metrics() -> ComplianceMetrics:
  return ComplianceMetrics(
    total_users=50,
    compliant_users=40,
    compliance_rate=80.0,
    avg_score=82.5,
    avg_attempts_to_pass=1.4,
  )


@pytest.fixture()
def mock_data_context(
  mock_global_stats: CampaignGlobalStats,
  mock_campaign_detail: CampaignDetailInfo,
  mock_risk_metrics: RiskMetrics,
  mock_compliance_metrics: ComplianceMetrics,
) -> DataContext:
  return DataContext(
    realm_name="acme",
    generated_at=datetime(2025, 4, 1, 12, 0),
    global_stats=mock_global_stats,
    campaign_details=[mock_campaign_detail],
    risk_metrics=mock_risk_metrics,
    compliance_metrics=mock_compliance_metrics,
  )


# ------------------------------------------------------------------
# Spec fixtures
# ------------------------------------------------------------------


@pytest.fixture()
def minimal_spec() -> ReportSpec:
  """A spec with just the risk section."""
  return (
    ReportBuilder(title="Minimal Report", realm_name="acme")
    .add_risk_report()
    .build()
  )


@pytest.fixture()
def full_spec() -> ReportSpec:
  """A spec containing all four sections."""
  return (
    ReportBuilder(title="Full Report", realm_name="acme")
    .add_risk_report()
    .add_global_stats()
    .add_campaign_stats(campaign_ids=[1])
    .add_compliance()
    .build()
  )
