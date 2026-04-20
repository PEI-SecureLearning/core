from __future__ import annotations

import io
import re
from collections import Counter
from dataclasses import dataclass

from pypdf import PdfReader

_SMALL_WORDS = {
    "of",
    "and",
    "the",
    "to",
    "for",
    "in",
    "on",
    "a",
    "an",
    "or",
    "by",
    "with",
    "without",
    "from",
    "at",
}

_META_KEYS = {
    "Classification",
    "Version",
    "Document Owner",
    "Last Reviewed",
}
_TOC_DOT_COUNT = 4


def _collapse_blank_lines(lines: list[str]) -> list[str]:
    collapsed: list[str] = []
    blank_streak = 0
    for line in lines:
        if not line.strip():
            blank_streak += 1
            if blank_streak <= 1:
                collapsed.append("")
            continue
        blank_streak = 0
        collapsed.append(line)
    return collapsed


def _is_title_line(line: str) -> bool:
    if not line or len(line) > 80:
        return False
    if line.startswith(("*", "-", "•", "")):
        return False
    if ":" in line:
        return False
    if re.match(r"^\d+[\).\s]", line):
        return False
    words = [w for w in re.split(r"\s+", line) if w]
    if not words:
        return False
    alpha_words = [w for w in words if re.search(r"[A-Za-z]", w)]
    if not alpha_words:
        return False
    titled = 0
    for word in alpha_words:
        lower = word.lower().strip("()[]{}.,;:!?")
        if lower in _SMALL_WORDS:
            titled += 1
            continue
        if word[0].isupper():
            titled += 1
    return titled / len(alpha_words) >= 0.8


def _format_metadata(line: str) -> str | None:
    if ":" not in line:
        return None
    key_raw, value_raw = line.split(":", 1)
    key = key_raw.strip()
    if not key or any(not (ch.isalpha() or ch.isspace()) for ch in key):
        return None
    value = value_raw.strip()
    if not value or key not in _META_KEYS:
        return None
    return f"**{key}:** {value}"


def _strip_toc_leader(line: str) -> str | None:
    stripped = line.rstrip()
    if not stripped:
        return None
    idx = len(stripped) - 1
    while idx >= 0 and stripped[idx].isdigit():
        idx -= 1
    if idx == len(stripped) - 1:
        return None
    while idx >= 0 and stripped[idx].isspace():
        idx -= 1
    dot_end = idx
    while idx >= 0 and stripped[idx] == ".":
        idx -= 1
    dot_count = dot_end - idx
    if dot_count < _TOC_DOT_COUNT:
        return None
    if idx >= 0 and not stripped[idx].isspace():
        return None
    cleaned = stripped[: idx + 1].rstrip()
    return cleaned or None


def _normalize_line(line: str) -> str | None:
    if not line:
        return ""

    stripped = line.strip()
    if not stripped:
        return ""

    if "Page |" in stripped or re.search(r"Page\s*\|\s*\d+", stripped):
        return None

    toc_stripped = _strip_toc_leader(stripped)
    if toc_stripped is not None:
        return toc_stripped or None

    meta = _format_metadata(stripped)
    if meta:
        return meta

    bullet_map = {
        "•": "*",
        "": "*",
        "–": "*",
        "—": "*",
    }
    if stripped[:1] in bullet_map:
        content = stripped[1:].strip()
        return f"* {content}" if content else None

    if re.match(r"^o\s+[A-Z]", stripped):
        return f"  * {stripped[2:].strip()}"

    return stripped


@dataclass
class _ConversionState:
    first_heading_written: bool = False
    in_toc: bool = False
    toc_index: int = 1
    toc_entries: int = 0
    toc_base_indent: int | None = None
    toc_override: list[str] | None = None
    toc_emitted: bool = False


def _extract_pages(reader: PdfReader) -> list[list[str]]:
    raw_pages: list[list[str]] = []
    for page in reader.pages:
        text = page.extract_text() or ""
        raw_pages.append([line.rstrip() for line in text.splitlines()])
    return raw_pages


def _extract_outline(reader: PdfReader) -> list[tuple[int, str]]:
    outline = getattr(reader, "outline", None)
    if outline is None:
        outline = getattr(reader, "outlines", None)
    if not outline:
        return []

    entries: list[tuple[int, str]] = []

    def walk(items, level: int) -> None:
        for item in items:
            if isinstance(item, list):
                walk(item, level + 1)
                continue
            title = getattr(item, "title", None)
            if not title:
                continue
            entries.append((level, str(title)))

    walk(outline, 0)
    return entries


