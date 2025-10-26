"""LLM service module for unified AI model integration.

This module provides a unified interface for interacting with various LLM providers
through LiteLLM, supporting both synchronous and streaming completions.
"""

from .client import TextResponse, text_complete, stream_text_complete

__all__ = ["TextResponse", "text_complete", "stream_text_complete"]
