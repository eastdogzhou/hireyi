"""Interview feedback and status change tracking service.

v2.0: Refactored to support three mutually exclusive record types:
1. Interview evaluation records (interview_rating: 1-4)
2. AI evaluation records (ai_rating: 1-10)
3. Status/log records (new_status: status enum)
"""

import logging
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from postgrest import APIResponse
from supabase import Client

from app.services.base import BaseService

logger = logging.getLogger(__name__)


class InterviewFeedbackService(BaseService[dict[str, Any]]):
    """Interview feedback and status change tracking service (v2.0).

    Provides comprehensive feedback management including:
    - Creating and editing interview evaluations (human)
    - Creating AI evaluation records
    - Recording status change history
    - Querying feedback by candidate/position
    - Timeline view support
    """

    def __init__(self, supabase: Client, org_id: str | None = None):
        """Initialize interview feedback service.

        :param supabase: Supabase client instance
        :param org_id: Organization ID for data isolation (optional)
        """
        # Disable auto-injection of org_id because interview_feedbacks table doesn't have org_id column
        # (it uses RLS via candidates table for organization isolation)
        super().__init__(supabase, "interview_feedbacks", org_id=org_id, auto_inject_org_id=False)
        logger.info(
            f"InterviewFeedbackService v2.0 initialized"
            f"{' with org_id=' + org_id if org_id else ''}"
        )

    def create_interview_feedback(
        self,
        candidate_id: int,
        interviewer: UUID,
        interview_rating: int,
        comments: str,
        position_id: int | None = None,
        interview_date: str | None = None,
        interviewer_type: str = "user",
    ) -> dict[str, Any]:
        """Create interview evaluation feedback (human interviewer).

        :param candidate_id: Candidate ID
        :param interviewer: Interviewer UUID
        :param interview_rating: Interview rating (1-4 scale)
        :param comments: Interview feedback comments (required)
        :param position_id: Position ID (optional, for position-specific feedback)
        :param interview_date: Interview date in YYYY-MM-DD format (optional, defaults to today)
        :param interviewer_type: Interviewer type (default: 'user')
        :return: Created feedback data
        :raises ValueError: If rating is invalid
        """
        logger.info(
            f"Creating interview feedback: candidate={candidate_id}, "
            f"position={position_id}, interviewer={interviewer}, rating={interview_rating}"
        )

        # Validate rating
        if not (1 <= interview_rating <= 4):
            raise ValueError("Interview rating must be between 1 and 4")

        # Auto-fill interview_date if not provided
        if not interview_date:
            interview_date = datetime.now(UTC).date().isoformat()

        # Prepare data
        data = {
            "candidate_id": candidate_id,
            "position_id": position_id,
            "interviewer": str(interviewer),
            "interviewer_type": interviewer_type,
            "interview_rating": interview_rating,
            "comments": comments,
            "interview_date": interview_date,
            "ai_rating": None,
            "new_status": None,
        }

        feedback = self.create(data)
        logger.info(f"Interview feedback created successfully: {feedback.get('id')}")
        return feedback

    def create_ai_evaluation(
        self,
        candidate_id: int,
        ai_agent_id: UUID,
        ai_rating: int,
        comments: str,
        position_id: int | None = None,
    ) -> dict[str, Any]:
        """Create AI evaluation record.

        :param candidate_id: Candidate ID
        :param ai_agent_id: AI agent UUID
        :param ai_rating: AI rating (1-10 scale)
        :param comments: AI evaluation comments (required)
        :param position_id: Position ID (optional)
        :return: Created AI evaluation record
        :raises ValueError: If rating is invalid
        """
        logger.info(
            f"Creating AI evaluation: candidate={candidate_id}, "
            f"position={position_id}, agent={ai_agent_id}, rating={ai_rating}"
        )

        # Validate rating
        if not (1 <= ai_rating <= 10):
            raise ValueError("AI rating must be between 1 and 10")

        # Use created_at date as interview_date
        interview_date = datetime.now(UTC).date().isoformat()

        # Prepare data
        data = {
            "candidate_id": candidate_id,
            "position_id": position_id,
            "interviewer": str(ai_agent_id),
            "interviewer_type": "agent",
            "interview_date": interview_date,
            "comments": comments,
            "interview_rating": None,
            "ai_rating": ai_rating,
            "new_status": None,
        }

        record = self.create(data)
        logger.info(f"AI evaluation created successfully: {record.get('id')}")
        return record

    def create_status_change_record(
        self,
        candidate_id: int,
        operator: UUID,
        new_status: str,
        comments: str,
        position_id: int | None = None,
        operator_type: str = "user",
    ) -> dict[str, Any]:
        """Create status change history record.

        :param candidate_id: Candidate ID
        :param operator: Operator UUID who made the status change
        :param new_status: New status value
        :param comments: Reason for status change (required)
        :param position_id: Position ID (optional, for position-specific status changes)
        :param operator_type: Operator type (default: 'user')
        :return: Created status change record
        :raises ValueError: If status is invalid
        """
        logger.info(
            f"Creating status change record: candidate={candidate_id}, "
            f"position={position_id}, new_status={new_status}"
        )

        # Validate status
        valid_statuses = [
            "screening",
            "interview",
            "offer",
            "hired",
            "rejected",
            "withdrawn",
        ]
        if new_status not in valid_statuses:
            raise ValueError(
                f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )

        # Use created_at date as interview_date
        interview_date = datetime.now(UTC).date().isoformat()

        # Prepare data
        data = {
            "candidate_id": candidate_id,
            "position_id": position_id,
            "interviewer": str(operator),
            "interviewer_type": operator_type,
            "interview_date": interview_date,
            "comments": comments,
            "interview_rating": None,
            "ai_rating": None,
            "new_status": new_status,
        }

        record = self.create(data)
        logger.info(f"Status change record created successfully: {record.get('id')}")
        return record

    def create_system_log(
        self,
        candidate_id: int,
        comments: str,
        position_id: int | None = None,
        system_id: UUID | None = None,
    ) -> dict[str, Any]:
        """Create system log record.

        Used for automated system events (e.g., position association, automated actions).

        :param candidate_id: Candidate ID
        :param comments: Log description
        :param position_id: Position ID (optional)
        :param system_id: System UUID (optional, defaults to special system UUID)
        :return: Created system log record
        """
        logger.info(
            f"Creating system log: candidate={candidate_id}, "
            f"position={position_id}, log={comments}"
        )

        # Use special system UUID if not provided
        if not system_id:
            system_id = UUID("00000000-0000-0000-0000-000000000000")

        # Use created_at date as interview_date
        interview_date = datetime.now(UTC).date().isoformat()

        # Prepare data
        data = {
            "candidate_id": candidate_id,
            "position_id": position_id,
            "interviewer": str(system_id),
            "interviewer_type": "system",
            "interview_date": interview_date,
            "comments": comments,
            "interview_rating": None,
            "ai_rating": None,
            "new_status": None,
        }

        record = self.create(data)
        logger.info(f"System log created successfully: {record.get('id')}")
        return record

    def update_feedback(
        self,
        record_id: int,
        interview_rating: int | None = None,
        ai_rating: int | None = None,
        comments: str | None = None,
        interview_date: str | None = None,
    ) -> dict[str, Any]:
        """Update interview or AI evaluation feedback.

        Note: Cannot edit status change records or change record type.

        :param record_id: Feedback record ID
        :param interview_rating: New interview rating (1-4, optional)
        :param ai_rating: New AI rating (1-10, optional)
        :param comments: New comments (optional)
        :param interview_date: New interview date (optional)
        :return: Updated feedback data
        :raises ValueError: If trying to edit status record or invalid rating
        """
        logger.info(f"Updating feedback: {record_id}")

        # Get current record to check type
        current = self.get_by_id(record_id)
        if not current:
            raise ValueError(f"Feedback {record_id} not found")

        # Prevent editing status change records
        if current.get("new_status") is not None:
            raise ValueError("Cannot edit status change records")

        # Validate ratings if provided
        if interview_rating is not None:
            if not (1 <= interview_rating <= 4):
                raise ValueError("Interview rating must be between 1 and 4")
            if current.get("interview_rating") is None:
                raise ValueError("Cannot change record type to interview rating")

        if ai_rating is not None:
            if not (1 <= ai_rating <= 10):
                raise ValueError("AI rating must be between 1 and 10")
            if current.get("ai_rating") is None:
                raise ValueError("Cannot change record type to AI rating")

        # Prepare update data
        update_data = {}
        if interview_rating is not None:
            update_data["interview_rating"] = interview_rating
        if ai_rating is not None:
            update_data["ai_rating"] = ai_rating
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
        record_type: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> dict[str, Any]:
        """Get all feedback records for a candidate (across all positions).

        :param candidate_id: Candidate ID
        :param record_type: Filter by type: 'interview', 'ai', 'status', or None (all)
        :param limit: Maximum number of results
        :param offset: Number of records to skip
        :return: Dictionary with feedbacks list, total count, limit, and offset
        """
        logger.debug(f"Getting feedback records for candidate={candidate_id}, type={record_type}")

        # Start with base query
        query = self._get_active_query(count="exact").eq("candidate_id", candidate_id)

        # Filter by record type
        if record_type == "interview":
            query = query.not_.is_("interview_rating", "null")
        elif record_type == "ai":
            query = query.not_.is_("ai_rating", "null")
        elif record_type == "status":
            query = query.not_.is_("new_status", "null")

        # Sort by creation time (newest first)
        response: APIResponse = (
            query.order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        feedbacks = response.data
        total = response.count if response.count is not None else len(feedbacks)

        logger.debug(f"Found {total} feedback records for candidate")

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
        record_type: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> dict[str, Any]:
        """Get all feedbacks for a candidate-position pair.

        :param candidate_id: Candidate ID
        :param position_id: Position ID
        :param record_type: Filter by type: 'interview', 'ai', 'status', or None (all)
        :param limit: Maximum number of results
        :param offset: Number of records to skip
        :return: Dictionary with feedbacks list, total count, limit, and offset
        """
        logger.debug(
            f"Getting feedbacks for candidate={candidate_id}, position={position_id}, type={record_type}"
        )

        # Start with base query
        query = (
            self._get_active_query(count="exact")
            .eq("candidate_id", candidate_id)
            .eq("position_id", position_id)
        )

        # Filter by record type
        if record_type == "interview":
            query = query.not_.is_("interview_rating", "null")
        elif record_type == "ai":
            query = query.not_.is_("ai_rating", "null")
        elif record_type == "status":
            query = query.not_.is_("new_status", "null")

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

    def get_interview_evaluations_only(
        self,
        candidate_id: int,
        position_id: int | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Get only interview evaluation records (human ratings).

        :param candidate_id: Candidate ID
        :param position_id: Position ID (optional)
        :param limit: Maximum number of results
        :param offset: Number of records to skip
        :return: List of interview evaluation records
        """
        logger.debug(
            f"Getting interview evaluations for candidate={candidate_id}, position={position_id}"
        )

        query = self._get_active_query().eq("candidate_id", candidate_id)

        if position_id is not None:
            query = query.eq("position_id", position_id)

        response: APIResponse = (
            query.not_.is_("interview_rating", "null")
            .order("created_at", desc=False)
            .range(offset, offset + limit - 1)
            .execute()
        )

        logger.debug(f"Found {len(response.data)} interview evaluations")
        return response.data

    def get_ai_evaluations_only(
        self,
        candidate_id: int,
        position_id: int | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Get only AI evaluation records.

        :param candidate_id: Candidate ID
        :param position_id: Position ID (optional)
        :param limit: Maximum number of results
        :param offset: Number of records to skip
        :return: List of AI evaluation records
        """
        logger.debug(
            f"Getting AI evaluations for candidate={candidate_id}, position={position_id}"
        )

        query = self._get_active_query().eq("candidate_id", candidate_id)

        if position_id is not None:
            query = query.eq("position_id", position_id)

        response: APIResponse = (
            query.not_.is_("ai_rating", "null")
            .order("created_at", desc=False)
            .range(offset, offset + limit - 1)
            .execute()
        )

        logger.debug(f"Found {len(response.data)} AI evaluations")
        return response.data

    def get_status_change_history(
        self,
        candidate_id: int,
        position_id: int | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Get only status change history.

        :param candidate_id: Candidate ID
        :param position_id: Position ID (optional)
        :param limit: Maximum number of results
        :param offset: Number of records to skip
        :return: List of status change records
        """
        logger.debug(
            f"Getting status change history for candidate={candidate_id}, position={position_id}"
        )

        query = self._get_active_query().eq("candidate_id", candidate_id)

        if position_id is not None:
            query = query.eq("position_id", position_id)

        response: APIResponse = (
            query.not_.is_("new_status", "null")
            .order("created_at", desc=False)
            .range(offset, offset + limit - 1)
            .execute()
        )

        logger.debug(f"Found {len(response.data)} status change records")
        return response.data

    def get_feedbacks_by_interviewer(
        self,
        interviewer: UUID,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Get all feedbacks created by a specific interviewer.

        :param interviewer: Interviewer UUID
        :param limit: Maximum number of results
        :param offset: Number of records to skip
        :return: List of feedback records
        """
        logger.debug(f"Getting feedbacks by interviewer: {interviewer}")

        response: APIResponse = (
            self._get_active_query()
            .eq("interviewer", str(interviewer))
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        logger.debug(
            f"Found {len(response.data)} feedbacks by interviewer {interviewer}"
        )
        return response.data

    def count_feedbacks_for_candidate_position(
        self,
        candidate_id: int,
        position_id: int,
        record_type: str | None = None,
    ) -> int:
        """Count feedbacks for a candidate-position pair.

        :param candidate_id: Candidate ID
        :param position_id: Position ID
        :param record_type: Filter by type: 'interview', 'ai', 'status', or None (all)
        :return: Count of feedback records
        """
        logger.debug(
            f"Counting feedbacks for candidate={candidate_id}, position={position_id}, type={record_type}"
        )

        query = (
            self._get_active_query()
            .eq("candidate_id", candidate_id)
            .eq("position_id", position_id)
        )

        # Filter by record type
        if record_type == "interview":
            query = query.not_.is_("interview_rating", "null")
        elif record_type == "ai":
            query = query.not_.is_("ai_rating", "null")
        elif record_type == "status":
            query = query.not_.is_("new_status", "null")

        response: APIResponse = query.execute()

        count = len(response.data)
        logger.debug(f"Found {count} feedback records")
        return count
