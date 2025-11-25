"""Authentication middleware for JWT token verification."""

import logging
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from supabase import Client

from app.config.database import get_supabase
from app.models.auth import CurrentUser
from app.services.auth_service import AuthService

logger = logging.getLogger(__name__)


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    supabase: Client = Depends(get_supabase),
) -> CurrentUser:
    """Dependency to get current authenticated user.

    :param authorization: Authorization header with Bearer token.
    :param supabase: Supabase client instance.
    :return: Current user information.
    :raises HTTPException: If authentication fails.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify Bearer token format
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization[7:]  # Remove 'Bearer ' prefix

    auth_service = AuthService(supabase)

    try:
        # Verify token and get payload
        payload = auth_service.verify_token(token)
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Get current user with org context
        current_user = await auth_service.get_current_user(user_id)
        return current_user

    except ValueError as e:
        logger.warning(f"Token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def require_organization(
    current_user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    """Dependency to require user to be in an organization.

    :param current_user: Current authenticated user.
    :return: Current user with organization.
    :raises HTTPException: If user is not in an organization.
    """
    if not current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must join an organization to access this resource",
        )

    return current_user


async def require_admin(
    current_user: CurrentUser = Depends(require_organization),
) -> CurrentUser:
    """Dependency to require user to be an admin.

    :param current_user: Current authenticated user with organization.
    :return: Current user as admin.
    :raises HTTPException: If user is not an admin.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be an admin to access this resource",
        )

    return current_user
