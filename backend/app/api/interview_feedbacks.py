"""Interview feedback API routes with authentication.

v2.0: Supports three types of records:
  - Interview evaluations (interview_rating: 1-4)
  - AI evaluations (ai_rating: 1-10)
  - Status/log records (new_status: status enum)
"""

from __future__ import annotations

import logging
from typing import Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, ConfigDict

from app.api.dependencies import get_interview_feedback_service
from app.middleware.auth import require_organization
from app.models.auth import CurrentUser
from app.models.interview_feedback import (
    AIEvaluationCreate,
    InterviewEvaluationCreate,
    InterviewFeedbackCreate,
    InterviewFeedbackResponse,
    InterviewFeedbackUpdate,
    StatusChangeCreate,
)
from app.services.interview_feedback_service import InterviewFeedbackService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/interview-feedbacks", tags=["Interview Feedbacks"])


# ============================================================================
# Response Models
# ============================================================================


class FeedbackListResponse(BaseModel):
    """Response model for feedback list."""

    model_config = ConfigDict(from_attributes=True)

    feedbacks: list[dict[str, Any]]
    total: int
    limit: int
    offset: int


# ============================================================================
# API Endpoints
# ============================================================================


@router.post(
    "/", response_model=InterviewFeedbackResponse, status_code=status.HTTP_201_CREATED
)
async def create_interview_feedback(
    feedback_data: InterviewFeedbackCreate,
    current_user: CurrentUser = Depends(require_organization),
) -> InterviewFeedbackResponse:
    """Create a new interview feedback record (generic endpoint).

    Must specify exactly one of: interview_rating, ai_rating, or new_status.
    For convenience, use specialized endpoints:
    - POST /interview-evaluation for human interviews
    - POST /ai-evaluation for AI evaluations
    - POST /status-change for status updates

    :param feedback_data: Interview feedback creation data
    :param current_user: Current authenticated user
    :return: Created feedback record
    """
    logger.info(
        f"POST /api/interview-feedbacks - candidate={feedback_data.candidate_id}, "
        f"position={feedback_data.position_id}"
    )

    try:
        feedback_service = get_interview_feedback_service(org_id=current_user.org_id)

        # Auto-fill interview_date if not provided
        data = feedback_data.model_dump(mode='json')  # Use json mode to serialize UUID to string
        if data.get("interview_date") is None:
            from datetime import UTC, datetime
            data["interview_date"] = datetime.now(UTC).date().isoformat()

        feedback = await run_in_threadpool(
            feedback_service.create,
            data,
        )
        logger.info(f"Interview feedback created: {feedback['id']}")
        return InterviewFeedbackResponse(**feedback)

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error creating interview feedback: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create interview feedback: {e!s}",
        )


@router.post(
    "/status-change",
    response_model=InterviewFeedbackResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_status_change(
    status_change_data: StatusChangeCreate,
    current_user: CurrentUser = Depends(require_organization),
) -> InterviewFeedbackResponse:
    """Create a status change record.

    This is a convenience endpoint for recording status changes.
    Automatically sets is_status_change=True.

    :param status_change_data: Status change data
    :param feedback_service: Injected interview feedback service
    :return: Created status change record
    """
    logger.info(
        f"POST /api/interview-feedbacks/status-change - candidate={status_change_data.candidate_id}, "
        f"position={status_change_data.position_id}, status={status_change_data.new_status}"
    )

    try:
        feedback_service = get_interview_feedback_service(org_id=current_user.org_id)
        # Convert to InterviewFeedbackCreate
        feedback_data = status_change_data.to_feedback_create()

        # Auto-fill interview_date if not provided
        data = feedback_data.model_dump(mode='json')  # Use json mode to serialize UUID to string
        if data.get("interview_date") is None:
            from datetime import UTC, datetime
            data["interview_date"] = datetime.now(UTC).date().isoformat()

        record = await run_in_threadpool(
            feedback_service.create,
            data,
        )
        logger.info(f"Status change record created: {record['id']}")
        return InterviewFeedbackResponse(**record)

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error creating status change: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create status change: {e!s}",
        )


@router.get("/candidate/{candidate_id}", response_model=FeedbackListResponse)
async def get_candidate_execution_records(
    candidate_id: int,
    current_user: CurrentUser = Depends(require_organization),
    record_type: Literal["interview", "ai", "status"] | None = Query(
        None, description="Filter by record type: interview, ai, status, or null (all)"
    ),
    limit: int = Query(100, ge=1, le=200, description="Results per page"),
    offset: int = Query(0, ge=0, description="Page offset"),
) -> FeedbackListResponse:
    """Get all feedback records for a candidate (across all positions).

    Returns interview evaluations, AI evaluations, and status changes (chronological order, newest first).

    :param candidate_id: Candidate ID
    :param record_type: Filter by type: 'interview', 'ai', 'status', or None (all)
    :param limit: Maximum number of results
    :param offset: Number of records to skip
    :param current_user: Current authenticated user
    :return: Paginated feedback records list
    """
    logger.info(
        f"GET /api/interview-feedbacks/candidate/{candidate_id} - "
        f"record_type={record_type}"
    )

    try:
        feedback_service = get_interview_feedback_service(org_id=current_user.org_id)
        result = await run_in_threadpool(
            feedback_service.get_feedbacks_for_candidate,
            candidate_id,
            record_type=record_type,
            limit=limit,
            offset=offset,
        )

        return FeedbackListResponse(**result)

    except Exception as e:
        logger.error(f"Error getting feedback records: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get feedback records: {e!s}",
        )


