"""PyMuPDF-based PDF parser for reliable document extraction.

This module uses PyMuPDF (fitz) for fast and reliable PDF text extraction.
It replaces the previous MinerU implementation with a simpler,
Python-native approach that has no external CLI dependencies.
"""

import logging
from pathlib import Path
from typing import Any

import fitz  # PyMuPDF

logger = logging.getLogger(__name__)


class PyMuPDFParseError(Exception):
    """Exception raised when PDF parsing fails."""

    pass


async def parse_pdf_with_pymupdf(
    pdf_path: str,
    *,
    output_dir: str | None = None,
    backend: str = "pymupdf",
    lang: str = "auto",
) -> dict[str, Any]:
    """Parse PDF using PyMuPDF and return structured data.

    The optional keyword arguments are kept for backwards compatibility with
    the legacy MinerU-based signature; they are currently unused.

    :param pdf_path: Path to PDF file (local path)
    :param output_dir: Unused (kept for compatibility)
    :param backend: Unused (kept for compatibility)
    :param lang: Unused (kept for compatibility)
    :return: Structured parsing result as dict
    :raises PyMuPDFParseError: If parsing fails
    :raises FileNotFoundError: If pdf_path does not exist
    """
    logger.info(f"Parsing PDF with PyMuPDF: {pdf_path}")

    pdf_file = Path(pdf_path)
    if not pdf_file.exists():
        logger.error(f"File not found: {pdf_path}")
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    try:
        doc = fitz.open(pdf_path)

        pages_data: list[dict[str, Any]] = []
        for page_number in range(len(doc)):
            page = doc[page_number]
            page_text = page.get_text()

            pages_data.append(
                {
                    "page_number": page_number,
                    "text": page_text,
                    # Maintain compatibility with legacy MinerU-like structure
                    "para_blocks": [
                        {
                            "lines": [
                                {
                                    "spans": [
                                        {
                                            "type": "text",
                                            "content": page_text,
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    "tables": [],  # Placeholder (table extraction handled separately)
                    "images": [],  # Placeholder
                }
            )

        doc.close()

        logger.info(
            "PyMuPDF parsing successful: %s (%s pages)",
            pdf_path,
            len(pages_data),
        )

        return {
            "pdf_info": pages_data,
            "parser": "pymupdf",
        }

    except Exception as err:
        logger.error(f"PyMuPDF parsing failed: {err}")
        raise PyMuPDFParseError(f"Failed to parse PDF: {err}") from err


def extract_text_from_pymupdf_output(parser_data: dict[str, Any]) -> str:
    """Extract plain text from PyMuPDF structured output.

    :param parser_data: PyMuPDF parser output (from parse_pdf_with_pymupdf)
    :return: Extracted plain text
    """
    text_parts: list[str] = []

    pdf_info = parser_data.get("pdf_info", [])

    for page_data in pdf_info:
        para_blocks = page_data.get("para_blocks", [])

        for block in para_blocks:
            if "blocks" in block:
                for nested_block in block.get("blocks", []):
                    _extract_text_from_block(nested_block, text_parts)
            else:
                _extract_text_from_block(block, text_parts)

    return "\n".join(text_parts)


def _extract_text_from_block(block: dict[str, Any], text_parts: list[str]) -> None:
    """Extract text from a single block structure."""
    lines = block.get("lines", [])

    for line in lines:
        spans = line.get("spans", [])
        line_text_parts: list[str] = []

        for span in spans:
            if span.get("type") == "text":
                content = span.get("content", "")
                if content:
                    line_text_parts.append(content)

        if line_text_parts:
            text_parts.append(" ".join(line_text_parts))


def extract_tables_from_pymupdf_output(parser_data: dict[str, Any]) -> list[dict]:
    """Extract table data from the PyMuPDF output structure."""
    tables: list[dict] = []

    pdf_info = parser_data.get("pdf_info", [])

    for page_idx, page_data in enumerate(pdf_info):
        for table in page_data.get("tables", []):
            tables.append(
                {
                    "page": page_idx,
                    "bbox": table.get("bbox", []),
                    "data": table,
                }
            )

    return tables


def extract_images_from_pymupdf_output(parser_data: dict[str, Any]) -> list[dict]:
    """Extract image metadata from the PyMuPDF output structure."""
    images: list[dict] = []

    pdf_info = parser_data.get("pdf_info", [])

    for page_idx, page_data in enumerate(pdf_info):
        for image in page_data.get("images", []):
            images.append(
                {
                    "page": page_idx,
                    "bbox": image.get("bbox", []),
                    "metadata": image,
                }
            )

    return images
