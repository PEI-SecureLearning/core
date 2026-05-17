"""DataContext: pre-fetched data bag passed to all section renderers.

All database / service calls happen once, populating a DataContext.  The
renderers then receive this context and perform no additional I/O.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from src.models import CampaignDetailInfo, CampaignGlobalStats


@dataclass
class RiskMetrics:
  """Risk scoring derived from K/S/E components.

  All three sub-scores are currently placeholders pending full K/S/E data
  integration.  The overall_score is computed as the simple mean of the
  three components so the structure is already wired up correctly.
  """

  # Sub-components (0.0–100.0 scale; 0.0 while data is not yet available)
  knowledge_score: float = 0.0    # K — measures user security knowledge level
  sentiment_score: float = 0.0    # S — measures user security attitude / sentiment
  involvement_score: float = 0.0  # E — measures user engagement / involvement

  # Derived overall risk score (mean of K, S, E); 0.0 while components are mocked
  overall_score: float = 0.0

  risk_level: str = "N/A"
  notes: str = "Risk calculation pending K/S/E data integration."

  def __post_init__(self) -> None:
    # Recompute overall whenever the dataclass is created
    components = [self.knowledge_score, self.sentiment_score, self.involvement_score]
    if any(c > 0 for c in components):
      self.overall_score = round(sum(components) / len(components), 2)


@dataclass
class ComplianceMetrics:
  """Aggregated compliance quiz statistics for a realm."""

  total_users: int = 0
  compliant_users: int = 0
  compliance_rate: float = 0.0      # compliant / total * 100
  avg_score: float = 0.0            # average quiz score across all acceptances
  avg_attempts_to_pass: float = 0.0 # average number of tries before passing


@dataclass
class DataContext:
  """All data collected for a report, passed read-only to section renderers."""

  realm_name: str
  generated_at: datetime
  global_stats: CampaignGlobalStats | None = None
  campaign_details: list[CampaignDetailInfo] = field(default_factory=list)
  risk_metrics: RiskMetrics = field(default_factory=RiskMetrics)
  compliance_metrics: ComplianceMetrics | None = None
