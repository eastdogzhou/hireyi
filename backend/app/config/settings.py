"""Application settings and configuration."""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ============================================================================
    # Application Configuration
    # ============================================================================
    environment: Literal["development", "staging", "production"] = Field(
        default="development"
    )
    log_level: str = Field(default="INFO")
    debug: bool = Field(default=False)

    # ============================================================================
    # Supabase Configuration
    # ============================================================================
    supabase_url: str = Field(..., description="Supabase project URL")
    supabase_anon_key: str = Field(..., description="Supabase anonymous key")
    supabase_service_role_key: str = Field(..., description="Supabase service role key")
    supabase_jwt_secret: str = Field(
        ..., description="Supabase JWT secret for token verification"
    )

    # ============================================================================
    # Authentication Configuration
    # ============================================================================
    jwt_algorithm: str = Field(default="HS256", description="JWT signing algorithm")
    jwt_access_token_expire_minutes: int = Field(
        default=60 * 24,  # 24 hours
        description="Access token expiration time in minutes",
    )
    jwt_refresh_token_expire_days: int = Field(
        default=30, description="Refresh token expiration time in days"
    )
    password_min_length: int = Field(default=8, ge=8)
    password_require_uppercase: bool = Field(default=True)
    password_require_lowercase: bool = Field(default=True)
    password_require_digit: bool = Field(default=True)
    password_require_special: bool = Field(default=False)

    # ============================================================================
    # LLM Configuration
    # ============================================================================
    default_llm_model: str = Field(default="openrouter/openai/gpt-4o")
    llm_temperature: float = Field(default=0.3, ge=0.0, le=2.0)
    llm_max_tokens: int = Field(default=2000, gt=0)
    llm_timeout: int = Field(default=60, gt=0)

    # Image Resume Parsing Configuration
    img_resume_model: str = Field(
        default="volcengine/doubao-seed-1.6-vision",
        description="Vision LLM model for image resume parsing (e.g., volcengine/doubao-seed-1.6-vision)"
    )

    # OpenAI API Key
    openai_api_key: str | None = Field(default=None)

    # Alternative: OpenRouter API Key (unified access to 100+ LLMs)
    openrouter_api_key: str | None = Field(default=None)

    # Alternative: DeepSeek API Key
    deepseek_api_key: str | None = Field(default=None)

    # Alternative: Volcengine API Key (for Doubao models)
    volcengine_api_key: str | None = Field(
        default=None,
        description="Volcengine (ByteDance) API Key for Doubao models"
    )

    # ============================================================================
    # PyMuPDF Configuration
    # ============================================================================
    pymupdf_text_page_strategy: str = Field(
        default="text",
        description="PyMuPDF text extraction strategy (text, blocks, words)",
    )
    pymupdf_load_page_limit: int | None = Field(
        default=None,
        description="Optional page limit for large documents",
    )
    pymupdf_timeout: int = Field(default=120, gt=0)

    # ============================================================================
    # File Storage Configuration (Aliyun OSS)
    # ============================================================================
    aliyun_oss_access_key_id: str = Field(...)
    aliyun_oss_access_key_secret: str = Field(...)
    aliyun_oss_endpoint: str = Field(
        default="https://oss-cn-hangzhou.aliyuncs.com",
        description="OSS endpoint with https:// prefix",
    )
    aliyun_oss_bucket: str = Field(...)
    aliyun_oss_base_path: str = Field(default="resumes/")
    aliyun_oss_public_read: bool = Field(default=True)
    aliyun_oss_connect_timeout: int = Field(
        default=120,
        gt=0,
        description="OSS connection timeout in seconds (increase for overseas deployment)",
    )

    # ============================================================================
    # Retry & Resilience
    # ============================================================================
    ai_max_retries: int = Field(default=3, ge=1)
    ai_retry_base_delay: float = Field(default=1.0, gt=0)
    ai_retry_max_delay: float = Field(default=60.0, gt=0)

    # ============================================================================
    # Performance Configuration
    # ============================================================================
    max_concurrent_parse: int = Field(default=5, ge=1)
    max_concurrent_match: int = Field(default=10, ge=1)

    # ============================================================================
    # CORS Configuration
    # ============================================================================
    cors_origins: list[str] = Field(
        default=["http://localhost:5173"]
    )
    cors_allow_credentials: bool = Field(default=True)

    # ============================================================================
    # Pydantic Settings Configuration
    # ============================================================================
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance.

    :return: Settings instance loaded from environment variables.
    """
    return Settings()
