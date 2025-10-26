"""Base service class for database operations."""

from datetime import datetime, timezone
from typing import Any, Generic, TypeVar

from postgrest import APIResponse
from supabase import Client

T = TypeVar("T")


class BaseService(Generic[T]):
    """Base service class with common database operations.

    Provides common CRUD operations with automatic soft delete filtering
    and updated_at timestamp management.
    """

    def __init__(self, supabase: Client, table_name: str):
        """Initialize base service.

        :param supabase: Supabase client instance.
        :param table_name: Name of the database table.
        """
        self.supabase = supabase
        self.table_name = table_name

    def _get_active_query(
        self,
        columns: str = "*",
        *,
        count: str | None = None,
    ):
        """Get query builder with soft delete filter applied.

        :return: Query builder filtered for active (non-deleted) records.
        """
        query = self.supabase.table(self.table_name)

        if count is not None:
            query = query.select(columns, count=count)
        else:
            query = query.select(columns)

        return query.eq("is_deleted", False)

    def _add_updated_at(self, data: dict[str, Any]) -> dict[str, Any]:
        """Add updated_at timestamp to update data.

        :param data: Update data dictionary.
        :return: Data with updated_at added.
        """
        data["updated_at"] = datetime.now(timezone.utc).isoformat()
        return data

    def get_by_id(self, record_id: int) -> dict[str, Any] | None:
        """Get a single record by ID (only active records).

        :param record_id: Record ID to retrieve.
        :return: Record data or None if not found.
        """
        response: APIResponse = (
            self._get_active_query().eq("id", record_id).maybe_single().execute()
        )
        return response.data

    def get_all(
        self,
        limit: int = 100,
        offset: int = 0,
        order_by: str = "created_at",
        ascending: bool = False,
    ) -> list[dict[str, Any]]:
        """Get all active records with pagination.

        :param limit: Maximum number of records to return.
        :param offset: Number of records to skip.
        :param order_by: Column to order by.
        :param ascending: Sort in ascending order if True.
        :return: List of records.
        """
        response: APIResponse = (
            self._get_active_query()
            .order(order_by, desc=not ascending)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return response.data

    def create(self, data: dict[str, Any]) -> dict[str, Any]:
        """Create a new record.

        :param data: Record data to create.
        :return: Created record data.
        """
        response: APIResponse = (
            self.supabase.table(self.table_name).insert(data).execute()
        )
        return response.data[0]

    def update(self, record_id: int, data: dict[str, Any]) -> dict[str, Any]:
        """Update a record by ID.

        Automatically adds updated_at timestamp.

        :param record_id: Record ID to update.
        :param data: Update data.
        :return: Updated record data.
        """
        # Add updated_at timestamp
        update_data = self._add_updated_at(data)

        response: APIResponse = (
            self.supabase.table(self.table_name)
            .update(update_data)
            .eq("id", record_id)
            .eq("is_deleted", False)
            .execute()
        )

        if not response.data:
            raise ValueError(f"Record with id {record_id} not found or already deleted")

        return response.data[0]

    def soft_delete(self, record_id: int) -> bool:
        """Soft delete a record by setting is_deleted = true.

        :param record_id: Record ID to delete.
        :return: True if successful.
        """
        response: APIResponse = (
            self.supabase.table(self.table_name)
            .update(
                {
                    "is_deleted": True,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            .eq("id", record_id)
            .eq("is_deleted", False)
            .execute()
        )

        if not response.data:
            raise ValueError(f"Record with id {record_id} not found or already deleted")

        return True

    def hard_delete(self, record_id: int) -> bool:
        """Permanently delete a record from database.

        WARNING: This is irreversible. Use soft_delete in most cases.

        :param record_id: Record ID to delete.
        :return: True if successful.
        """
        response: APIResponse = (
            self.supabase.table(self.table_name).delete().eq("id", record_id).execute()
        )

        return len(response.data) > 0

    def count(self, filters: dict[str, Any] | None = None) -> int:
        """Count active records with optional filters.

        :param filters: Optional filters to apply.
        :return: Count of matching records.
        """
        query = self._get_active_query(count="exact")

        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)

        response: APIResponse = query.execute()
        if response.count is not None:
            return response.count
        return len(response.data)

    def exists(self, record_id: int) -> bool:
        """Check if a record exists and is active.

        :param record_id: Record ID to check.
        :return: True if exists and active.
        """
        return self.get_by_id(record_id) is not None
