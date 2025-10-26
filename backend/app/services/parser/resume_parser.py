"""Resume parsing service combining PyMuPDF and LLM.

This module provides high-level resume parsing functionality by:
1. Using PyMuPDF for high-quality PDF text extraction
2. Using LLM for semantic information extraction and structuring
3. Handling errors gracefully with retry mechanisms
"""

import json
import logging
import tempfile
from pathlib import Path
from typing import Any

from ..llm.client import text_complete
from ..llm.prompts import RESUME_PARSING_PROMPT
from .pymupdf_parser import (
    extract_text_from_pymupdf_output,
    parse_pdf_with_pymupdf,
    PyMuPDFParseError,
)

logger = logging.getLogger(__name__)


class ResumeParseError(Exception):
    """Exception raised when resume parsing fails."""

    pass


class ResumeParser:
    """Resume parsing service wrapper.

    Provides a unified interface for resume parsing operations
    using PyMuPDF for PDF extraction and LLM for data extraction.
    """

    def __init__(
        self,
        default_model: str = "openrouter/openai/gpt-4o",
        default_temperature: float = 0.3,
        max_retries: int = 2,
    ):
        """Initialize resume parser.

        :param default_model: Default LLM model to use
        :param default_temperature: Default LLM temperature
        :param max_retries: Maximum retry attempts
        """
        self.default_model = default_model
        self.default_temperature = default_temperature
        self.max_retries = max_retries
        logger.info(f"ResumeParser initialized with model: {default_model}")

    async def parse_resume(
        self,
        file_content: bytes | str,
        model: str | None = None,
        temperature: float | None = None,
    ) -> dict[str, Any]:
        """Parse resume from file content or path.

        :param file_content: Resume file content (bytes) or file path (str)
        :param model: LLM model to use (defaults to instance default)
        :param temperature: LLM temperature (defaults to instance default)
        :return: Structured candidate data dict
        :raises ResumeParseError: If parsing fails after retries
        """
        model = model or self.default_model
        temperature = temperature or self.default_temperature

        # If bytes provided, write to temporary file
        if isinstance(file_content, bytes):
            try:
                # Create temporary file with .pdf extension
                with tempfile.NamedTemporaryFile(
                    mode="wb",
                    suffix=".pdf",
                    delete=False,
                ) as tmp_file:
                    tmp_file.write(file_content)
                    tmp_path = tmp_file.name

                logger.debug(f"Wrote bytes to temporary file: {tmp_path}")

                # Parse using temporary file path
                try:
                    result = await parse_resume_function(
                        file_path=tmp_path,
                        model=model,
                        temperature=temperature,
                        max_retries=self.max_retries,
                    )
                    return result
                finally:
                    # Clean up temporary file
                    Path(tmp_path).unlink(missing_ok=True)
                    logger.debug(f"Cleaned up temporary file: {tmp_path}")

            except Exception as e:
                logger.error(f"Failed to handle bytes input: {e}")
                raise ResumeParseError(f"Failed to process file content: {e}") from e

        # File path provided directly
        return await parse_resume_function(
            file_path=file_content,
            model=model,
            temperature=temperature,
            max_retries=self.max_retries,
        )


async def parse_resume_function(
    file_path: str,
    model: str = "openrouter/openai/gpt-4o",
    temperature: float = 0.3,
    max_retries: int = 2,
) -> dict[str, Any]:
    """Parse resume from PDF file and extract structured data.

    Internal function. Use ResumeParser.parse_resume() for production code.

    :param file_path: Path to resume PDF (local path or URL)
    :param model: LLM model to use (default: gpt-4o)
    :param temperature: LLM temperature (0-1, lower = more deterministic)
    :param max_retries: Maximum retry attempts if parsing fails
    :return: Structured candidate data dict
    :raises ResumeParseError: If parsing fails after retries
    """
    logger.info(f"Starting resume parsing: {file_path}")

    # Step 1: Extract text using PyMuPDF
    try:
        parser_output = await parse_pdf_with_pymupdf(file_path)
        resume_text = extract_text_from_pymupdf_output(parser_output)
        logger.info(f"PyMuPDF extracted {len(resume_text)} characters")
    except PyMuPDFParseError as e:
        logger.error(f"PyMuPDF parsing failed: {e}")
        raise ResumeParseError(f"Failed to extract text from PDF: {e}") from e
    except Exception as e:
        logger.error(f"Unexpected PDF parsing error: {e}")
        raise ResumeParseError(f"Failed to extract text from PDF: {e}") from e

    if not resume_text or len(resume_text) < 50:
        raise ResumeParseError("Extracted text is too short or empty")

    # Step 2: Use LLM to extract structured information
    prompt = RESUME_PARSING_PROMPT.format(resume_text=resume_text)

    messages = [
        {
            "role": "system",
            "content": "你是一个专业的简历解析助手，擅长从文本中提取结构化信息。",
        },
        {"role": "user", "content": prompt},
    ]

    for attempt in range(max_retries + 1):
        try:
            logger.info(f"LLM parsing attempt {attempt + 1}/{max_retries + 1}")

            response = await text_complete(
                model_name=model,
                messages=messages,
                temperature=temperature,
                response_format={"type": "json_object"},
            )

            # Parse JSON response
            candidate_data = json.loads(response.content)

            # Validate required fields
            if not candidate_data.get("name"):
                raise ValueError("Missing required field: name")

            # Add resume_text to the result
            candidate_data["resume_text"] = resume_text

            logger.info(
                f"Successfully parsed resume: {candidate_data.get('name', 'Unknown')}"
            )

            return candidate_data

        except json.JSONDecodeError as e:
            logger.warning(f"JSON parse error (attempt {attempt + 1}): {e}")
            if attempt == max_retries:
                raise ResumeParseError("Failed to parse LLM JSON response") from e

        except Exception as e:
            logger.warning(f"LLM parsing error (attempt {attempt + 1}): {e}")
            if attempt == max_retries:
                raise ResumeParseError(f"LLM parsing failed: {e}") from e

    raise ResumeParseError("Resume parsing failed after all retries")


