"""Image resume parser using Vision LLM.

This module provides image-based resume parsing functionality by:
1. Detecting image format and MIME type using Pillow (PIL)
2. Encoding image to Base64
3. Using Vision LLM (multimodal) to extract structured data
4. Handling errors gracefully with retry mechanisms

Supported formats: JPEG, PNG, GIF, WEBP, BMP, TIFF
"""

import base64
import io
import json
import logging
from typing import Any

from PIL import Image

from ..llm.client import text_complete
from ..llm.prompts import RESUME_PARSING_PROMPT

logger = logging.getLogger(__name__)


class ImageParseError(Exception):
    """Exception raised when image resume parsing fails."""

    pass


async def parse_image_resume(
    file_content: bytes,
    file_name: str,
    model: str = "volcengine/doubao-seed-1.6-vision",
    temperature: float = 0.3,
    max_retries: int = 2,
) -> dict[str, Any]:
    """Parse image format resume and extract structured data.

    Uses Vision LLM (multimodal model) to directly extract structured information
    from resume images without OCR preprocessing.

    :param file_content: Image file content (bytes)
    :param file_name: Original file name (for logging)
    :param model: Vision LLM model to use (default: Doubao-Seed-1.6-vision)
    :param temperature: LLM temperature (0-1, lower = more deterministic)
    :param max_retries: Maximum retry attempts if parsing fails
    :return: Structured candidate data dict
    :raises ImageParseError: If parsing fails after retries

    Example::

        with open("resume.jpg", "rb") as f:
            file_content = f.read()

        candidate_data = await parse_image_resume(
            file_content=file_content,
            file_name="resume.jpg",
            model="volcengine/doubao-seed-1.6-vision"
        )

        print(candidate_data["name"])  # 候选人姓名
        print(candidate_data["skills"])  # 技能列表
    """
    logger.info(f"Starting image resume parsing: {file_name}")

    # Step 1: Validate image content
    if not file_content or len(file_content) < 100:
        raise ImageParseError("Image file content is too small or empty")

    # Step 2: Detect MIME type using Pillow
    try:
        # Open image and validate it's a valid image file
        image = Image.open(io.BytesIO(file_content))

        # Get image format (e.g., 'JPEG', 'PNG', 'GIF')
        image_format = image.format
        if not image_format:
            raise ImageParseError("Unable to determine image format")

        # Convert format to MIME type (e.g., 'JPEG' -> 'image/jpeg')
        format_lower = image_format.lower()
        # Handle JPEG special case (format is 'JPEG' but MIME uses 'jpeg')
        if format_lower == "jpeg":
            mime_type = "image/jpeg"
        else:
            mime_type = f"image/{format_lower}"

        logger.info(f"Detected image format: {image_format}, MIME type: {mime_type}")

    except ImageParseError:
        raise
    except Exception as e:
        logger.error(f"Image format detection failed: {e}")
        raise ImageParseError(f"Failed to detect image format or file is not a valid image: {e}") from e

    # Step 3: Encode image to Base64
    try:
        base64_image = base64.b64encode(file_content).decode("utf-8")
        logger.debug(f"Image encoded to Base64: {len(base64_image)} chars")
    except Exception as e:
        logger.error(f"Base64 encoding failed: {e}")
        raise ImageParseError(f"Failed to encode image: {e}") from e

    # Step 4: Prepare prompt
    # Use existing RESUME_PARSING_PROMPT, but adapt for image input
    # The prompt expects resume_text, but for images we'll use a placeholder
    prompt_text = RESUME_PARSING_PROMPT.format(
        resume_text="(图片格式简历，请直接从图片中提取信息)"
    )

    # Step 5: Construct multimodal messages
    messages = [
        {
            "role": "system",
            "content": "你是一个专业的简历解析助手，擅长从图片中提取结构化信息。请仔细识别图片中的所有文字和内容，准确提取候选人的信息。",
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": prompt_text,
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{mime_type};base64,{base64_image}"
                    },
                },
            ],
        },
    ]

    # Step 6: Call Vision LLM with retry logic
    for attempt in range(max_retries + 1):
        try:
            logger.info(
                f"Vision LLM parsing attempt {attempt + 1}/{max_retries + 1} using model: {model}"
            )

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

            # Add metadata
            candidate_data["resume_text"] = "(图片格式简历)"
            candidate_data["parsed_from_image"] = True
            candidate_data["image_mime_type"] = mime_type

            logger.info(
                f"Successfully parsed image resume: {candidate_data.get('name', 'Unknown')}"
            )

            return candidate_data

        except json.JSONDecodeError as e:
            logger.warning(f"JSON parse error (attempt {attempt + 1}): {e}")
            if attempt == max_retries:
                raise ImageParseError("Failed to parse LLM JSON response") from e

        except Exception as e:
            logger.warning(f"Vision LLM parsing error (attempt {attempt + 1}): {e}")
            if attempt == max_retries:
                raise ImageParseError(f"Vision LLM parsing failed: {e}") from e

    raise ImageParseError("Image resume parsing failed after all retries")


async def validate_image_size(
    file_content: bytes,
    max_size_mb: int = 5,
) -> bool:
    """Validate image file size.

    :param file_content: Image file content (bytes)
    :param max_size_mb: Maximum allowed size in MB
    :return: True if size is valid, False otherwise
    """
    size_mb = len(file_content) / (1024 * 1024)

    if size_mb > max_size_mb:
        logger.warning(
            f"Image size ({size_mb:.2f} MB) exceeds maximum ({max_size_mb} MB)"
        )
        return False

    return True
