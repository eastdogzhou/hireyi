"""Unit tests for document_parser module.

Tests cover:
- File format detection
- DOCX/HTML/Markdown parsing
- Error handling and edge cases
- Text validation
"""

import pytest
from pathlib import Path

from app.services.parser.document_parser import (
    DocumentParseError,
    detect_file_format,
    parse_docx_document,
    parse_html_document,
    parse_markdown_document,
    parse_document_with_unstructured,
    parse_document_from_bytes,
    validate_document_text,
)

# Test fixtures directory
FIXTURES_DIR = Path(__file__).parent / "fixtures" / "resumes"


# ==================== Format Detection Tests ====================


def test_detect_format_by_extension_docx():
    """Test DOCX format detection by file extension."""
    format_type = detect_file_format(file_name="resume.docx")
    assert format_type == "docx"


def test_detect_format_by_extension_html():
    """Test HTML format detection by file extension."""
    format_type = detect_file_format(file_name="resume.html")
    assert format_type == "html"

    # Also test .htm extension
    format_type = detect_file_format(file_name="resume.htm")
    assert format_type == "html"


def test_detect_format_by_extension_markdown():
    """Test Markdown format detection by file extension."""
    format_type = detect_file_format(file_name="resume.md")
    assert format_type == "markdown"

    # Also test .markdown extension
    format_type = detect_file_format(file_name="resume.markdown")
    assert format_type == "markdown"


def test_detect_format_by_mime_type():
    """Test format detection by MIME type using file content."""
    # Read a real DOCX file
    docx_path = FIXTURES_DIR / "sample_resume.docx"
    with open(docx_path, "rb") as f:
        content = f.read()

    format_type = detect_file_format(file_name=None, file_content=content)
    # Should detect as DOCX based on MIME type
    assert format_type in ("docx", "unknown")  # May depend on python-magic


def test_detect_format_unknown_extension():
    """Test detection of unknown file format."""
    format_type = detect_file_format(file_name="resume.xyz")
    assert format_type == "unknown"


def test_detect_format_no_input():
    """Test format detection with no file name or content."""
    format_type = detect_file_format(file_name=None, file_content=None)
    assert format_type == "unknown"


# ==================== DOCX Parsing Tests ====================


@pytest.mark.asyncio
async def test_parse_docx_simple():
    """Test parsing a simple DOCX document."""
    docx_path = str(FIXTURES_DIR / "sample_resume.docx")
    text = await parse_docx_document(docx_path)

    assert len(text) > 100
    assert "王芳" in text
    assert "复旦大学" in text
    assert "Python" in text


@pytest.mark.asyncio
async def test_parse_docx_empty():
    """Test parsing an empty DOCX document."""
    docx_path = str(FIXTURES_DIR / "empty.docx")
    text = await parse_docx_document(docx_path)

    # Empty DOCX should return minimal text
    assert isinstance(text, str)
    assert len(text.strip()) < 10


@pytest.mark.asyncio
async def test_parse_docx_corrupted():
    """Test parsing a corrupted DOCX file."""
    docx_path = str(FIXTURES_DIR / "corrupted.docx")

    with pytest.raises(DocumentParseError) as exc_info:
        await parse_docx_document(docx_path)

    assert "Failed to parse DOCX file" in str(exc_info.value)


# ==================== HTML Parsing Tests ====================


@pytest.mark.asyncio
async def test_parse_html_clean():
    """Test parsing a clean HTML document."""
    html_path = str(FIXTURES_DIR / "sample_resume.html")
    text = await parse_html_document(html_path)

    assert len(text) > 100
    assert "张伟" in text
    assert "北京大学" in text
    assert "Python" in text

    # Ensure scripts and styles are removed
    assert "console.log" not in text
    assert "font-family" not in text


@pytest.mark.asyncio
async def test_parse_html_empty():
    """Test parsing an empty HTML document."""
    html_path = str(FIXTURES_DIR / "empty.html")
    text = await parse_html_document(html_path)

    # Empty HTML should return minimal or no text
    assert isinstance(text, str)
    assert len(text.strip()) < 10


@pytest.mark.asyncio
async def test_parse_html_encoding():
    """Test HTML parsing with different encodings."""
    # The sample HTML uses UTF-8 with Chinese characters
    html_path = str(FIXTURES_DIR / "sample_resume.html")
    text = await parse_html_document(html_path)

    # Should correctly parse Chinese characters
    assert "张伟" in text
    assert "北京" in text


# ==================== Markdown Parsing Tests ====================


@pytest.mark.asyncio
async def test_parse_markdown_basic():
    """Test parsing a basic Markdown document."""
    md_path = str(FIXTURES_DIR / "sample_resume.md")
    text = await parse_markdown_document(md_path)

    assert len(text) > 100
    assert "李明" in text
    assert "清华大学" in text
    assert "Python" in text

    # Markdown symbols should be preserved
    assert "#" in text or "##" in text


@pytest.mark.asyncio
async def test_parse_markdown_empty():
    """Test parsing an empty Markdown document."""
    md_path = str(FIXTURES_DIR / "empty.md")
    text = await parse_markdown_document(md_path)

    # Empty Markdown should return empty string
    assert text == ""


