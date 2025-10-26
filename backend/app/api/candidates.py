"""Candidate API routes."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, ConfigDict

from app.api.dependencies import (
    get_candidate_service,
    get_position_candidate_service,
)
from app.models.candidate import CandidateCreate, CandidateResponse, CandidateUpdate
from app.services.candidate_service import CandidateService
from app.services.position_candidate_service import PositionCandidateService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])


# ============================================================================
# Response Models
# ============================================================================


class CandidateListResponse(BaseModel):
    """Response model for candidate list."""

    model_config = ConfigDict(from_attributes=True)

    candidates: list[dict[str, Any]]
    total: int
    limit: int
    offset: int


class UploadResponse(BaseModel):
    """Response model for resume upload."""

    model_config = ConfigDict(from_attributes=True)

    status: str  # "success" | "parse_failed" | "error"
    candidate: dict[str, Any] | None
    file_url: str
    parse_error: str | None = None


class BatchUploadResult(BaseModel):
    """Single file result in batch upload."""

    model_config = ConfigDict(from_attributes=True)

    file_name: str
    status: str  # "success" | "failed"
    candidate: dict[str, Any] | None
    error: str | None = None


class BatchUploadResponse(BaseModel):
    """Response model for batch upload."""

    model_config = ConfigDict(from_attributes=True)

    total: int
    successful: int
    failed: int
    results: list[BatchUploadResult]


# ============================================================================
# API Endpoints
# ============================================================================


@router.get("/", response_model=CandidateListResponse)
async def get_candidates(
    name: str | None = Query(None, description="Name fuzzy search"),
    skills: list[str] | None = Query(None, description="Skills filter (any match)"),
    min_score: int | None = Query(None, ge=1, le=4, description="Minimum score (1-4)"),
    max_score: int | None = Query(None, ge=1, le=4, description="Maximum score (1-4)"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    offset: int = Query(0, ge=0, description="Page offset"),
    candidate_service: CandidateService = Depends(get_candidate_service),
) -> CandidateListResponse:
    """Get paginated list of candidates with optional filters.

    Supports:
    - Name fuzzy search (case-insensitive partial match)
    - Skills filtering (candidates with any of the specified skills)
    - Score range filtering (1-4 scale)
    - Pagination

    :param name: Name search query
    :param skills: List of skills to filter by
    :param min_score: Minimum score (inclusive)
    :param max_score: Maximum score (inclusive)
    :param limit: Maximum number of results
    :param offset: Number of records to skip
    :param candidate_service: Injected candidate service
    :return: Paginated candidate list
    """
    logger.info(
        f"GET /api/candidates - name={name}, skills={skills}, "
        f"score={min_score}-{max_score}, limit={limit}, offset={offset}"
    )

    try:
        result = await run_in_threadpool(
            candidate_service.search_candidates,
            name_query=name,
            skills=skills,
            min_score=min_score,
            max_score=max_score,
            limit=limit,
            offset=offset,
        )

        return CandidateListResponse(**result)

    except Exception as e:
        logger.error(f"Error searching candidates: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search candidates: {str(e)}",
        )


@router.get("/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(
    candidate_id: int,
    candidate_service: CandidateService = Depends(get_candidate_service),
) -> CandidateResponse:
    """Get candidate details by ID.

    :param candidate_id: Candidate ID
    :param candidate_service: Injected candidate service
    :return: Candidate details
    :raises HTTPException: If candidate not found
    """
    logger.info(f"GET /api/candidates/{candidate_id}")

    candidate = await run_in_threadpool(candidate_service.get_by_id, candidate_id)

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate {candidate_id} not found",
        )

    return CandidateResponse(**candidate)


@router.post("/", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
async def create_candidate(
    candidate_data: CandidateCreate,
    candidate_service: CandidateService = Depends(get_candidate_service),
) -> CandidateResponse:
    """Create a new candidate.

    :param candidate_data: Candidate creation data
    :param candidate_service: Injected candidate service
    :return: Created candidate
    """
    logger.info(f"POST /api/candidates - name={candidate_data.name}")

    try:
        candidate = await run_in_threadpool(
            candidate_service.create,
            candidate_data.model_dump(),
        )
        logger.info(f"Candidate created: {candidate['id']}")
        return CandidateResponse(**candidate)

    except Exception as e:
        logger.error(f"Error creating candidate: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create candidate: {str(e)}",
        )


@router.patch("/{candidate_id}", response_model=CandidateResponse)
async def update_candidate(
    candidate_id: int,
    candidate_data: CandidateUpdate,
    candidate_service: CandidateService = Depends(get_candidate_service),
) -> CandidateResponse:
    """Update candidate information.

    :param candidate_id: Candidate ID
    :param candidate_data: Candidate update data
    :param candidate_service: Injected candidate service
    :return: Updated candidate
    :raises HTTPException: If candidate not found
    """
    logger.info(f"PATCH /api/candidates/{candidate_id}")

    # Check if candidate exists
    if not await run_in_threadpool(candidate_service.exists, candidate_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate {candidate_id} not found",
        )

    try:
        # Only include fields that were actually provided
        update_data = candidate_data.model_dump(exclude_unset=True)

        candidate = await run_in_threadpool(
            candidate_service.update,
            candidate_id,
            update_data,
        )
        logger.info(f"Candidate updated: {candidate_id}")
        return CandidateResponse(**candidate)

    except Exception as e:
        logger.error(f"Error updating candidate: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update candidate: {str(e)}",
        )


@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_candidate(
    candidate_id: int,
    candidate_service: CandidateService = Depends(get_candidate_service),
) -> None:
    """Soft delete a candidate.

    Also cascade soft-deletes all associated position_candidates records.

    :param candidate_id: Candidate ID
    :param candidate_service: Injected candidate service
    :raises HTTPException: If candidate not found
    """
    logger.info(f"DELETE /api/candidates/{candidate_id}")

    # Check if candidate exists
    if not await run_in_threadpool(candidate_service.exists, candidate_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate {candidate_id} not found",
        )

    try:
        await run_in_threadpool(candidate_service.soft_delete, candidate_id)
        logger.info(f"Candidate soft deleted: {candidate_id}")

    except Exception as e:
        logger.error(f"Error deleting candidate: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete candidate: {str(e)}",
        )


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(..., description="Resume file (PDF)"),
    position_id: int | None = Query(None, description="Optionally link to position"),
    candidate_service: CandidateService = Depends(get_candidate_service),
    pc_service: PositionCandidateService = Depends(get_position_candidate_service),
) -> UploadResponse:
    """Upload resume and create candidate with AI parsing.

    Workflow:
    1. Upload file to OSS
    2. Parse resume with AI
    3. Create or update candidate
    4. Optionally link to position with auto-scoring

    :param file: Resume file upload
    :param position_id: Optional position ID to link candidate
    :param candidate_service: Injected candidate service
    :param pc_service: Injected position-candidate service
    :return: Upload result with candidate data
    """
    logger.info(f"POST /api/candidates/upload - file={file.filename}, position={position_id}")

    # Validate file type
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required",
        )

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported",
        )

    try:
        # Read file content
        file_content = await file.read()

        # Upload and parse
        result = await candidate_service.upload_and_create_from_resume(
            file_content=file_content,
            file_name=file.filename,
            auto_parse=True,
        )

        # Build response
        response = UploadResponse(
            status=result["parse_status"],
            candidate=CandidateResponse(**result["candidate"])
            if result["candidate"]
            else None,
            file_url=result["file_url"],
            parse_error=result.get("error"),
        )

        # If position_id provided and parse succeeded, link candidate to position
        if position_id and result["candidate"] and result["parse_status"] == "success":
            try:
                await run_in_threadpool(
                    pc_service.create_association,
                    position_id,
                    result["candidate"]["id"],
                    2,
                    2,
                    current_status="screening",
                )
                logger.info(
                    f"Linked candidate {result['candidate']['id']} to position {position_id}"
                )
            except Exception as e:
                logger.warning(f"Failed to link candidate to position: {e}")
                # Don't fail the entire request if linking fails

        logger.info(f"Resume uploaded: {file.filename}, status={response.status}")
        return response

    except Exception as e:
        logger.error(f"Error uploading resume: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload resume: {str(e)}",
        )


@router.post(
    "/batch-upload",
    response_model=BatchUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def batch_upload_resumes(
    files: list[UploadFile] = File(..., description="Resume files (PDFs)"),
    position_id: int | None = Query(None, description="Optionally link to position"),
    candidate_service: CandidateService = Depends(get_candidate_service),
    pc_service: PositionCandidateService = Depends(get_position_candidate_service),
) -> BatchUploadResponse:
    """Batch upload resumes with fault tolerance.

    Continues processing other files even if some fail.
    If position_id is provided, links all successfully uploaded candidates to the position.

    :param files: List of resume files
    :param position_id: Optional position ID to link all candidates
    :param candidate_service: Injected candidate service
    :param pc_service: Injected position-candidate service
    :return: Batch upload results
    """
    logger.info(f"POST /api/candidates/batch-upload - {len(files)} files, position={position_id}")

    # Prepare file list
    file_list: list[tuple[bytes, str]] = []

    for file in files:
        if not file.filename:
            logger.warning("Skipping file with no filename")
            continue

        if not file.filename.lower().endswith(".pdf"):
            logger.warning(f"Skipping non-PDF file: {file.filename}")
            continue

        try:
            content = await file.read()
            file_list.append((content, file.filename))
        except Exception as e:
            logger.error(f"Error reading file {file.filename}: {e}")

    if not file_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid PDF files provided",
        )

    try:
        # Batch upload
        result = await candidate_service.batch_upload_resumes(
            files=file_list,
            auto_parse=True,
        )

        # If position_id provided, link all successful candidates to position
        if position_id:
            linked_count = 0
            for upload_result in result["results"]:
                if upload_result["status"] == "success" and upload_result["candidate"]:
                    candidate_id = upload_result["candidate"]["id"]
                    try:
                        await run_in_threadpool(
                            pc_service.create_association,
                            position_id,
                            candidate_id,
                            2,  # Default relevance_score
                            2,  # Default fit_score
                            current_status="screening",
                        )
                        linked_count += 1
                        logger.info(f"Linked candidate {candidate_id} to position {position_id}")
                    except Exception as e:
                        logger.warning(
                            f"Failed to link candidate {candidate_id} to position {position_id}: {e}"
                        )
                        # Don't fail the entire request if linking fails

            logger.info(
                f"Linked {linked_count}/{result['successful']} candidates to position {position_id}"
            )

        # Convert to response format
        batch_results = [
            BatchUploadResult(
                file_name=r["file_name"],
                status=r["status"],
                candidate=r["candidate"],  # Already a dict, no conversion needed
                error=r.get("error"),
            )
            for r in result["results"]
        ]

        logger.info(
            f"Batch upload complete: {result['successful']}/{result['total']} successful"
        )

        return BatchUploadResponse(
            total=result["total"],
            successful=result["successful"],
            failed=result["failed"],
            results=batch_results,
        )

    except Exception as e:
        logger.error(f"Error in batch upload: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to batch upload: {str(e)}",
        )
