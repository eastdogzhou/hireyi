"""Authentication API endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.config.database import get_supabase
from app.middleware.auth import get_current_user
from app.models.auth import (
    CurrentUser,
    LoginRequest,
    PasswordResetRequest,
    RegisterRequest,
)
from app.services.auth_service import AuthService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Register a new user.

    :param request: Registration request data.
    :param supabase: Supabase client instance.
    :return: Authentication token and user profile.
    :raises HTTPException: If registration fails.
    """
    try:
        auth_service = AuthService(supabase)
        token, profile = await auth_service.register(request)

        return {
            "token": token.model_dump(),
            "user": profile.model_dump(),
        }

    except ValueError as e:
        logger.warning(f"Registration failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed",
        )


@router.post("/login", response_model=dict)
async def login(
    request: LoginRequest,
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Login with email and password.

    :param request: Login request data.
    :param supabase: Supabase client instance.
    :return: Authentication token and user profile.
    :raises HTTPException: If login fails.
    """
    try:
        auth_service = AuthService(supabase)
        token, profile = await auth_service.login(request)

        return {
            "token": token.model_dump(),
            "user": profile.model_dump(),
        }

    except ValueError as e:
        logger.warning(f"Login failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed",
        )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    current_user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> None:
    """Logout current user.

    :param current_user: Current authenticated user.
    :param supabase: Supabase client instance.
    """
    try:
        # Sign out with Supabase Auth
        supabase.auth.sign_out()
    except Exception as e:
        logger.error(f"Logout error: {e}")
        # Don't fail logout even if Supabase signout fails
        pass


@router.get("/me", response_model=CurrentUser)
async def get_me(
    current_user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    """Get current authenticated user information.

    :param current_user: Current authenticated user.
    :return: Current user profile with organization context.
    """
    return current_user


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def request_password_reset(
    request: PasswordResetRequest,
    supabase: Client = Depends(get_supabase),
) -> None:
    """Request password reset email.

    :param request: Password reset request.
    :param supabase: Supabase client instance.
    :raises HTTPException: If request fails.
    """
    try:
        auth_service = AuthService(supabase)
        await auth_service.request_password_reset(request)

    except ValueError as e:
        logger.warning(f"Password reset request failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Password reset error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset request failed",
        )
