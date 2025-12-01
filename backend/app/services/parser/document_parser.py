"""Document parser for DOC/DOCX/HTML/Markdown formats.

This module provides unified document parsing functionality using the unstructured library
for non-PDF document formats. It complements the existing PyMuPDF-based PDF parser.

Supported formats:
- DOCX: Microsoft Word 2007+ documents
- DOC: Legacy Microsoft Word documents (requires antiword system tool)
- HTML: Web-based resumes
- Markdown: Plain text resumes with Markdown formatting
"""

import logging
import tempfile
from pathlib import Path

import magic
from bs4 import BeautifulSoup
from unstructured.partition.auto import partition

logger = logging.getLogger(__name__)


class DocumentParseError(Exception):
    """Exception raised when document parsing fails."""

    pass


def detect_file_format(
    file_name: str | None = None,
    file_content: bytes | None = None,
) -> str:
    """Detect document format based on file name and content.

    Uses a two-step approach:
    1. File extension detection (fast path)
    2. MIME type detection via python-magic (fallback)

    :param file_name: Original file name with extension
    :param file_content: File content as bytes (optional, for MIME detection)
    :return: Format string: "pdf" | "docx" | "doc" | "html" | "markdown" | "unknown"
    """
    # Step 1: File extension detection (fast path)
    if file_name:
        file_ext = Path(file_name).suffix.lower()
        extension_map = {
            ".pdf": "pdf",
            ".docx": "docx",
            ".doc": "doc",
            ".html": "html",
            ".htm": "html",
            ".md": "markdown",
            ".markdown": "markdown",
            ".txt": "text",
        }
        if file_ext in extension_map:
            logger.debug(f"Detected format by extension: {file_ext} -> {extension_map[file_ext]}")
            return extension_map[file_ext]

    # Step 2: MIME type detection (fallback)
    if file_content:
        try:
            mime = magic.from_buffer(file_content, mime=True)
            logger.debug(f"Detected MIME type: {mime}")

            mime_map = {
                "application/pdf": "pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
                "application/msword": "doc",
                "text/html": "html",
                "text/markdown": "markdown",
                "text/plain": "text",
            }

            for mime_pattern, format_type in mime_map.items():
                if mime_pattern in mime:
                    return format_type

        except Exception as e:
            logger.warning(f"MIME type detection failed: {e}")

    logger.warning("Unable to detect file format, returning 'unknown'")
    return "unknown"


async def parse_docx_document(file_path: str) -> str:
    """Parse DOCX document and extract plain text.

    Uses the unstructured library for reliable DOCX parsing.

    :param file_path: Path to DOCX file
    :return: Extracted plain text
    :raises DocumentParseError: If parsing fails
    """
    logger.info(f"Parsing DOCX document: {file_path}")

    try:
        # Use unstructured's partition function for DOCX
        elements = partition(filename=file_path)

        # Extract text from all elements
        text_parts = [element.text for element in elements if hasattr(element, "text")]
        text = "\n".join(text_parts)

        logger.info(f"DOCX parsing successful: extracted {len(text)} characters")
        return text

    except Exception as e:
        logger.error(f"DOCX parsing failed: {e}")
        raise DocumentParseError(f"Failed to parse DOCX file: {e}") from e


async def parse_html_document(file_path: str) -> str:
    """Parse HTML document and extract clean text.

    Removes scripts, styles, and extracts visible text only.

    :param file_path: Path to HTML file
    :return: Extracted plain text
    :raises DocumentParseError: If parsing fails
    """
    logger.info(f"Parsing HTML document: {file_path}")

    try:
        # Try multiple encodings
        encodings = ["utf-8", "gbk", "gb2312", "latin-1"]
        html_content = None

        for encoding in encodings:
            try:
                with open(file_path, encoding=encoding) as f:
                    html_content = f.read()
                logger.debug(f"HTML file read successfully with encoding: {encoding}")
                break
            except (UnicodeDecodeError, LookupError):
                continue

        if html_content is None:
            raise DocumentParseError("Unable to read HTML file with supported encodings")

        # Parse with BeautifulSoup
        soup = BeautifulSoup(html_content, "html.parser")

        # Remove script and style tags
        for tag in soup(["script", "style", "meta", "link", "noscript"]):
            tag.decompose()

        # Extract text
        text = soup.get_text(separator="\n", strip=True)

        # Clean up extra whitespace
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        text = "\n".join(lines)

        logger.info(f"HTML parsing successful: extracted {len(text)} characters")
        return text

    except DocumentParseError:
        raise
    except Exception as e:
        logger.error(f"HTML parsing failed: {e}")
        raise DocumentParseError(f"Failed to parse HTML file: {e}") from e


