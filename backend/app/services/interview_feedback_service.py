"""Interview feedback and status change tracking service.

This service handles dual-purpose operations:
1. Interview evaluation records (with rating, comments, date)
2. Status change history (with new status, reason)
"""

import logging
from typing import Any

from postgrest import APIResponse
from supabase import Client

from app.services.base import BaseService

logger = logging.getLogger(__name__)


class InterviewFeedbackService(BaseService[dict[str, Any]]):
    """Interview feedback and status change tracking service.

    Provides comprehensive feedback management including:
    - Creating and editing interview evaluations
    - Recording status change history
    - Querying feedback by candidate/position
    - Timeline view support
    """

    def __init__(self, supabase: Client):
        """Initialize interview feedback service.

        :param supabase: Supabase client instance
        """
        super().__init__(supabase, "interview_feedbacks")
        logger.info("InterviewFeedbackService initialized")

    def create_interview_feedback(
        self,
        candidate_id: int,
        interviewer: int,
        rating: int,
        position_id: int | None = None,
        comments: str | None = None,
        interview_date: str | None = None,
    ) -> dict[str, Any]:
        """Create interview evaluation feedback.

        :param candidate_id: Candidate ID
        :param interviewer: Interviewer user ID
        :param rating: Interview rating (1-5)
        :param position_id: Position ID (optional, for position-specific feedback)
        :param comments: Interview feedback comments (optional)
        :param interview_date: Interview date in YYYY-MM-DD format (optional)
        :return: Created feedback data
        :raises ValueError: If rating is invalid
        """
        logger.info(
            f"Creating interview feedback: candidate={candidate_id}, "
            f"position={position_id}, interviewer={interviewer}, rating={rating}"
        )

        # Validate rating
        if not (1 <= rating <= 5):
            raise ValueError("Rating must be between 1 and 5")

        # Prepare data
        data = {
            "candidate_id": candidate_id,
            "position_id": position_id,
            "interviewer": interviewer,
            "rating": rating,
            "comments": comments,
            "interview_date": interview_date,
            "is_status_change": False,  # This is an interview feedback
        }

        feedback = self.create(data)
        logger.info(f"Interview feedback created successfully: {feedback.get('id')}")
        return feedback

    def create_status_change_record(
        self,
        candidate_id: int,
        operator: int,
        new_status: str,
        position_id: int | None = None,
        reason: str | None = None,
    ) -> dict[str, Any]:
        """Create status change history record.

        :param candidate_id: Candidate ID
        :param operator: Operator user ID who made the status change
        :param new_status: New status value
        :param position_id: Position ID (optional, for position-specific status changes)
        :param reason: Reason for status change (optional)
        :return: Created status change record
        """
        logger.info(
            f"Creating status change record: candidate={candidate_id}, "
            f"position={position_id}, new_status={new_status}"
        )

        # Validate status
        valid_statuses = ["screening", "interview", "offer", "hired", "rejected", "withdrawn"]
        if new_status not in valid_statuses:
            raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

        # Prepare data
        data = {
            "candidate_id": candidate_id,
            "position_id": position_id,
            "interviewer": operator,  # Use interviewer field for operator
            "new_status": new_status,
            "comments": reason,
            "is_status_change": True,  # This is a status change record
            "rating": None,  # No rating for status changes
            "interview_date": None,  # No date for status changes
        }

        record = self.create(data)
        logger.info(f"Status change record created successfully: {record.get('id')}")
        return record

    def create_position_association_record(
        self,
        candidate_id: int,
        position_id: int,
        operator: int | None = None,
        source: str = "manual",
    ) -> dict[str, Any]:
        """Create position association event record.

        This is automatically called when a candidate is associated with a position.

        :param candidate_id: Candidate ID
        :param position_id: Position ID
        :param operator: Operator user ID (None for AI/system events)
        :param source: Association source: "manual", "smart_screening", "ai"
        :return: Created association record
        """
        logger.info(
            f"Creating position association record: candidate={candidate_id}, "
            f"position={position_id}, source={source}"
        )

        # Generate description based on source
        source_descriptions = {
            "manual": f"手动添加候选人到职位 (职位ID: {position_id})",
            "smart_screening": f"智能筛选自动匹配到职位 (职位ID: {position_id})",
            "ai": f"AI 自动推荐到职位 (职位ID: {position_id})",
        }
        comments = source_descriptions.get(source, f"关联到职位 (职位ID: {position_id})")

        # Prepare data
        data = {
            "candidate_id": candidate_id,
            "position_id": position_id,
            "interviewer": operator,  # NULL for system events
            "comments": comments,
            "is_status_change": False,  # This is an event record, not status change
            "rating": None,
            "interview_date": None,
            "new_status": None,
        }

        record = self.create(data)
        logger.info(f"Position association record created successfully: {record.get('id')}")
        return record

    def update_feedback(
        self,
        record_id: int,
        rating: int | None = None,
        comments: str | None = None,
        interview_date: str | None = None,
    ) -> dict[str, Any]:
        """Update interview feedback (editing allowed).

        Only interview feedback can be edited, not status change records.

        :param record_id: Feedback record ID
        :param rating: New rating (1-5, optional)
        :param comments: New comments (optional)
        :param interview_date: New interview date (optional)
        :return: Updated feedback data
        :raises ValueError: If trying to edit status change record or invalid rating
        """
        logger.info(f"Updating interview feedback: {record_id}")

        # Get current record to check if it's a status change
        current = self.get_by_id(record_id)
        if not current:
            raise ValueError(f"Feedback {record_id} not found")

        if current.get("is_status_change"):
            raise ValueError("Cannot edit status change records")

        # Validate rating if provided
        if rating is not None and not (1 <= rating <= 5):
            raise ValueError("Rating must be between 1 and 5")

        # Prepare update data
        update_data = {}
        if rating is not None:
            update_data["rating"] = rating
        if comments is not None:
            update_data["comments"] = comments
        if interview_date is not None:
            update_data["interview_date"] = interview_date

        if not update_data:
            logger.warning("No fields to update")
            return current

        feedback = self.update(record_id, update_data)
        logger.info(f"Feedback updated successfully: {record_id}")
        return feedback

    def get_feedbacks_for_candidate(
        self,
        candidate_id: int,
        include_status_changes: bool = True,
        limit: int = 100,
        offset: int = 0,
    ) -> dict[str, Any]:
        """Get all execution records for a candidate (across all positions).

        Returns both interview feedbacks and status changes, sorted by created_at (chronological).

        :param candidate_id: Candidate ID
        :param include_status_changes: Include status change records (default: True)
        :param limit: Maximum number of results
        :param offset: Number of records to skip
        :return: Dictionary with feedbacks list, total count, limit, and offset
        """
        logger.debug(
            f"Getting all execution records for candidate={candidate_id}"
        )

        # Start with base query - only filter by candidate_id
        query = (
            self._get_active_query(count="exact")
            .eq("candidate_id", candidate_id)
        )

        # Filter by type if requested
        if not include_status_changes:
            query = query.eq("is_status_change", False)

        # Sort by creation time (chronological order, newest first)
        response: APIResponse = (
            query.order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        feedbacks = response.data
        total = response.count if response.count is not None else len(feedbacks)

        logger.debug(f"Found {total} execution records for candidate")

        return {
            "feedbacks": feedbacks,
            "total": total,
            "limit": limit,
            "offset": offset,
        }

    def get_feedbacks_for_candidate_position(
        self,
        candidate_id: int,
        position_id: int,
        include_status_changes: bool = True,
        limit: int = 100,
        offset: int = 0,
    ) -> dict[str, Any]:
        """Get all feedbacks for a candidate-position pair.

        Returns both interview feedbacks and status changes, sorted by created_at (chronological).

        :param candidate_id: Candidate ID
        :param position_id: Position ID
        :param include_status_changes: Include status change records (default: True)
        :param limit: Maximum number of results
        :param offset: Number of records to skip
        :return: Dictionary with feedbacks list, total count, limit, and offset
        """
        logger.debug(
            f"Getting feedbacks for candidate={candidate_id}, position={position_id}"
        )

        # Start with base query
        query = (
            self._get_active_query(count="exact")
            .eq("candidate_id", candidate_id)
            .eq("position_id", position_id)
        )

        # Filter by type if requested
        if not include_status_changes:
            query = query.eq("is_status_change", False)

        # Sort by creation time (chronological order)
        response: APIResponse = (
            query.order("created_at", desc=False)
            .range(offset, offset + limit - 1)
            .execute()
        )

        feedbacks = response.data
        total = response.count if response.count is not None else len(feedbacks)

        logger.debug(f"Found {total} feedback records")

        return {
            "feedbacks": feedbacks,
            "total": total,
            "limit": limit,
            "offset": offset,
        }

    def get_interview_feedbacks_only(
        self,
        candidate_id: int,
        position_id: int,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Get only interview evaluation feedbacks (exclude status changes).

        :param candidate_id: Candidate ID
        :param position_id: Position ID
        :param limit: Maximum number of results
        :param offset: Number of records to skip
        :return: List of interview feedback records
        """
        logger.debug(
            f"Getting interview feedbacks only for candidate={candidate_id}, position={position_id}"
        )

        response: APIResponse = (
            self._get_active_query()
            .eq("candidate_id", candidate_id)
            .eq("position_id", position_id)
            .eq("is_status_change", False)
            .order("created_at", desc=False)
            .range(offset, offset + limit - 1)
            .execute()
        )

        logger.debug(f"Found {len(response.data)} interview feedbacks")
        return response.data

    def get_status_change_history(
        self,
        candidate_id: int,
        position_id: int,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Get only status change history (exclude interview feedbacks).

        :param candidate_id: Candidate ID
        :param position_id: Position ID
        :param limit: Maximum number of results
        :param offset: Number of records to skip
        :return: List of status change records
        """
        logger.debug(
            f"Getting status change history for candidate={candidate_id}, position={position_id}"
        )

        response: APIResponse = (
            self._get_active_query()
            .eq("candidate_id", candidate_id)
            .eq("position_id", position_id)
            .eq("is_status_change", True)
            .order("created_at", desc=False)
            .range(offset, offset + limit - 1)
            .execute()
        )

        logger.debug(f"Found {len(response.data)} status change records")
        return response.data

    def get_feedbacks_by_interviewer(
        self,
        interviewer: int,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Get all feedbacks created by a specific interviewer.

        :param interviewer: Interviewer user ID
        :param limit: Maximum number of results
        :param offset: Number of records to skip
        :return: List of feedback records
        """
        logger.debug(f"Getting feedbacks by interviewer: {interviewer}")

        response: APIResponse = (
            self._get_active_query()
            .eq("interviewer", interviewer)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        logger.debug(f"Found {len(response.data)} feedbacks by interviewer {interviewer}")
        return response.data

    def count_feedbacks_for_candidate_position(
        self,
        candidate_id: int,
        position_id: int,
        is_status_change: bool | None = None,
    ) -> int:
        """Count feedbacks for a candidate-position pair.

        :param candidate_id: Candidate ID
        :param position_id: Position ID
        :param is_status_change: Filter by type (None=all, True=status changes, False=interviews)
        :return: Count of feedback records
        """
        logger.debug(
            f"Counting feedbacks for candidate={candidate_id}, position={position_id}, "
            f"is_status_change={is_status_change}"
        )

        query = (
            self._get_active_query()
            .eq("candidate_id", candidate_id)
            .eq("position_id", position_id)
        )

        if is_status_change is not None:
            query = query.eq("is_status_change", is_status_change)

        response: APIResponse = query.execute()

        count = len(response.data)
        logger.debug(f"Found {count} feedback records")
        return count
