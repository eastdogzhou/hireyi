"""Database configuration and Supabase client initialization."""

from functools import lru_cache

from supabase import Client, create_client

from .settings import get_settings


@lru_cache
def get_supabase_client() -> Client:
    """Get cached Supabase client instance.

    :return: Configured Supabase client.
    """
    settings = get_settings()

    client = create_client(
        supabase_url=settings.supabase_url,
        supabase_key=settings.supabase_service_role_key,
    )

    return client


def get_supabase() -> Client:
    """Dependency function for FastAPI to inject Supabase client.

    :return: Supabase client instance.

    Example:
        ```python
        from fastapi import Depends
        from app.config.database import get_supabase

        @app.get("/candidates")
        def get_candidates(supabase: Client = Depends(get_supabase)):
            response = supabase.table("candidates").select("*").execute()
            return response.data
        ```
    """
    return get_supabase_client()