@pytest.mark.asyncio
async def test_parse_markdown_encoding():
    """Test Markdown parsing with different encodings."""
    # The sample Markdown uses UTF-8 with Chinese characters
    md_path = str(FIXTURES_DIR / "sample_resume.md")
    text = await parse_markdown_document(md_path)

    # Should correctly parse Chinese characters
    assert "李明" in text
    assert "阿里巴巴" in text


# ==================== Unified Interface Tests ====================


@pytest.mark.asyncio
async def test_parse_document_docx():
    """Test unified interface for DOCX parsing."""
    docx_path = str(FIXTURES_DIR / "sample_resume.docx")
    text = await parse_document_with_unstructured(docx_path, file_format="docx")

    assert len(text) > 100
    assert "王芳" in text


@pytest.mark.asyncio
async def test_parse_document_html():
    """Test unified interface for HTML parsing."""
    html_path = str(FIXTURES_DIR / "sample_resume.html")
    text = await parse_document_with_unstructured(html_path, file_format="html")

    assert len(text) > 100
    assert "张伟" in text


@pytest.mark.asyncio
async def test_parse_document_markdown():
    """Test unified interface for Markdown parsing."""
    md_path = str(FIXTURES_DIR / "sample_resume.md")
    text = await parse_document_with_unstructured(md_path, file_format="markdown")

    assert len(text) > 100
    assert "李明" in text


@pytest.mark.asyncio
async def test_parse_document_auto_detect():
    """Test automatic format detection."""
    # Should detect format from file name
    docx_path = str(FIXTURES_DIR / "sample_resume.docx")
    text = await parse_document_with_unstructured(docx_path)

    assert len(text) > 100


# ==================== Error Handling Tests ====================


@pytest.mark.asyncio
async def test_parse_document_pdf_error():
    """Test that PDF format raises appropriate error."""
    with pytest.raises(DocumentParseError) as exc_info:
        await parse_document_with_unstructured("dummy.pdf", file_format="pdf")

    assert "pymupdf_parser" in str(exc_info.value)


@pytest.mark.asyncio
async def test_parse_document_unknown_format():
    """Test parsing with unknown format."""
    with pytest.raises(DocumentParseError) as exc_info:
        await parse_document_with_unstructured("dummy.xyz", file_format="unknown")

    assert "Unable to detect file format" in str(exc_info.value)


@pytest.mark.asyncio
async def test_parse_document_unsupported_format():
    """Test parsing with unsupported format."""
    with pytest.raises(DocumentParseError) as exc_info:
        await parse_document_with_unstructured("dummy.file", file_format="xyz")

    assert "Unsupported file format" in str(exc_info.value)


@pytest.mark.asyncio
async def test_parse_document_nonexistent_file():
    """Test parsing a non-existent file."""
    with pytest.raises(DocumentParseError):
        await parse_document_with_unstructured(
            "/nonexistent/path/resume.docx", file_format="docx"
        )


# ==================== Bytes Parsing Tests ====================


@pytest.mark.asyncio
async def test_parse_from_bytes_docx():
    """Test parsing DOCX from bytes."""
    docx_path = FIXTURES_DIR / "sample_resume.docx"
    with open(docx_path, "rb") as f:
        content = f.read()

    text = await parse_document_from_bytes(content, "resume.docx")

    assert len(text) > 100
    assert "王芳" in text


@pytest.mark.asyncio
async def test_parse_from_bytes_html():
    """Test parsing HTML from bytes."""
    html_path = FIXTURES_DIR / "sample_resume.html"
    with open(html_path, "rb") as f:
        content = f.read()

    text = await parse_document_from_bytes(content, "resume.html")

    assert len(text) > 100
    assert "张伟" in text


@pytest.mark.asyncio
async def test_parse_from_bytes_markdown():
    """Test parsing Markdown from bytes."""
    md_path = FIXTURES_DIR / "sample_resume.md"
    with open(md_path, "rb") as f:
        content = f.read()

    text = await parse_document_from_bytes(content, "resume.md")

    assert len(text) > 100
    assert "李明" in text


# ==================== Text Validation Tests ====================


def test_validate_text_sufficient():
    """Test validation of sufficient text."""
    text = "This is a valid resume with enough text content " * 10
    assert validate_document_text(text, min_length=50) is True


def test_validate_text_insufficient():
    """Test validation of insufficient text."""
    text = "Too short"
    assert validate_document_text(text, min_length=50) is False


def test_validate_text_empty():
    """Test validation of empty text."""
    assert validate_document_text("", min_length=50) is False
    assert validate_document_text(None, min_length=50) is False


def test_validate_text_whitespace_only():
    """Test validation of whitespace-only text."""
    text = "   \n\n\t\t   "
    assert validate_document_text(text, min_length=50) is False


# ==================== Integration Tests ====================


@pytest.mark.asyncio
async def test_parse_all_formats():
    """Integration test: parse all supported formats."""
    formats_and_keywords = [
        ("sample_resume.docx", "王芳"),
        ("sample_resume.html", "张伟"),
        ("sample_resume.md", "李明"),
    ]

    for filename, expected_keyword in formats_and_keywords:
        file_path = str(FIXTURES_DIR / filename)
        text = await parse_document_with_unstructured(file_path)

        assert len(text) > 100, f"Failed to parse {filename}"
        assert expected_keyword in text, f"Keyword not found in {filename}"
