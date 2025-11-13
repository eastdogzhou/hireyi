"""Position-Candidate relationship management service.

This service handles all position-candidate relationship operations including:
- Creating and managing associations with scoring
- Status management (screening, interview, offer, hired, rejected, withdrawn)
- Score calculation (relevance, fit, overall)
- Filtering and sorting by status/score
- Deduplication enforcement
"""

import logging
from typing import Any

from postgrest import APIResponse
from supabase import Client

from app.services.base import BaseService

logger = logging.getLogger(__name__)


class PositionCandidateService(BaseService[dict[str, Any]]):
    """Position-Candidate relationship service.

    Provides comprehensive relationship management including:
    - Association creation with deduplication
    - Automatic score calculation
    - Status management
    - Advanced filtering and sorting
    """

    def __init__(self, supabase: Client, org_id: str | None = None):
        """Initialize position-candidate service.

        :param supabase: Supabase client instance
        :param org_id: Organization ID for data isolation (optional)
        """
        # Disable auto-injection of org_id because position_candidates table doesn't have org_id column
        # (it uses RLS via positions table for organization isolation)
        super().__init__(supabase, "position_candidates", org_id=org_id, auto_inject_org_id=False)
        # Import here to avoid circular import
        from app.services.interview_feedback_service import InterviewFeedbackService

        self.feedback_service = InterviewFeedbackService(supabase, org_id=org_id)
        logger.info(f"PositionCandidateService initialized{' with org_id=' + org_id if org_id else ''}")

    def _calculate_overall_score(
        self,
        relevance_score: int,
        fit_score: int,
    ) -> tuple[int, int]:
        """Calculate overall scores from relevance and fit scores.

        Formula: overall_score_numeric = (relevance × 0.6 + fit × 0.4) × 25

        :param relevance_score: Skills relevance score (1-4)
        :param fit_score: Experience fit score (1-4)
        :return: Tuple of (overall_score (1-4), overall_score_numeric (0-100))
        """
        # Calculate weighted average
        weighted_avg = (relevance_score * 0.6) + (fit_score * 0.4)

        # Convert to 0-100 scale for sorting
        overall_score_numeric = int(weighted_avg * 25)

        # Round half up (避免银行家舍入导致的偏差)
        overall_score = int(weighted_avg + 0.5)

        logger.debug(
            f"Calculated scores: relevance={relevance_score}, fit={fit_score}, "
            f"overall={overall_score}, numeric={overall_score_numeric}"
        )

        return overall_score, overall_score_numeric

    def create_association(
        self,
        position_id: int,
        candidate_id: int,
        relevance_score: int,
        fit_score: int,
        current_status: str = "screening",
        operator: int | None = None,
        source: str = "manual",
    ) -> dict[str, Any]:
        """Create position-candidate association with scoring.

        Automatically calculates overall scores. Enforces uniqueness via UNIQUE constraint.
        Automatically creates an execution record to track the association event.

        :param position_id: Position ID
        :param candidate_id: Candidate ID
        :param relevance_score: Skills relevance score (1-4)
        :param fit_score: Experience fit score (1-4)
        :param current_status: Initial status (default: screening)
        :param operator: Operator user ID (for execution record)
        :param source: Association source: "manual", "smart_screening", "ai"
        :return: Created association data
        :raises ValueError: If association already exists or scores are invalid
        """
        logger.info(
            f"Creating association: position={position_id}, candidate={candidate_id}, "
            f"relevance={relevance_score}, fit={fit_score}, source={source}"
        )

        # Validate scores
        if not (1 <= relevance_score <= 4 and 1 <= fit_score <= 4):
            raise ValueError("Scores must be between 1 and 4")

        # Calculate overall scores
        overall_score, overall_score_numeric = self._calculate_overall_score(
            relevance_score, fit_score
        )

        # Prepare data
        data = {
            "position_id": position_id,
            "candidate_id": candidate_id,
            "relevance_score": relevance_score,
            "fit_score": fit_score,
            "overall_score": overall_score,
            "overall_score_numeric": overall_score_numeric,
            "current_status": current_status,
        }

        try:
            # Create association directly without org_id injection
            # NOTE: position_candidates table does not have org_id column (MVP phase)
            response: APIResponse = (
                self.supabase.table(self.table_name).insert(data).execute()
            )
            association = response.data[0]
            logger.info(f"Association created successfully: {association.get('id')}")

            # Auto-create execution record for this association event
            try:
                self.feedback_service.create_position_association_record(
                    candidate_id=candidate_id,
                    position_id=position_id,
                    operator=operator,
                    source=source,
                )
                logger.info(
                    f"Execution record created for association: position={position_id}, candidate={candidate_id}"
                )
            except Exception as feedback_error:
                # Log but don't fail the association creation
                logger.error(
                    f"Failed to create execution record: {feedback_error}",
                    exc_info=True,
                )

            return association
        except Exception as e:
            # Check if it's a duplicate constraint error
            if "duplicate" in str(e).lower() or "unique" in str(e).lower():
                logger.warning(
                    f"Association already exists: position={position_id}, candidate={candidate_id}"
                )
                raise ValueError(
                    f"Association between position {position_id} and candidate {candidate_id} already exists"
                )
            raise

    def update_scores(
        self,
        record_id: int,
        relevance_score: int | None = None,
        fit_score: int | None = None,
    ) -> dict[str, Any]:
        """Update scores and recalculate overall scores.

        :param record_id: Association ID
        :param relevance_score: New relevance score (1-4, optional)
        :param fit_score: New fit score (1-4, optional)
        :return: Updated association data
        :raises ValueError: If scores are invalid
        """
        logger.info(f"Updating scores for association: {record_id}")

        # Get current data
        current = self.get_by_id(record_id)
        if not current:
            raise ValueError(f"Association {record_id} not found")

        # Use new scores or keep existing
        new_relevance = (
            relevance_score
            if relevance_score is not None
            else current["relevance_score"]
        )
        new_fit = fit_score if fit_score is not None else current["fit_score"]

        # Validate scores
        if not (1 <= new_relevance <= 4 and 1 <= new_fit <= 4):
            raise ValueError("Scores must be between 1 and 4")

        # Recalculate overall scores
        overall_score, overall_score_numeric = self._calculate_overall_score(
            new_relevance, new_fit
        )

        # Update data
        update_data = {
            "relevance_score": new_relevance,
            "fit_score": new_fit,
            "overall_score": overall_score,
            "overall_score_numeric": overall_score_numeric,
        }

        association = self.update(record_id, update_data)
        logger.info(f"Scores updated successfully: {record_id}")
        return association

    def update_status(
        self,
        record_id: int,
        new_status: str,
    ) -> dict[str, Any]:
        """Update candidate status for this position.

        :param record_id: Association ID
        :param new_status: New status (screening, interview, offer, hired, rejected, withdrawn)
        :return: Updated association data
        """
        logger.info(f"Updating status for association {record_id} to: {new_status}")

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

        association = self.update(record_id, {"current_status": new_status})
        logger.info(f"Status updated successfully: {record_id}")
        return association

    def get_candidates_for_position(
        self,
        position_id: int,
        status: str | None = None,
        min_score: int | None = None,
        sort_by: str = "score",  # "score" or "time"
        limit: int = 100,
        offset: int = 0,
    ) -> dict[str, Any]:
        """Get all candidates associated with a position.

        :param position_id: Position ID
        :param status: Filter by status (optional)
        :param min_score: Minimum overall_score_numeric (0-100, optional)
        :param sort_by: Sort by "score" (desc) or "time" (updated_at desc)
        :param limit: Maximum number of results
        :param offset: Number of records to skip
        :return: Dictionary with associations list, total count, limit, and offset
        """
        logger.debug(
            f"Getting candidates for position {position_id}: status={status}, "
            f"min_score={min_score}, sort_by={sort_by}"
        )

        # Start with base query
        query = self._get_active_query(count="exact").eq("position_id", position_id)

        # Apply filters
        if status:
            query = query.eq("current_status", status)

        if min_score is not None:
            query = query.gte("overall_score_numeric", min_score)

        # Apply sorting
        if sort_by == "score":
            query = query.order("overall_score_numeric", desc=True)
        else:  # sort_by == "time"
            query = query.order("updated_at", desc=True)

        # Execute query with pagination
        response: APIResponse = query.range(offset, offset + limit - 1).execute()

        associations = response.data
        total = response.count if response.count is not None else len(associations)

        logger.debug(f"Found {total} candidates for position {position_id}")

        return {
            "associations": associations,
            "total": total,
            "limit": limit,
            "offset": offset,
        }

    def get_positions_for_candidate(
        self,
        candidate_id: int,
        status: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> dict[str, Any]:
        """Get all positions associated with a candidate.

        :param candidate_id: Candidate ID
        :param status: Filter by status (optional)
        :param limit: Maximum number of results
        :param offset: Number of records to skip
        :return: Dictionary with associations list, total count, limit, and offset
        """
        logger.debug(f"Getting positions for candidate {candidate_id}: status={status}")

        # Start with base query
        query = self._get_active_query(count="exact").eq("candidate_id", candidate_id)

        # Apply filters
        if status:
            query = query.eq("current_status", status)

        # Sort by updated time (most recent first)
        query = query.order("updated_at", desc=True)

        # Execute query with pagination
        response: APIResponse = query.range(offset, offset + limit - 1).execute()

        associations = response.data
        total = response.count if response.count is not None else len(associations)

        logger.debug(f"Found {total} positions for candidate {candidate_id}")

        return {
            "associations": associations,
            "total": total,
            "limit": limit,
            "offset": offset,
        }

    def check_association_exists(
        self,
        position_id: int,
        candidate_id: int,
    ) -> bool:
        """Check if association between position and candidate exists.

        :param position_id: Position ID
        :param candidate_id: Candidate ID
        :return: True if exists, False otherwise
        """
        logger.debug(
            f"Checking association: position={position_id}, candidate={candidate_id}"
        )

        try:
            response: APIResponse = (
                self._get_active_query()
                .eq("position_id", position_id)
                .eq("candidate_id", candidate_id)
                .maybe_single()
                .execute()
            )

            if response is None:
                logger.debug("Association check returned None response")
                return False

            exists = response.data is not None
            logger.debug(f"Association exists: {exists}")
            return exists
        except Exception as e:
            # Handle Supabase errors (e.g., 406 Not Acceptable)
            logger.warning(f"Error checking association: {e}")
            return False

    def get_association(
        self,
        position_id: int,
        candidate_id: int,
    ) -> dict[str, Any] | None:
        """Get association by position and candidate IDs.

        :param position_id: Position ID
        :param candidate_id: Candidate ID
        :return: Association data or None if not found
        """
        logger.debug(
            f"Getting association: position={position_id}, candidate={candidate_id}"
        )

        response: APIResponse = (
            self._get_active_query()
            .eq("position_id", position_id)
            .eq("candidate_id", candidate_id)
            .maybe_single()
            .execute()
        )

        return response.data

    def count_by_status(
        self,
        position_id: int,
        status: str,
    ) -> int:
        """Count candidates with specific status for a position.

        :param position_id: Position ID
        :param status: Status to count
        :return: Count of candidates with the status
        """
        logger.debug(
            f"Counting candidates with status {status} for position {position_id}"
        )

        response: APIResponse = (
            self._get_active_query()
            .eq("position_id", position_id)
            .eq("current_status", status)
            .execute()
        )

        count = len(response.data)
        logger.debug(f"Found {count} candidates with status {status}")
        return count

    def get_candidates_with_details_for_position(
        self,
        position_id: int,
        status: str | None = None,
        candidate_name: str | None = None,
        sort_by: str = "overall_score_numeric",
        sort_order: str = "desc",
        limit: int = 20,
        offset: int = 0,
    ) -> dict[str, Any]:
        """Get all candidates with full details for a position (JOIN with candidates table).

        This method JOINs position_candidates with candidates table to return complete
        candidate information along with scoring and status data.

        :param position_id: Position ID
        :param status: Filter by status (optional)
        :param candidate_name: Filter by candidate name (fuzzy search, optional)
        :param sort_by: Sort field (default: overall_score_numeric)
        :param sort_order: Sort order "asc" or "desc" (default: desc)
        :param limit: Maximum number of results (default: 20)
        :param offset: Number of records to skip (default: 0)
        :return: Dictionary with candidates list, total count, limit, and offset
        """
        logger.debug(
            f"Getting candidates with details for position {position_id}: "
            f"status={status}, candidate_name={candidate_name}, "
            f"sort_by={sort_by}, sort_order={sort_order}"
        )

        # Build query with JOIN to candidates table
        # Use Supabase's PostgREST syntax: select="*, candidate:candidates(*)"
        # Note: Must specify select columns at the beginning, before filtering
        query = (
            self.supabase.table(self.table_name)
            .select("*, candidate:candidates(*)", count="exact")
            .eq("is_deleted", False)
            .eq("position_id", position_id)
        )

        # Apply filters
        if status:
            query = query.eq("current_status", status)

        # Candidate name search (nested filter on joined table)
        if candidate_name:
            # Use ilike for case-insensitive partial match
            query = query.filter("candidate.name", "ilike", f"%{candidate_name}%")

        # Apply sorting
        desc = sort_order.lower() == "desc"
        query = query.order(sort_by, desc=desc)

        # Execute query with pagination
        response: APIResponse = query.range(offset, offset + limit - 1).execute()

        candidates = response.data
        total = response.count if response.count is not None else len(candidates)

        logger.debug(
            f"Found {total} candidates with details for position {position_id}"
        )

        return {
            "candidates": candidates,
            "total": total,
            "limit": limit,
            "offset": offset,
        }
