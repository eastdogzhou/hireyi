"""Parser service module for resume and document parsing.

This module provides high-quality PDF parsing capabilities using PyMuPDF,
combined with LLM-based semantic extraction for structured resume data.
"""

from .resume_parser import (
    ResumeParseError,
    ResumeParser,
    parse_resume_batch,
    parse_resume_function,
)

__all__ = [
    "ResumeParseError",
    "ResumeParser",
    "parse_resume_batch",
    "parse_resume_function",
]
