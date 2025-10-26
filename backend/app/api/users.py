"""User API routes."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, ConfigDict

from app.api.dependencies import get_user_service
from app.models.user import UserCreate, UserResponse, UserUpdate
from app.services.user_service import UserService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/users", tags=["Users"])


# ============================================================================
# Response Models
# ============================================================================


class UserListResponse(BaseModel):
    """Response model for user list."""

    model_config = ConfigDict(from_attributes=True)

    users: list[dict[str, Any]]
    total: int
    limit: int
    offset: int


# ============================================================================
# API Endpoints
# ============================================================================


@router.get("/", response_model=UserListResponse)
async def get_users(
    role: str | None = Query(None, description="Role filter (recruiter/admin)"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    offset: int = Query(0, ge=0, description="Page offset"),
    user_service: UserService = Depends(get_user_service),
) -> UserListResponse:
    """Get paginated list of users with optional filters.

    Supports:
    - Role filtering (recruiter/admin)
    - Pagination

    :param role: Role to filter by
    :param limit: Maximum number of results
    :param offset: Number of records to skip
    :param user_service: Injected user service
    :return: Paginated user list
    """
    logger.info(f"GET /api/users - role={role}, limit={limit}, offset={offset}")

    try:
        # Get users with pagination
        users = await run_in_threadpool(
            user_service.get_all,
            limit,
            offset,
            role=role,
        )

        # Get total count
        total = await run_in_threadpool(
            user_service.count,
            {"role": role} if role else None,
        )

        return UserListResponse(
            users=users,
            total=total,
            limit=limit,
            offset=offset,
        )

    except Exception as e:
        logger.error(f"Error getting users: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get users: {str(e)}",
        )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    user_service: UserService = Depends(get_user_service),
) -> UserResponse:
    """Get user details by ID.

    :param user_id: User ID
    :param user_service: Injected user service
    :return: User details
    :raises HTTPException: If user not found
    """
    logger.info(f"GET /api/users/{user_id}")

    user = await run_in_threadpool(user_service.get_by_id, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found",
        )

    return UserResponse(**user)


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    user_service: UserService = Depends(get_user_service),
) -> UserResponse:
    """Create a new user.

    :param user_data: User creation data
    :param user_service: Injected user service
    :return: Created user
    """
    logger.info(f"POST /api/users - email={user_data.email}, role={user_data.role}")

    try:
        # Check if email already exists
        existing = await run_in_threadpool(user_service.get_by_email, user_data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with email {user_data.email} already exists",
            )

        user = await run_in_threadpool(
            user_service.create,
            user_data.model_dump(),
        )
        logger.info(f"User created: {user['id']}")
        return UserResponse(**user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}",
        )


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    user_service: UserService = Depends(get_user_service),
) -> UserResponse:
    """Update user information.

    :param user_id: User ID
    :param user_data: User update data
    :param user_service: Injected user service
    :return: Updated user
    :raises HTTPException: If user not found
    """
    logger.info(f"PATCH /api/users/{user_id}")

    # Check if user exists
    if not await run_in_threadpool(user_service.exists, user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found",
        )

    try:
        # Only include fields that were actually provided
        update_data = user_data.model_dump(exclude_unset=True)

        # Check email uniqueness if email is being updated
        if "email" in update_data:
            existing = await run_in_threadpool(
                user_service.get_by_email,
                update_data["email"],
            )
            if existing and existing["id"] != user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"User with email {update_data['email']} already exists",
                )

        user = await run_in_threadpool(
            user_service.update,
            user_id,
            update_data,
        )
        logger.info(f"User updated: {user_id}")
        return UserResponse(**user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user: {str(e)}",
        )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    user_service: UserService = Depends(get_user_service),
) -> None:
    """Soft delete a user.

    :param user_id: User ID
    :param user_service: Injected user service
    :raises HTTPException: If user not found
    """
    logger.info(f"DELETE /api/users/{user_id}")

    # Check if user exists
    if not await run_in_threadpool(user_service.exists, user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found",
        )

    try:
        await run_in_threadpool(user_service.soft_delete, user_id)
        logger.info(f"User soft deleted: {user_id}")

    except Exception as e:
        logger.error(f"Error deleting user: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}",
        )
