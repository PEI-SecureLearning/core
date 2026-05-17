"""Tests for PdfConverter — WeasyPrint HTML → PDF."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from src.services.reports.pdf_converter import PdfConverter


SAMPLE_HTML = "<!DOCTYPE html><html><head></head><body><h1>Test</h1></body></html>"


class TestPdfConverter:
  def test_convert_calls_weasyprint(self):
    fake_pdf = b"%PDF-1.4 fake"
    mock_html_cls = MagicMock()
    mock_html_cls.return_value.write_pdf.return_value = fake_pdf

    with patch.dict(__import__("sys").modules, {"weasyprint": MagicMock(HTML=mock_html_cls)}):
      result = PdfConverter().convert(SAMPLE_HTML)

    mock_html_cls.assert_called_once_with(string=SAMPLE_HTML)
    mock_html_cls.return_value.write_pdf.assert_called_once()
    assert result == fake_pdf

  def test_convert_returns_bytes(self):
    fake_pdf = b"%PDF-1.4"
    mock_html_cls = MagicMock()
    mock_html_cls.return_value.write_pdf.return_value = fake_pdf

    with patch.dict(__import__("sys").modules, {"weasyprint": MagicMock(HTML=mock_html_cls)}):
      result = PdfConverter().convert(SAMPLE_HTML)

    assert isinstance(result, bytes)

  def test_convert_raises_on_missing_weasyprint(self):
    with patch.dict(__import__("sys").modules, {"weasyprint": None}):
      converter = PdfConverter()
      with pytest.raises((RuntimeError, ImportError)):
        converter.convert(SAMPLE_HTML)
