"""Interview feedback data models."""

from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import Field, PlainSerializer, field_validator, model_validator

from .base import CreateSchema, ResponseSchema, UpdateSchema

# Custom type for date fields that automatically serialize to ISO format strings
DateStr = Annotated[date, PlainSerializer(lambda x: x.isoformat() if x else None, return_type=str, when_used='always')]


# ============================================================================
# Enums and Type Definitions
# ============================================================================

InterviewRating = Literal[1, 2, 3, 4]
FeedbackStatus = Literal[
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

class InterviewFeedback(ResponseSchema):
    """Interview feedback database model (execution record)."""

    id: int
    candidate_id: int
    position_id: int | None = None  # Nullable: allows candidate-level records
    interviewer: int | None = None
    rating: InterviewRating | None = None
    comments: str | None = None
    interview_date: date | None = None
    new_status: FeedbackStatus | None = None
    is_status_change: bool = Field(default=False)
    is_deleted: bool = Field(default=False)
    created_at: datetime


# ============================================================================
# Create Schemas
# ============================================================================

class InterviewFeedbackCreate(CreateSchema):
    """Schema for creating interview feedback (execution record)."""

    candidate_id: int
    position_id: int | None = None  # Optional: allows candidate-level records
    interviewer: int | None = None
    rating: InterviewRating | None = None
    comments: str | None = None
    interview_date: DateStr | None = None
    new_status: FeedbackStatus | None = None
    is_status_change: bool = Field(default=False)

    @field_validator("is_status_change", mode="after")
    @classmethod
    def validate_status_change(cls, v: bool, info) -> bool:
        """Auto-detect if this is a status change record."""
        data = info.data
        new_status = data.get("new_status")

        # If new_status is provided, mark as status change
        if new_status is not None:
            return True

        return v

    @model_validator(mode="after")
    def validate_rating_for_interview(self) -> "InterviewFeedbackCreate":
        """Validate rating is provided for interview feedback (not status changes)."""
        # Status changes have new_status set, interview feedback does not
        is_status_change = self.new_status is not None

        # Rating should be provided for interview feedback (not status changes)
        if not is_status_change and self.rating is None:
            raise ValueError("rating is required for interview feedback")

        return self


# ============================================================================
# Update Schemas
# ============================================================================

class InterviewFeedbackUpdate(UpdateSchema):
    """Schema for updating interview feedback."""

    rating: InterviewRating | None = None
    comments: str | None = None
    interview_date: DateStr | None = None


# ============================================================================
# Response Schemas
# ============================================================================

class InterviewFeedbackResponse(ResponseSchema):
    """Interview feedback response schema."""

    id: int
    candidate_id: int
    position_id: int | None  # Nullable
    interviewer: int | None
    rating: InterviewRating | None
    comments: str | None
    interview_date: DateStr | None
    new_status: FeedbackStatus | None
    is_status_change: bool
    is_deleted: bool
    created_at: datetime


class InterviewFeedbackWithDetails(ResponseSchema):
    """Interview feedback with nested details."""

    id: int
    candidate_id: int
    position_id: int | None  # Nullable
    interviewer: int | None
    rating: InterviewRating | None
    comments: str | None
    interview_date: DateStr | None
    new_status: FeedbackStatus | None
    is_status_change: bool
    created_at: datetime
    # Nested data (populated by service layer)
    interviewer_name: str | None = None
    candidate_name: str | None = None
    position_title: str | None = None


# ============================================================================
# Status Change Specific Schema
# ============================================================================

class StatusChangeCreate(CreateSchema):
    """Schema for creating a status change record."""

    candidate_id: int
    position_id: int | None = None  # Optional: allows candidate-level status changes
    interviewer: int
    new_status: FeedbackStatus
    comments: str

    def to_feedback_create(self) -> InterviewFeedbackCreate:
        """Convert to InterviewFeedbackCreate."""
        return InterviewFeedbackCreate(
            candidate_id=self.candidate_id,
            position_id=self.position_id,
            interviewer=self.interviewer,
            new_status=self.new_status,
            comments=self.comments,
            is_status_change=True,
            rating=None,
            interview_date=None,
        )