async def parse_resume_batch(
    file_paths: list[str],
    model: str = "openrouter/openai/gpt-4o",
    temperature: float = 0.3,
    max_concurrent: int = 5,
) -> list[dict[str, Any]]:
    """Parse multiple resumes in batch with concurrency control.

    This function processes multiple resumes efficiently using async concurrency.
    Failed parses are logged but do not stop the batch process.

    :param file_paths: List of PDF file paths
    :param model: LLM model to use
    :param temperature: LLM temperature
    :param max_concurrent: Maximum concurrent parsing tasks
    :return: List of parsed candidate data dicts (successful parses only)

    Example::

        file_paths = ["resume1.pdf", "resume2.pdf", "resume3.pdf"]
        results = await parse_resume_batch(file_paths)
        print(f"Successfully parsed {len(results)}/{len(file_paths)} resumes")
    """
    import asyncio

    logger.info(f"Starting batch resume parsing: {len(file_paths)} files")

    results = []
    semaphore = asyncio.Semaphore(max_concurrent)

    async def parse_with_semaphore(file_path: str) -> dict[str, Any] | None:
        """Parse single resume with concurrency control."""
        async with semaphore:
            try:
                result = await parse_resume_function(
                    file_path=file_path,
                    model=model,
                    temperature=temperature,
                )
                return result
            except Exception as e:
                logger.error(f"Failed to parse {file_path}: {e}")
                return None

    # Create tasks for all files
    tasks = [parse_with_semaphore(path) for path in file_paths]

    # Execute with progress logging
    completed_results = await asyncio.gather(*tasks, return_exceptions=False)

    # Filter out failed parses (None values)
    results = [r for r in completed_results if r is not None]

    logger.info(
        f"Batch parsing complete: {len(results)}/{len(file_paths)} successful"
    )

    return results


def validate_candidate_data(candidate_data: dict[str, Any]) -> bool:
    """Validate that candidate data has all required fields.

    :param candidate_data: Candidate data dict
    :return: True if valid, False otherwise
    """
    required_fields = ["name", "contact", "skills"]

    for field in required_fields:
        if field not in candidate_data:
            logger.warning(f"Missing required field: {field}")
            return False

    # Validate contact has at least one method
    contact = candidate_data.get("contact", {})
    if not any([contact.get("phone"), contact.get("email")]):
        logger.warning("Contact info missing both phone and email")
        return False

    return True


def normalize_skills(skills: list[str]) -> list[str]:
    """Normalize skill tags to standard format.

    :param skills: List of raw skill strings
    :return: List of normalized skill strings

    Example::

        raw = ["js", "REACT", "node.js", "python"]
        normalized = normalize_skills(raw)
        # ["JavaScript", "React", "Node.js", "Python"]
    """
    skill_mapping = {
        "js": "JavaScript",
        "javascript": "JavaScript",
        "ts": "TypeScript",
        "typescript": "TypeScript",
        "react": "React",
        "reactjs": "React",
        "vue": "Vue",
        "vuejs": "Vue",
        "angular": "Angular",
        "node": "Node.js",
        "nodejs": "Node.js",
        "node.js": "Node.js",
        "python": "Python",
        "java": "Java",
        "go": "Go",
        "golang": "Go",
        "rust": "Rust",
        "c++": "C++",
        "cpp": "C++",
        "csharp": "C#",
        "c#": "C#",
        "sql": "SQL",
        "mysql": "MySQL",
        "postgresql": "PostgreSQL",
        "postgres": "PostgreSQL",
        "mongodb": "MongoDB",
        "mongo": "MongoDB",
        "redis": "Redis",
        "docker": "Docker",
        "kubernetes": "Kubernetes",
        "k8s": "Kubernetes",
        "aws": "AWS",
        "azure": "Azure",
        "gcp": "GCP",
        "git": "Git",
        "linux": "Linux",
    }

    normalized = []
    seen = set()

    for skill in skills:
        skill_lower = skill.lower().strip()
        normalized_skill = skill_mapping.get(skill_lower, skill.strip())

        # Capitalize first letter if not in mapping
        if normalized_skill not in skill_mapping.values():
            normalized_skill = normalized_skill.capitalize()

        # Deduplicate
        if normalized_skill not in seen:
            normalized.append(normalized_skill)
            seen.add(normalized_skill)

    return normalized
