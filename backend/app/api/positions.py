"""Position API routes with authentication."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, ConfigDict

from app.api.dependencies import (
    get_position_candidate_service,
    get_position_service,
    get_smart_screening_service,
)
from app.middleware.auth import require_organization
from app.models.auth import CurrentUser
from app.models.position import PositionCreate, PositionResponse, PositionUpdate
from app.services.position_candidate_service import PositionCandidateService
from app.services.position_service import PositionService
from app.services.smart_screening_service import SmartScreeningService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/positions", tags=["Positions"])


# ============================================================================
# Response Models
# ============================================================================


class PositionListResponse(BaseModel):
    """Response model for position list."""

    model_config = ConfigDict(from_attributes=True)

    positions: list[dict[str, Any]]
    total: int
    limit: int
    offset: int


class StatusUpdateRequest(BaseModel):
    """Request model for status update."""

    status: str  # "open" | "closed"


# ============================================================================
# API Endpoints
# ============================================================================


@router.get("/", response_model=PositionListResponse)
async def get_positions(
    current_user: CurrentUser = Depends(require_organization),
    title: str | None = Query(None, description="Title fuzzy search"),
    department: str | None = Query(None, description="Department filter"),
    status: str | None = Query(None, description="Status filter (open/closed)"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    offset: int = Query(0, ge=0, description="Page offset"),
    ) -> PositionListResponse:
    """Get paginated list of positions with optional filters.

    Supports:
    - Title fuzzy search (case-insensitive partial match)
    - Department filtering (exact match)
    - Status filtering (open/closed)
    - Pagination

    :param title: Title search query
    :param department: Department name to filter by
    :param status: Status to filter by (open/closed)
    :param limit: Maximum number of results
    :param offset: Number of records to skip
    :param position_service: Injected position service
    :return: Paginated position list
    """
    logger.info(
        f"GET /api/positions - user={current_user.user_id}, org={current_user.org_id}, "
        f"title={title}, department={department}, "
        f"status={status}, limit={limit}, offset={offset}"
    )

    try:


        position_service = get_position_service(org_id=current_user.org_id)
        result = await run_in_threadpool(
            position_service.search_positions,
            title_query=title,
            department=department,
            status=status,
            limit=limit,
            offset=offset,
        )

        return PositionListResponse(**result)

    except Exception as e:
        logger.error(f"Error searching positions: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search positions: {e!s}",
        )


@router.get("/{position_id}", response_model=PositionResponse)
async def get_position(
    position_id: int,
    current_user: CurrentUser = Depends(require_organization),
) -> PositionResponse:
    """Get position details by ID.

    Requires authentication and organization membership.

    :param position_id: Position ID
    :param current_user: Current authenticated user with organization
    :return: Position details
    :raises HTTPException: If position not found
    """
    logger.info(f"GET /api/positions/{position_id} - user={current_user.user_id}, org={current_user.org_id}")

    position_service = get_position_service(org_id=current_user.org_id)
    position = await run_in_threadpool(position_service.get_by_id, position_id)

    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Position {position_id} not found",
        )

    return PositionResponse(**position)


@router.post("/", response_model=PositionResponse, status_code=status.HTTP_201_CREATED)
async def create_position(
    position_data: PositionCreate,
    current_user: CurrentUser = Depends(require_organization),
) -> PositionResponse:
    """Create a new position.

    Requires authentication and organization membership.

    :param position_data: Position creation data
    :param current_user: Current authenticated user with organization
    :return: Created position
    """
    logger.info(f"POST /api/positions - user={current_user.user_id}, org={current_user.org_id}, title={position_data.title}")

    try:
        position_service = get_position_service(org_id=current_user.org_id)
        position = await run_in_threadpool(
            position_service.create,
            position_data.model_dump(),
        )
        logger.info(f"Position created: {position['id']}")
        return PositionResponse(**position)

    except Exception as e:
        logger.error(f"Error creating position: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create position: {e!s}",
        )


@router.patch("/{position_id}", response_model=PositionResponse)
async def update_position(
    position_id: int,
    position_data: PositionUpdate,
    current_user: CurrentUser = Depends(require_organization),
) -> PositionResponse:
    """Update position information.

    Requires authentication and organization membership.

    :param position_id: Position ID
    :param position_data: Position update data
    :param current_user: Current authenticated user with organization
    :return: Updated position
    :raises HTTPException: If position not found
    """
    logger.info(f"PATCH /api/positions/{position_id} - user={current_user.user_id}, org={current_user.org_id}")

    position_service = get_position_service(org_id=current_user.org_id)

    # Check if position exists
    if not await run_in_threadpool(position_service.exists, position_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Position {position_id} not found",
        )

    try:
        # Only include fields that were actually provided
        update_data = position_data.model_dump(exclude_unset=True)

        position = await run_in_threadpool(
            position_service.update,
            position_id,
            update_data,
        )
        logger.info(f"Position updated: {position_id}")
        return PositionResponse(**position)

    except Exception as e:
        logger.error(f"Error updating position: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update position: {e!s}",
        )


@router.patch("/{position_id}/status", response_model=PositionResponse)
async def update_position_status(
    position_id: int,
    status_update: StatusUpdateRequest,
    current_user: CurrentUser = Depends(require_organization),
) -> PositionResponse:
    """Update position status (open/closed).

    Requires authentication and organization membership.

    :param position_id: Position ID
    :param status_update: Status update request
    :param current_user: Current authenticated user with organization
    :return: Updated position
    :raises HTTPException: If position not found or invalid status
    """
    logger.info(
        f"PATCH /api/positions/{position_id}/status - user={current_user.user_id}, org={current_user.org_id}, status={status_update.status}"
    )

    # Validate status
    if status_update.status not in ["open", "closed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be either 'open' or 'closed'",
        )

    try:
        position_service = get_position_service(org_id=current_user.org_id)
        position = await run_in_threadpool(
            position_service.update_status,
            position_id,
            status_update.status,
        )
        logger.info(f"Position status updated: {position_id} -> {status_update.status}")
        return PositionResponse(**position)

    except ValueError as e:
        # Position not found or already deleted
        logger.error(f"Position not found: {position_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error updating position status: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update position status: {e!s}",
        )


@router.delete("/{position_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_position(
    position_id: int,
    current_user: CurrentUser = Depends(require_organization),
) -> None:
    """Soft delete a position.

    Requires authentication and organization membership.
    Also cascade soft-deletes all associated position_candidates records.

    :param position_id: Position ID
    :param current_user: Current authenticated user with organization
    :raises HTTPException: If position not found
    """
    logger.info(f"DELETE /api/positions/{position_id} - user={current_user.user_id}, org={current_user.org_id}")

    position_service = get_position_service(org_id=current_user.org_id)

    # Check if position exists
    if not await run_in_threadpool(position_service.exists, position_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Position {position_id} not found",
        )

    try:
        await run_in_threadpool(position_service.soft_delete, position_id)
        logger.info(f"Position soft deleted: {position_id}")

    except Exception as e:
        logger.error(f"Error deleting position: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete position: {e!s}",
        )


# ============================================================================
# Advanced Features
# ============================================================================


class SmartScreeningRequest(BaseModel):
    """Request model for smart screening."""

    max_candidates: int = Query(
        100, ge=1, le=200, description="Maximum number of candidates to screen"
    )
    recalculate_existing: bool = Query(
        True, description="Recalculate scores for existing associations"
    )


class SmartScreeningResponse(BaseModel):
    """Response model for smart screening."""

    status: str  # "success" | "no_candidates"
    position_id: int
    total_screened: int
    total_matched: int
    matches: list[dict[str, Any]]
    execution_time: float
    message: str


@router.post("/{position_id}/smart-screening", response_model=SmartScreeningResponse)
async def smart_screening(
    position_id: int,
    current_user: CurrentUser = Depends(require_organization),
    max_candidates: int = Query(
        100, ge=1, le=200, description="Maximum number of candidates to screen"
    ),
    min_score: int = Query(
        1, ge=1, le=4, description="Minimum score (1-4 stars) to accept"
    ),
    recalculate_existing: bool = Query(
        True, description="Recalculate scores for existing associations"
    ),
) -> SmartScreeningResponse:
    """Trigger intelligent candidate screening for a position.

    Requires authentication and organization membership.

    Two-phase approach:
    1. Pre-screening: Filter candidates by keywords (top 100-200)
    2. AI ranking: Use LLM to score pre-screened candidates

    :param position_id: Position ID
    :param current_user: Current authenticated user with organization
    :param max_candidates: Maximum number of candidates to link (default: 100)
    :param min_score: Minimum overall score to accept (1-4, default: 1)
    :param recalculate_existing: Whether to recalculate scores for existing links (default: True)
    :return: Screening results
    :raises HTTPException: If position not found or screening fails
    """
    logger.info(
        f"POST /api/positions/{position_id}/smart-screening - user={current_user.user_id}, org={current_user.org_id}, "
        f"max_candidates={max_candidates}, min_score={min_score}, recalculate={recalculate_existing}"
    )

    position_service = get_position_service(org_id=current_user.org_id)
    screening_service = get_smart_screening_service(org_id=current_user.org_id)

    # Check if position exists
    if not await run_in_threadpool(position_service.exists, position_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Position {position_id} not found",
        )

    try:
        # Run smart screening to add new candidates
        screening_result = await screening_service.run_smart_screening(
            position_id=position_id,
            max_candidates=max_candidates,
            min_score=min_score,
        )

        # Optionally recalculate scores for existing associations
        if recalculate_existing:
            logger.info("Recalculating scores for existing associations")
            await screening_service.recalculate_scores_for_position(
                position_id=position_id,
            )

        # Extract results
        total_screened = screening_result.get("ai_scored", 0)
        total_matched = screening_result.get("new_associations", 0)
        matches = screening_result.get("created_associations", [])
        execution_time = screening_result.get("execution_time", 0.0)

        status_msg = "success" if total_matched > 0 else "no_candidates"

        logger.info(
            f"Smart screening completed: position_id={position_id}, "
            f"screened={total_screened}, matched={total_matched}, time={execution_time:.2f}s"
        )

        return SmartScreeningResponse(
            status=status_msg,
            position_id=position_id,
            total_screened=total_screened,
            total_matched=total_matched,
            matches=matches,
            execution_time=execution_time,
            message=f"筛选完成: 已筛选 {total_screened} 人，匹配 {total_matched} 人",
        )

    except Exception as e:
        logger.error(f"Error during smart screening: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to perform smart screening: {e!s}",
        )


@router.get("/{position_id}/candidates")
async def get_position_candidates(
    position_id: int,
    current_user: CurrentUser = Depends(require_organization),
    candidate_status: str | None = Query(
        None, description="Filter by candidate status", alias="status"
    ),
    candidate_name: str | None = Query(None, description="Search by candidate name"),
    sort_by: str = Query("overall_score_numeric", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order (asc/desc)"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    offset: int = Query(0, ge=0, description="Page offset"),
) -> dict[str, Any]:
    """Get candidates associated with a position (with full candidate details).

    Requires authentication and organization membership.

    Returns position-candidate associations with complete candidate information
    via JOIN query. Supports filtering, searching, sorting, and pagination.

    :param position_id: Position ID
    :param current_user: Current authenticated user with organization
    :param candidate_status: Filter by candidate status (screening, interview, offer, etc.)
    :param candidate_name: Search by candidate name (fuzzy match)
    :param sort_by: Field to sort by (default: overall_score_numeric)
    :param sort_order: Sort order asc or desc (default: desc)
    :param limit: Maximum number of results (default: 20)
    :param offset: Number of records to skip (default: 0)
    :return: Paginated candidate list with scoring and details
    :raises HTTPException: If position not found
    """
    logger.info(
        f"GET /api/positions/{position_id}/candidates - user={current_user.user_id}, org={current_user.org_id}, "
        f"status={candidate_status}, candidate_name={candidate_name}, "
        f"sort_by={sort_by}, sort_order={sort_order}, "
        f"limit={limit}, offset={offset}"
    )

    position_service = get_position_service(org_id=current_user.org_id)
    pc_service = get_position_candidate_service(org_id=current_user.org_id)

    # Check if position exists
    if not await run_in_threadpool(position_service.exists, position_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Position {position_id} not found",
        )

    try:
        result = await run_in_threadpool(
            pc_service.get_candidates_with_details_for_position,
            position_id=position_id,
            status=candidate_status,
            candidate_name=candidate_name,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit,
            offset=offset,
        )

        logger.info(f"Found {result['total']} candidates for position {position_id}")

        return result

    except Exception as e:
        logger.error(f"Error fetching position candidates: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch position candidates: {e!s}",
        )


@router.post("/{position_id}/recalculate-scores")
async def recalculate_scores(
    position_id: int,
    current_user: CurrentUser = Depends(require_organization),
) -> dict[str, Any]:
    """Recalculate scores for all candidates associated with a position.

    Requires authentication and organization membership.

    Useful when:
    - Job requirements are updated
    - Scoring algorithm is improved
    - Manual score refresh is needed

    :param position_id: Position ID
    :param current_user: Current authenticated user with organization
    :return: Recalculation results
    :raises HTTPException: If position not found or recalculation fails
    """
    logger.info(f"POST /api/positions/{position_id}/recalculate-scores - user={current_user.user_id}, org={current_user.org_id}")

    position_service = get_position_service(org_id=current_user.org_id)
    pc_service = get_position_candidate_service(org_id=current_user.org_id)

    # Check if position exists
    if not await run_in_threadpool(position_service.exists, position_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Position {position_id} not found",
        )

    try:
        result = await pc_service.recalculate_all_scores(position_id)

        logger.info(
            f"Score recalculation completed: position_id={position_id}, "
            f"updated={result['scores_updated']}"
        )

        return {
            "status": "success",
            "position_id": position_id,
            "scores_updated": result["scores_updated"],
            "message": f"Recalculated scores for {result['scores_updated']} candidates",
        }

    except Exception as e:
        logger.error(f"Error recalculating scores: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to recalculate scores: {e!s}",
        )
