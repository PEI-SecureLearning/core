"""Abstract base class for all report sections."""

from __future__ import annotations

from abc import ABC, abstractmethod

from src.services.reports.context import DataContext
from src.services.reports.spec import SectionConfig


class ReportSection(ABC):
  """A single renderable block of a report.

  Each concrete subclass renders one section type and returns an **HTML
  fragment** (a ``<section>`` element string).  Sections must be stateless —
  all I/O happens in collectors before rendering starts.
  """

  @abstractmethod
  def render(self, config: SectionConfig, ctx: DataContext) -> str:
    """Render this section to an HTML fragment.

    Args:
        config: The SectionConfig for this specific section instance.
        ctx: The pre-populated DataContext shared by all sections.

    Returns:
        An HTML string — typically a ``<section class="report-section">``
        element containing headings, tables, and other markup.
    """
    ...
