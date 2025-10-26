"""Position-Candidate relationship models."""

from datetime import datetime
from typing import Literal

from pydantic import Field, field_validator

from .base import CreateSchema, DatabaseModel, ResponseSchema, UpdateSchema


# ============================================================================
# Enums and Type Definitions
# ============================================================================

ScoreTier = Literal[1, 2, 3, 4]
CandidateStatus = Literal[
    "screening",
    "interview",
    "offer",
    "hired",
    "rejected",
    "withdrawn",
]


# ============================================================================
# Database Models
# ============================================================================

class PositionCandidate(DatabaseModel):
    """Position-Candidate relationship database model."""

    position_id: int
    candidate_id: int
    relevance_score: ScoreTier | None = None
    fit_score: ScoreTier | None = None
    overall_score: ScoreTier | None = None
    overall_score_numeric: int | None = Field(default=None, ge=0, le=100)
    current_status: CandidateStatus = Field(default="screening")


# ============================================================================
# Create Schemas
# ============================================================================

class PositionCandidateCreate(CreateSchema):
    """Schema for creating a position-candidate relationship."""

    position_id: int
    candidate_id: int
    relevance_score: ScoreTier | None = None
    fit_score: ScoreTier | None = None
    overall_score: ScoreTier | None = None
    overall_score_numeric: int | None = Field(default=None, ge=0, le=100)
    current_status: CandidateStatus = Field(default="screening")

    @field_validator("overall_score_numeric", mode="after")
    @classmethod
    def calculate_or_validate_numeric_score(
        cls, v: int | None, info
    ) -> int | None:
        """Auto-calculate overall_score_numeric if scores are provided."""
        if v is not None:
            return v

        # Auto-calculate if relevance and fit scores are provided
        data = info.data
        relevance = data.get("relevance_score")
        fit = data.get("fit_score")

        if relevance is not None and fit is not None:
            # Formula: (relevance × 0.6 + fit × 0.4) × 25
            return int((relevance * 0.6 + fit * 0.4) * 25)

        return None


# ============================================================================
# Update Schemas
# ============================================================================

class PositionCandidateUpdate(UpdateSchema):
    """Schema for updating a position-candidate relationship."""

    relevance_score: ScoreTier | None = None
    fit_score: ScoreTier | None = None
    overall_score: ScoreTier | None = None
    overall_score_numeric: int | None = Field(default=None, ge=0, le=100)
    current_status: CandidateStatus | None = None

    @field_validator("overall_score_numeric", mode="after")
    @classmethod
    def calculate_or_validate_numeric_score(
        cls, v: int | None, info
    ) -> int | None:
        """Auto-calculate overall_score_numeric if scores are updated."""
        if v is not None:
            return v

        data = info.data
        relevance = data.get("relevance_score")
        fit = data.get("fit_score")

        if relevance is not None and fit is not None:
            return int((relevance * 0.6 + fit * 0.4) * 25)

        return None


# ============================================================================
# Response Schemas
# ============================================================================

class PositionCandidateResponse(ResponseSchema):
    """Position-candidate relationship response schema."""

    id: int
    position_id: int
    candidate_id: int
    relevance_score: ScoreTier | None
    fit_score: ScoreTier | None
    overall_score: ScoreTier | None
    overall_score_numeric: int | None
    current_status: CandidateStatus
    is_deleted: bool
    created_at: datetime
    updated_at: datetime


class PositionCandidateWithDetails(ResponseSchema):
    """Position-candidate with nested candidate details."""

    id: int
    position_id: int
    candidate_id: int
    relevance_score: ScoreTier | None
    fit_score: ScoreTier | None
    overall_score: ScoreTier | None
    overall_score_numeric: int | None
    current_status: CandidateStatus
    created_at: datetime
    updated_at: datetime
    # Nested candidate data (populated by service layer)
    candidate_name: str | None = None
    candidate_phone: str | None = None
    candidate_email: str | None = None
    candidate_skills: list[str] | None = None
