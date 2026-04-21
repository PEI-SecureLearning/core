"""Report specification data models — the configuration layer for report generation."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict


class SectionKind(StrEnum):
  RISK = "risk"
  GLOBAL_STATS = "global_stats"
  CAMPAIGN_STATS = "campaign_stats"
  COMPLIANCE = "compliance"
  EXECUTIVE_SUMMARY = "executive_summary"
  RISK_OUTLOOK = "risk_outlook"
  OPERATIONS_OUTLOOK = "operations_outlook"


class SectionConfig(BaseModel):
  """Configuration for a single report section."""

  kind: SectionKind
  # campaign_ids is only consumed by CAMPAIGN_STATS; ignored by other sections
  campaign_ids: list[int] = []
  # options is reserved for future per-section tuning (e.g. top-N limits)
  options: dict[str, Any] = {}


class ReportSpec(BaseModel):
  """Immutable description of what a generated report should contain."""

  model_config = ConfigDict(frozen=True)

  title: str
  realm_name: str
  generated_at: datetime
  # Ordered tuple so callers control section order and the spec stays hashable
  sections: tuple[SectionConfig, ...]
