"""LiteLLM client wrapper for unified LLM integration.

This module provides a simple, type-safe interface for interacting with various
LLM providers through LiteLLM. Supports both regular and streaming completions.

Based on LiteLLM: https://github.com/berriai/litellm
"""

import logging
from collections.abc import AsyncIterable
from dataclasses import dataclass
from typing import Any, cast

logger = logging.getLogger(__name__)


@dataclass
class TextResponse:
    """Response from text completion.

    :param content: The generated text content
    :param metadata: Additional metadata from the LLM response (usage, model, etc.)
    """

    content: str
    metadata: dict[str, Any]


async def text_complete(
    model_name: str,
    messages: list[dict[str, str]],
    **kwargs: Any,
) -> TextResponse:
    """Perform async text completion using LiteLLM.

    This is a unified interface that works with 100+ LLM providers including:
    - OpenAI (gpt-4, gpt-3.5-turbo, etc.)
    - Anthropic (claude-3, claude-2, etc.)
    - DeepSeek (deepseek/deepseek-chat, etc.)
    - Google (gemini-pro, etc.)
    - And many more...

    :param model_name: Model identifier (e.g., "gpt-4", "deepseek/deepseek-chat")
    :param messages: List of message dicts with 'role' and 'content' keys
    :param kwargs: Additional arguments passed to litellm.acompletion
        - temperature: Sampling temperature (0-2)
        - max_tokens: Maximum tokens to generate
        - response_format: {"type": "json_object"} for JSON mode
        - etc.
    :return: TextResponse with generated content and metadata
    :raises Exception: If the LLM API call fails

    Example::

        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello!"}
        ]
        response = await text_complete("gpt-4", messages, temperature=0.7)
        print(response.content)
    """
    from litellm import Choices, acompletion
    from litellm.types.utils import ModelResponse

    logger.info(f"Calling LLM: {model_name} with {len(messages)} messages")

    response = await acompletion(
        model=model_name,
        messages=messages,
        **kwargs,
    )
    response = cast(ModelResponse, response)
    choices = cast(list[Choices], response.choices)

    content = choices[0].message.content or ""

    logger.info(f"LLM response received: {len(content)} chars")

    return TextResponse(content=content, metadata=response.to_dict())


async def stream_text_complete(
    model_name: str,
    messages: list[dict[str, str]],
    **kwargs: Any,
) -> AsyncIterable[str | dict[str, Any]]:
    """Stream text completion, yielding chunks as they arrive.

    This function yields text chunks incrementally as the LLM generates them,
    allowing for real-time display and lower latency for long responses.

    The final yield is an empty dict (metadata placeholder).

    :param model_name: Model identifier (e.g., "gpt-4", "deepseek/deepseek-chat")
    :param messages: List of message dicts with 'role' and 'content' keys
    :param kwargs: Additional arguments passed to litellm.acompletion
    :return: AsyncIterable yielding text chunks (str) or metadata (dict when finished)

    Example::

        messages = [{"role": "user", "content": "Write a poem"}]
        async for chunk in stream_text_complete("gpt-4", messages):
            if isinstance(chunk, str):
                print(chunk, end="", flush=True)
            else:
                # Final metadata dict
                print("\\nStream complete")
    """
    from litellm import acompletion
    from litellm.litellm_core_utils.streaming_handler import CustomStreamWrapper

    logger.info(f"Streaming LLM: {model_name} with {len(messages)} messages")

    response = await acompletion(
        model=model_name,
        messages=messages,
        stream=True,
        **kwargs,
    )
    response = cast(CustomStreamWrapper, response)

    async for chunk in response:
        content_chunk = chunk.choices[0].delta.content or ""
        if content_chunk:
            yield content_chunk

    # Yield empty dict to signal completion
    yield {}

    logger.info("LLM streaming complete")
