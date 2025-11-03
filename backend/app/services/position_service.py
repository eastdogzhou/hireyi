"""Position management service.

This service handles all position-related operations including:
- CRUD operations
- Status management (open/closed)
- Department filtering
- Title search
- Cascade soft delete for position_candidates
"""

import logging
from typing import Any

from postgrest import APIResponse
from supabase import Client

from app.services.base import BaseService

logger = logging.getLogger(__name__)


class PositionService(BaseService[dict[str, Any]]):
    """Position management service.

    Provides comprehensive position management including:
    - Basic CRUD operations
    - Status filtering (open, closed)
    - Department filtering
    - Title search
    - Cascade soft delete
    """

    def __init__(self, supabase: Client, org_id: str | None = None):
        """Initialize position service.

        :param supabase: Supabase client instance
        :param org_id: Organization ID for data isolation (optional)
        """
        super().__init__(supabase, "positions", org_id=org_id)
        logger.info(f"PositionService initialized{' with org_id=' + org_id if org_id else ''}")

    def get_by_status(
        self,
        status: str,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Get all positions with specific status.

        :param status: Position status (e.g., 'open', 'closed')
        :param limit: Maximum number of records to return
        :param offset: Number of records to skip
        :return: List of positions with the specified status
        """
        logger.debug(f"Fetching positions with status: {status}")

        response: APIResponse = (
            self._get_active_query()
            .eq("status", status)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        logger.debug(f"Found {len(response.data)} positions with status: {status}")
        return response.data

    def get_by_department(
        self,
        department: str,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Get all positions in specific department.

        :param department: Department name
        :param limit: Maximum number of records to return
        :param offset: Number of records to skip
        :return: List of positions in the specified department
        """
        logger.debug(f"Fetching positions in department: {department}")

        response: APIResponse = (
            self._get_active_query()
            .eq("department", department)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        logger.debug(
            f"Found {len(response.data)} positions in department: {department}"
        )
        return response.data

    def search_positions(
        self,
        title_query: str | None = None,
        department: str | None = None,
        status: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> dict[str, Any]:
        """Search positions with multiple filters.

        :param title_query: Title fuzzy search (partial match)
        :param department: Department filter (exact match)
        :param status: Status filter (exact match)
        :param limit: Maximum number of results
        :param offset: Number of records to skip
        :return: Dictionary with positions list, total count, limit, and offset
        """
        logger.debug(
            f"Searching positions: title={title_query}, department={department}, "
            f"status={status}, limit={limit}, offset={offset}"
        )

        # Start with base query
        query = self._get_active_query(count="exact")

        # Apply filters
        if title_query:
            # Fuzzy title search (case-insensitive partial match)
            query = query.ilike("title", f"%{title_query}%")

        if department:
            query = query.eq("department", department)

        if status:
            query = query.eq("status", status)

        # Execute query with pagination
        response: APIResponse = (
            query.order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        positions = response.data
        total = response.count if response.count is not None else len(positions)

        logger.debug(f"Found {total} positions")

        return {
            "positions": positions,
            "total": total,
            "limit": limit,
            "offset": offset,
        }

    def update_status(self, record_id: int, status: str) -> dict[str, Any]:
        """Update position status.

        :param record_id: Position ID to update
        :param status: New status (e.g., 'open', 'closed')
        :return: Updated position data
        """
        logger.info(f"Updating position {record_id} status to: {status}")

        response: APIResponse = (
            self.supabase.table(self.table_name)
            .update({"status": status})
            .eq("id", record_id)
            .eq("is_deleted", False)
            .execute()
        )

        if not response.data:
            logger.error(f"Position not found or already deleted: {record_id}")
            raise ValueError(f"Position {record_id} not found or already deleted")

        logger.info(f"Position status updated successfully: {record_id}")
        return response.data[0]

    def soft_delete(self, record_id: int) -> bool:
        """Soft delete position and cascade to position_candidates.

        :param record_id: Position ID to delete
        :return: True if successful
        """
        logger.info(f"Soft deleting position: {record_id}")

        # Soft delete position
        result = super().soft_delete(record_id)

        # Cascade soft delete to position_candidates
        try:
            logger.info("Cascading soft delete to position_candidates")
            self.supabase.table("position_candidates").update(
                {
                    "is_deleted": True,
                }
            ).eq("position_id", record_id).eq("is_deleted", False).execute()

            logger.info(f"Position and related records soft deleted: {record_id}")
        except Exception as e:
            logger.error(f"Error cascading soft delete: {e}")
            # Don't fail the entire operation if cascade fails
            # The position is already marked as deleted

        return result

    def count_by_status(self, status: str) -> int:
        """Count positions with specific status.

        :param status: Position status
        :return: Count of positions with the status
        """
        logger.debug(f"Counting positions with status: {status}")
        count = self.count({"status": status})
        logger.debug(f"Found {count} positions with status: {status}")
        return count

    def get_open_positions(
        self,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Get all open positions (convenience method).

        :param limit: Maximum number of records to return
        :param offset: Number of records to skip
        :return: List of open positions
        """
        return self.get_by_status("open", limit, offset)

    def close_position(self, record_id: int) -> dict[str, Any]:
        """Close a position (convenience method).

        :param record_id: Position ID to close
        :return: Updated position data
        """
        return self.update_status(record_id, "closed")

    def reopen_position(self, record_id: int) -> dict[str, Any]:
        """Reopen a closed position (convenience method).

        :param record_id: Position ID to reopen
        :return: Updated position data
        """
        return self.update_status(record_id, "open")
