"""Candidate API routes with authentication."""

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
from app.middleware.auth import require_organization
from app.models.auth import CurrentUser
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
    current_user: CurrentUser = Depends(require_organization),
    name: str | None = Query(None, description="Name fuzzy search"),
    skills: list[str] | None = Query(None, description="Skills filter (any match)"),
    min_score: int | None = Query(None, ge=1, le=4, description="Minimum score (1-4)"),
    max_score: int | None = Query(None, ge=1, le=4, description="Maximum score (1-4)"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    offset: int = Query(0, ge=0, description="Page offset"),
) -> CandidateListResponse:
    """Get paginated list of candidates with optional filters.

    Requires authentication and organization membership.
    Returns only candidates within the current user's organization.

    Supports:
    - Name fuzzy search (case-insensitive partial match)
    - Skills filtering (candidates with any of the specified skills)
    - Score range filtering (1-4 scale)
    - Pagination

    :param current_user: Current authenticated user with organization
    :param name: Name search query
    :param skills: List of skills to filter by
    :param min_score: Minimum score (inclusive)
    :param max_score: Maximum score (inclusive)
    :param limit: Maximum number of results
    :param offset: Number of records to skip
    :return: Paginated candidate list
    """
    logger.info(
        f"GET /api/candidates - user={current_user.user_id}, org={current_user.org_id}, "
        f"name={name}, skills={skills}, score={min_score}-{max_score}, limit={limit}, offset={offset}"
    )

    try:
        candidate_service = get_candidate_service(org_id=current_user.org_id)
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
            detail=f"Failed to search candidates: {e!s}",
        )


@router.get("/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(
    candidate_id: int,
    current_user: CurrentUser = Depends(require_organization),
) -> CandidateResponse:
    """Get candidate details by ID.

    Requires authentication and organization membership.
    Returns only if candidate belongs to the current user's organization.

    :param candidate_id: Candidate ID
    :param current_user: Current authenticated user with organization
    :return: Candidate details
    :raises HTTPException: If candidate not found or not accessible
    """
    logger.info(
        f"GET /api/candidates/{candidate_id} - user={current_user.user_id}, org={current_user.org_id}"
    )

    candidate_service = get_candidate_service(org_id=current_user.org_id)
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
    current_user: CurrentUser = Depends(require_organization),
) -> CandidateResponse:
    """Create a new candidate.

    Requires authentication and organization membership.
    Candidate is created within the current user's organization.

    :param candidate_data: Candidate creation data
    :param current_user: Current authenticated user with organization
    :return: Created candidate
    """
    logger.info(
        f"POST /api/candidates - user={current_user.user_id}, org={current_user.org_id}, name={candidate_data.name}"
    )

    try:
        candidate_service = get_candidate_service(org_id=current_user.org_id)
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
            detail=f"Failed to create candidate: {e!s}",
        )


@router.patch("/{candidate_id}", response_model=CandidateResponse)
async def update_candidate(
    candidate_id: int,
    candidate_data: CandidateUpdate,
    current_user: CurrentUser = Depends(require_organization),
) -> CandidateResponse:
    """Update candidate information.

    Requires authentication and organization membership.
    Only updates candidates within the current user's organization.

    :param candidate_id: Candidate ID
    :param candidate_data: Candidate update data
    :param current_user: Current authenticated user with organization
    :return: Updated candidate
    :raises HTTPException: If candidate not found or not accessible
    """
    logger.info(
        f"PATCH /api/candidates/{candidate_id} - user={current_user.user_id}, org={current_user.org_id}"
    )

    candidate_service = get_candidate_service(org_id=current_user.org_id)

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
            detail=f"Failed to update candidate: {e!s}",
        )


@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_candidate(
    candidate_id: int,
    current_user: CurrentUser = Depends(require_organization),
) -> None:
    """Soft delete a candidate.

    Requires authentication and organization membership.
    Only deletes candidates within the current user's organization.
    Also cascade soft-deletes all associated position_candidates records.

    :param candidate_id: Candidate ID
    :param current_user: Current authenticated user with organization
    :raises HTTPException: If candidate not found or not accessible
    """
    logger.info(
        f"DELETE /api/candidates/{candidate_id} - user={current_user.user_id}, org={current_user.org_id}"
    )

    candidate_service = get_candidate_service(org_id=current_user.org_id)

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
            detail=f"Failed to delete candidate: {e!s}",
        )


@router.post(
    "/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED
)
async def upload_resume(
    file: UploadFile = File(..., description="Resume file (PDF)"),
    position_id: int | None = Query(None, description="Optionally link to position"),
    current_user: CurrentUser = Depends(require_organization),
) -> UploadResponse:
    """Upload resume and create candidate with AI parsing.

    Requires authentication and organization membership.
    Candidate is created within the current user's organization.

    Workflow:
    1. Upload file to OSS
    2. Parse resume with AI
    3. Create or update candidate
    4. Optionally link to position with auto-scoring

    :param file: Resume file upload
    :param position_id: Optional position ID to link candidate
    :param current_user: Current authenticated user with organization
    :return: Upload result with candidate data
    """
    logger.info(
        f"POST /api/candidates/upload - user={current_user.user_id}, org={current_user.org_id}, "
        f"file={file.filename}, position={position_id}"
    )

    # Validate file type
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="文件名不能为空",
        )

    # Support multiple formats: PDF, DOCX, DOC, HTML, Markdown
    SUPPORTED_FORMATS = {".pdf", ".doc", ".docx", ".html", ".htm", ".md", ".markdown"}
    file_ext = Path(file.filename).suffix.lower()

    if file_ext not in SUPPORTED_FORMATS:
        supported_list = ", ".join(sorted(SUPPORTED_FORMATS))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的文件格式 '{file_ext}'。支持的格式: {supported_list}",
        )

    try:
        # Read file content
        file_content = await file.read()

        candidate_service = get_candidate_service(org_id=current_user.org_id)
        pc_service = get_position_candidate_service(org_id=current_user.org_id)

        # Upload and parse
        result = await candidate_service.upload_and_create_from_resume(
            file_content=file_content,
            file_name=file.filename,
            auto_parse=True,
        )

        # Build response
        response = UploadResponse(
            status=result["parse_status"],
            candidate=result["candidate"],
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
            detail=f"Failed to upload resume: {e!s}",
        )


@router.post(
    "/batch-upload",
    response_model=BatchUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def batch_upload_resumes(
    files: list[UploadFile] = File(..., description="Resume files (PDFs)"),
    position_id: int | None = Query(None, description="Optionally link to position"),
    current_user: CurrentUser = Depends(require_organization),
) -> BatchUploadResponse:
    """Batch upload resumes with fault tolerance.

    Requires authentication and organization membership.
    All candidates are created within the current user's organization.

    Continues processing other files even if some fail.
    If position_id is provided, links all successfully uploaded candidates to the position.

    :param files: List of resume files
    :param position_id: Optional position ID to link all candidates
    :param current_user: Current authenticated user with organization
    :return: Batch upload results
    """
    logger.info(
        f"POST /api/candidates/batch-upload - user={current_user.user_id}, org={current_user.org_id}, "
        f"{len(files)} files, position={position_id}"
    )

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
        candidate_service = get_candidate_service(org_id=current_user.org_id)
        pc_service = get_position_candidate_service(org_id=current_user.org_id)

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
                        logger.info(
                            f"Linked candidate {candidate_id} to position {position_id}"
                        )
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
                candidate=r["candidate"],
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
            detail=f"Failed to batch upload: {e!s}",
        )