async def parse_markdown_document(file_path: str) -> str:
    """Parse Markdown document and extract plain text.

    Markdown is essentially plain text, so we just read it directly.
    Optionally, we could convert to HTML first, but that's usually unnecessary.

    :param file_path: Path to Markdown file
    :return: Extracted plain text
    :raises DocumentParseError: If parsing fails
    """
    logger.info(f"Parsing Markdown document: {file_path}")

    try:
        # Try multiple encodings
        encodings = ["utf-8", "gbk", "gb2312", "latin-1"]
        md_content = None

        for encoding in encodings:
            try:
                with open(file_path, encoding=encoding) as f:
                    md_content = f.read()
                logger.debug(f"Markdown file read successfully with encoding: {encoding}")
                break
            except (UnicodeDecodeError, LookupError):
                continue

        if md_content is None:
            raise DocumentParseError(
                "Unable to read Markdown file with supported encodings"
            )

        logger.info(f"Markdown parsing successful: extracted {len(md_content)} characters")
        return md_content

    except DocumentParseError:
        raise
    except Exception as e:
        logger.error(f"Markdown parsing failed: {e}")
        raise DocumentParseError(f"Failed to parse Markdown file: {e}") from e


async def parse_document_with_unstructured(
    file_path: str,
    file_format: str | None = None,
) -> str:
    """Unified document parsing interface for non-PDF formats.

    This function routes to the appropriate parser based on detected file format.

    :param file_path: Path to document file
    :param file_format: Optional explicit format hint ("docx", "html", "markdown")
    :return: Extracted plain text
    :raises DocumentParseError: If format is unsupported or parsing fails
    """
    logger.info(f"Parsing document: {file_path} (format hint: {file_format})")

    # Detect format if not provided
    if file_format is None:
        file_name = Path(file_path).name
        file_format = detect_file_format(file_name=file_name)

    # Validate format
    if file_format == "pdf":
        raise DocumentParseError(
            "PDF format should be handled by pymupdf_parser, not document_parser"
        )

    if file_format == "unknown":
        raise DocumentParseError(
            f"Unable to detect file format for: {file_path}. "
            "Supported formats: DOCX, DOC, HTML, Markdown"
        )

    # Route to appropriate parser
    try:
        if file_format == "docx":
            return await parse_docx_document(file_path)
        elif file_format == "doc":
            # DOC format also uses unstructured (requires antiword system tool)
            return await parse_docx_document(file_path)
        elif file_format == "html":
            return await parse_html_document(file_path)
        elif file_format in ("markdown", "text"):
            return await parse_markdown_document(file_path)
        else:
            raise DocumentParseError(
                f"Unsupported file format: {file_format}. "
                "Supported formats: DOCX, DOC, HTML, Markdown"
            )

    except DocumentParseError:
        raise
    except Exception as e:
        logger.error(f"Document parsing failed: {e}")
        raise DocumentParseError(f"Failed to parse document: {e}") from e


async def parse_document_from_bytes(
    file_content: bytes,
    file_name: str,
) -> str:
    """Parse document from bytes content.

    Creates a temporary file and delegates to parse_document_with_unstructured.

    :param file_content: Document content as bytes
    :param file_name: Original file name (used for format detection)
    :return: Extracted plain text
    :raises DocumentParseError: If parsing fails
    """
    logger.info(f"Parsing document from bytes: {file_name} ({len(file_content)} bytes)")

    # Detect format
    file_format = detect_file_format(file_name=file_name, file_content=file_content)

    # Create temporary file
    suffix = Path(file_name).suffix
    try:
        with tempfile.NamedTemporaryFile(
            mode="wb",
            suffix=suffix,
            delete=False,
        ) as tmp_file:
            tmp_file.write(file_content)
            tmp_path = tmp_file.name

        logger.debug(f"Wrote bytes to temporary file: {tmp_path}")

        try:
            # Parse using file path
            result = await parse_document_with_unstructured(
                file_path=tmp_path,
                file_format=file_format,
            )
            return result
        finally:
            # Clean up temporary file
            Path(tmp_path).unlink(missing_ok=True)
            logger.debug(f"Cleaned up temporary file: {tmp_path}")

    except Exception as e:
        logger.error(f"Failed to parse document from bytes: {e}")
        raise DocumentParseError(f"Failed to process file content: {e}") from e


def validate_document_text(text: str, min_length: int = 50) -> bool:
    """Validate that extracted text meets minimum requirements.

    :param text: Extracted text
    :param min_length: Minimum required text length
    :return: True if valid, False otherwise
    """
    if not text or len(text.strip()) < min_length:
        logger.warning(
            f"Extracted text is too short ({len(text) if text else 0} chars, "
            f"minimum {min_length} required)"
        )
        return False
    return True
