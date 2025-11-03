"""User management service."""

import logging
from typing import Any

from postgrest import APIResponse
from supabase import Client

from app.services.base import BaseService

logger = logging.getLogger(__name__)


class UserService(BaseService[dict[str, Any]]):
    """User management service.

    Provides CRUD operations for user management, including:
    - Basic CRUD from BaseService
    - Email-based queries
    - Role filtering
    """

    def __init__(self, supabase: Client):
        """Initialize user service.

        :param supabase: Supabase client instance
        """
        super().__init__(supabase, "users")
        logger.info("UserService initialized")

    def create(self, data: dict[str, Any]) -> dict[str, Any]:
        """Create a new user.

        :param data: User data (email, name, role)
        :return: Created user data
        :raises ValueError: If email already exists
        """
        # Check if email already exists
        if self.exists_by_email(data.get("email", "")):
            logger.warning(
                f"Attempted to create user with existing email: {data.get('email')}"
            )
            raise ValueError(f"User with email {data.get('email')} already exists")

        logger.info(f"Creating user: {data.get('email')}")
        user = super().create(data)
        logger.info(f"User created successfully: {user.get('id')}")
        return user

    def get_by_email(self, email: str) -> dict[str, Any] | None:
        """Get user by email address.

        :param email: User email address
        :return: User data or None if not found
        """
        logger.debug(f"Searching for user by email: {email}")

        response: APIResponse = (
            self._get_active_query().eq("email", email).maybe_single().execute()
        )

        if response.data:
            logger.debug(f"User found: {response.data.get('id')}")
        else:
            logger.debug(f"No user found with email: {email}")

        return response.data

    def exists_by_email(self, email: str) -> bool:
        """Check if user with given email exists.

        :param email: Email address to check
        :return: True if user exists, False otherwise
        """
        return self.get_by_email(email) is not None

    def get_by_role(
        self,
        role: str,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Get all users with specific role.

        :param role: User role (e.g., 'recruiter', 'admin')
        :param limit: Maximum number of records to return
        :param offset: Number of records to skip
        :return: List of users with the specified role
        """
        logger.debug(f"Fetching users with role: {role}")

        response: APIResponse = (
            self._get_active_query()
            .eq("role", role)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        logger.debug(f"Found {len(response.data)} users with role: {role}")
        return response.data

    def update(self, record_id: int, data: dict[str, Any]) -> dict[str, Any]:
        """Update user information.

        :param record_id: User ID to update
        :param data: Update data
        :return: Updated user data
        :raises ValueError: If trying to change email to existing email
        """
        # If email is being updated, check for conflicts
        if "email" in data:
            existing_user = self.get_by_email(data["email"])
            if existing_user and existing_user.get("id") != record_id:
                logger.warning(
                    f"Attempted to update user {record_id} with existing email: {data['email']}"
                )
                raise ValueError(f"Email {data['email']} is already in use")

        logger.info(f"Updating user: {record_id}")
        user = super().update(record_id, data)
        logger.info(f"User updated successfully: {record_id}")
        return user

    def soft_delete(self, record_id: int) -> bool:
        """Soft delete a user.

        :param record_id: User ID to delete
        :return: True if successful
        """
        logger.info(f"Soft deleting user: {record_id}")
        result = super().soft_delete(record_id)
        logger.info(f"User soft deleted successfully: {record_id}")
        return result

    def get_all(
        self,
        limit: int = 100,
        offset: int = 0,
        role: str | None = None,
    ) -> list[dict[str, Any]]:
        """Get all active users with optional role filtering.

        :param limit: Maximum number of records to return
        :param offset: Number of records to skip
        :param role: Optional role filter
        :return: List of users
        """
        if role:
            return self.get_by_role(role, limit, offset)

        logger.debug(f"Fetching all users (limit: {limit}, offset: {offset})")
        users = super().get_all(limit, offset)
        logger.debug(f"Retrieved {len(users)} users")
        return users

    def count_by_role(self, role: str) -> int:
        """Count users with specific role.

        :param role: User role
        :return: Count of users with the role
        """
        logger.debug(f"Counting users with role: {role}")
        count = self.count({"role": role})
        logger.debug(f"Found {count} users with role: {role}")
        return count
