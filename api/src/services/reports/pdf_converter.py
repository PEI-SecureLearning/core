"""PdfConverter — converts an HTML string to PDF bytes via WeasyPrint.

Pipeline: HTML → PDF (no LaTeX, no Pandoc required).

WeasyPrint renders HTML/CSS to PDF using the system's Pango/Cairo libs.
Install:

    uv add weasyprint

System deps (present on any GTK-based Linux desktop / Alpine with pango+cairo):
  - libpango, libcairo
"""

from __future__ import annotations


class PdfConverter:
  """Converts a self-contained HTML document to a PDF binary using WeasyPrint.

  The HTML is expected to already contain all styling (embedded ``<style>``
  tags) — WeasyPrint does not load external resources by default.
  """

  def convert(self, html: str) -> bytes:
    """Convert an HTML document string to PDF bytes.

    Args:
        html: A complete HTML document string (including ``<html>``,
              ``<head>``, and embedded ``<style>``).

    Returns:
        Raw PDF bytes.

    Raises:
        RuntimeError: If weasyprint is not installed.
    """
    try:
      from weasyprint import HTML  # local import keeps module importable without weasyprint
    except ImportError as exc:
      raise RuntimeError(
        "weasyprint is not installed. Run: uv add weasyprint"
      ) from exc

    return HTML(string=html).write_pdf()