@router.get("/", response_model=FeedbackListResponse)
async def get_feedbacks(
    candidate_id: int = Query(..., description="Candidate ID"),
    position_id: int = Query(..., description="Position ID"),
    current_user: CurrentUser = Depends(require_organization),
    record_type: Literal["interview", "ai", "status"] | None = Query(
        None, description="Filter by record type: interview, ai, status, or null (all)"
    ),
    limit: int = Query(100, ge=1, le=200, description="Results per page"),
    offset: int = Query(0, ge=0, description="Page offset"),
) -> FeedbackListResponse:
    """Get all feedback records for a candidate-position pair.

    Returns interview evaluations, AI evaluations, and status changes (chronological order).

    :param candidate_id: Candidate ID
    :param position_id: Position ID
    :param record_type: Filter by type: 'interview', 'ai', 'status', or None (all)
    :param limit: Maximum number of results
    :param offset: Number of records to skip
    :param current_user: Current authenticated user
    :return: Paginated feedback list
    """
    logger.info(
        f"GET /api/interview-feedbacks - candidate={candidate_id}, position={position_id}, "
        f"record_type={record_type}"
    )

    try:
        feedback_service = get_interview_feedback_service(org_id=current_user.org_id)
        result = await run_in_threadpool(
            feedback_service.get_feedbacks_for_candidate_position,
            candidate_id,
            position_id,
            record_type=record_type,
            limit=limit,
            offset=offset,
        )

        return FeedbackListResponse(**result)

    except Exception as e:
        logger.error(f"Error getting feedbacks: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get feedbacks: {e!s}",
        )


@router.get("/interviewer/{interviewer_id}", response_model=list[dict[str, Any]])
async def get_feedbacks_by_interviewer(
    interviewer_id: UUID,
    current_user: CurrentUser = Depends(require_organization),
    limit: int = Query(100, ge=1, le=200, description="Results per page"),
    offset: int = Query(0, ge=0, description="Page offset"),
) -> list[dict[str, Any]]:
    """Get all feedbacks created by a specific interviewer.

    :param interviewer_id: Interviewer UUID
    :param limit: Maximum number of results
    :param offset: Number of records to skip
    :param current_user: Current authenticated user
    :return: List of feedback records
    """
    logger.info(f"GET /api/interview-feedbacks/interviewer/{interviewer_id}")

    try:
        feedback_service = get_interview_feedback_service(org_id=current_user.org_id)
        feedbacks = await run_in_threadpool(
            feedback_service.get_feedbacks_by_interviewer,
            interviewer_id,
            limit=limit,
            offset=offset,
        )

        return feedbacks

    except Exception as e:
        logger.error(f"Error getting feedbacks by interviewer: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get feedbacks: {e!s}",
        )


@router.get("/{feedback_id}", response_model=InterviewFeedbackResponse)
async def get_feedback(
    feedback_id: int,
    current_user: CurrentUser = Depends(require_organization),
) -> InterviewFeedbackResponse:
    """Get feedback details by ID.

    :param feedback_id: Feedback record ID
    :param feedback_service: Injected interview feedback service
    :return: Feedback details
    :raises HTTPException: If feedback not found
    """
    logger.info(f"GET /api/interview-feedbacks/{feedback_id}")

    feedback_service = get_interview_feedback_service(org_id=current_user.org_id)
    feedback = await run_in_threadpool(feedback_service.get_by_id, feedback_id)

    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feedback {feedback_id} not found",
        )

    return InterviewFeedbackResponse(**feedback)


@router.patch("/{feedback_id}", response_model=InterviewFeedbackResponse)
async def update_feedback(
    feedback_id: int,
    feedback_data: InterviewFeedbackUpdate,
    current_user: CurrentUser = Depends(require_organization),
) -> InterviewFeedbackResponse:
    """Update interview feedback.

    Note: Only interview evaluation records can be edited.
    Status change records are immutable.

    :param feedback_id: Feedback record ID
    :param feedback_data: Feedback update data
    :param feedback_service: Injected interview feedback service
    :return: Updated feedback
    :raises HTTPException: If feedback not found or is a status change record
    """
    logger.info(f"PATCH /api/interview-feedbacks/{feedback_id}")

    feedback_service = get_interview_feedback_service(org_id=current_user.org_id)

    # Check if feedback exists
    if not await run_in_threadpool(feedback_service.exists, feedback_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feedback {feedback_id} not found",
        )

    try:
        # Only include fields that were actually provided
        update_data = feedback_data.model_dump(exclude_unset=True)

        feedback = await run_in_threadpool(
            feedback_service.update,
            feedback_id,
            update_data,
        )
        logger.info(f"Feedback updated: {feedback_id}")
        return InterviewFeedbackResponse(**feedback)

    except ValueError as e:
        # Trying to edit status change record or validation error
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error updating feedback: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update feedback: {e!s}",
        )