def _find_repeated_lines(raw_pages: list[list[str]]) -> tuple[set[str], set[str]]:
    header_counts: Counter[str] = Counter()
    footer_counts: Counter[str] = Counter()
    for lines in raw_pages:
        non_empty = [line.strip() for line in lines if line.strip()]
        header_counts.update(non_empty[:5])
        footer_counts.update(non_empty[-3:])
    threshold = max(2, len(raw_pages) // 2)
    repeated_headers = {line for line, count in header_counts.items() if count >= threshold}
    repeated_footers = {line for line, count in footer_counts.items() if count >= threshold}
    return repeated_headers, repeated_footers


def _clean_page_lines(
    lines: list[str],
    page_index: int,
    repeated_headers: set[str],
    repeated_footers: set[str],
) -> list[str]:
    cleaned: list[str] = []
    for line in lines:
        stripped = line.strip()
        if (
            page_index > 0
            and stripped
            and (stripped in repeated_headers or stripped in repeated_footers)
        ):
            continue
        cleaned.append(line)
    return _collapse_blank_lines(cleaned)


def _convert_page(
    lines: list[str],
    state: _ConversionState,
    page_index: int,
    total_pages: int,
) -> list[str]:
    output: list[str] = []
    for raw_line in lines:
        output.extend(_convert_line(raw_line, state))

    if page_index < total_pages - 1:
        output.extend(["", "---", ""])
    return output


def _convert_line(raw_line: str, state: _ConversionState) -> list[str]:
    line = raw_line.strip()
    if not line:
        return [""]

    if not state.first_heading_written and _is_title_line(line):
        state.first_heading_written = True
        return [f"# {line}", ""]

    normalized = _normalize_line(line)
    if normalized is None:
        return []

    if line.lower() == "content":
        if state.toc_override and not state.toc_emitted:
            state.toc_emitted = True
            state.in_toc = False
            return ["## Content", "", *state.toc_override, ""]
        state.in_toc = True
        state.toc_index = 1
        state.toc_entries = 0
        state.toc_base_indent = None
        return ["## Content", ""]

    if state.in_toc:
        return _convert_toc_line(raw_line, line, normalized, state)

    if _is_title_line(line) and normalized == line:
        return [f"## {line}", ""]

    return [normalized]


def _convert_toc_line(
    raw_line: str, line: str, normalized: str, state: _ConversionState
) -> list[str]:
    is_toc_line = _strip_toc_leader(line) is not None
    if (
        state.toc_entries > 0
        and not is_toc_line
        and _is_title_line(line)
        and normalized == line
    ):
        state.in_toc = False
        return [f"## {line}", ""]

    if not normalized:
        return []

    raw_for_indent = raw_line.replace("\u00a0", " ")
    indentation = len(raw_for_indent) - len(raw_for_indent.lstrip())
    if state.toc_base_indent is None or indentation < state.toc_base_indent:
        state.toc_base_indent = indentation

    toc_item = normalized
    if toc_item.startswith(("* ", "- ")):
        toc_item = toc_item[2:].strip()
    if state.toc_base_indent is not None and indentation > state.toc_base_indent:
        return [f"  * {toc_item}"]

    output = [f"{state.toc_index}. {toc_item}"]
    state.toc_index += 1
    state.toc_entries += 1
    return output


def pdf_bytes_to_markdown(data: bytes) -> str:
    reader = PdfReader(io.BytesIO(data))
    raw_pages = _extract_pages(reader)
    if not raw_pages or not any("".join(page).strip() for page in raw_pages):
        raise ValueError("No extractable text found in PDF.")

    repeated_headers, repeated_footers = _find_repeated_lines(raw_pages)
    state = _ConversionState()
    outline_entries = _extract_outline(reader)
    if outline_entries:
        toc_lines: list[str] = []
        toc_index = 1
        for level, title in outline_entries:
            if level <= 0:
                toc_lines.append(f"{toc_index}. {title}")
                toc_index += 1
            else:
                toc_lines.append(f"  * {title}")
        state.toc_override = toc_lines
    output: list[str] = []

    for page_index, lines in enumerate(raw_pages):
        cleaned = _clean_page_lines(
            lines, page_index, repeated_headers, repeated_footers
        )
        output.extend(_convert_page(cleaned, state, page_index, len(raw_pages)))

    output = _collapse_blank_lines(output)
    return "\n".join(output).strip()
