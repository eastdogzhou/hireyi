"""Interview feedback data models.

v2.0: Refactored to support three mutually exclusive record types:
  1. Interview evaluations (interview_rating: 1-4)
  2. AI evaluations (ai_rating: 1-10)
  3. Status/log records (new_status: status enum)
"""

from datetime import date, datetime
from typing import Annotated, Literal
from uuid import UUID

from pydantic import Field, PlainSerializer, field_validator, model_validator

from .base import CreateSchema, ResponseSchema, UpdateSchema

# Custom type for date fields that automatically serialize to ISO format strings
DateStr = Annotated[
    date,
    PlainSerializer(
        lambda x: x.isoformat() if x else None, return_type=str, when_used="always"
    ),
]


# ============================================================================
# Enums and Type Definitions
# ============================================================================

InterviewRating = Literal[1, 2, 3, 4]
AIRating = Literal[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
InterviewerType = Literal["user", "agent", "system"]
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
    """Interview feedback database model (v2.0).

    Supports three mutually exclusive record types:
    - Interview evaluation: interview_rating is set
    - AI evaluation: ai_rating is set
    - Status/log record: new_status is set
    """

    id: int
    candidate_id: int
    position_id: int | None = None  # Nullable: allows candidate-level records
    interviewer: UUID
    interviewer_type: InterviewerType
    interview_date: date
    comments: str
    interview_rating: InterviewRating | None = None
    ai_rating: AIRating | None = None
    new_status: FeedbackStatus | None = None
    is_deleted: bool = Field(default=False)
    created_at: datetime


# ============================================================================
# Create Schemas
# ============================================================================


class InterviewFeedbackCreate(CreateSchema):
    """Schema for creating interview feedback (v2.0).

    Must specify exactly one of: interview_rating, ai_rating, or new_status.
    """

    candidate_id: int
    position_id: int | None = None  # Optional: allows candidate-level records
    interviewer: UUID
    interviewer_type: InterviewerType
    interview_date: DateStr | None = None  # Auto-filled with created_at date if None
    comments: str
    interview_rating: InterviewRating | None = None
    ai_rating: AIRating | None = None
    new_status: FeedbackStatus | None = None

    @model_validator(mode="after")
    def validate_mutually_exclusive_types(self) -> "InterviewFeedbackCreate":
        """Ensure exactly one of the three type fields is set."""
        type_fields = [
            self.interview_rating is not None,
            self.ai_rating is not None,
            self.new_status is not None,
        ]

        if sum(type_fields) != 1:
            raise ValueError(
                "Exactly one of interview_rating, ai_rating, or new_status must be provided"
            )

        return self


# ============================================================================
# Update Schemas
# ============================================================================


class InterviewFeedbackUpdate(UpdateSchema):
    """Schema for updating interview feedback.

    Note: Cannot change record type (interview/AI/status).
    Only updates content within the same type.
    """

    interview_rating: InterviewRating | None = None
    ai_rating: AIRating | None = None
    comments: str | None = None
    interview_date: DateStr | None = None


# ============================================================================
# Response Schemas
# ============================================================================


class InterviewFeedbackResponse(ResponseSchema):
    """Interview feedback response schema (v2.0)."""

    id: int
    candidate_id: int
    position_id: int | None  # Nullable
    interviewer: UUID
    interviewer_type: InterviewerType
    interview_date: DateStr
    comments: str
    interview_rating: InterviewRating | None
    ai_rating: AIRating | None
    new_status: FeedbackStatus | None
    is_deleted: bool
    created_at: datetime


class InterviewFeedbackWithDetails(ResponseSchema):
    """Interview feedback with nested details (v2.0)."""

    id: int
    candidate_id: int
    position_id: int | None  # Nullable
    interviewer: UUID
    interviewer_type: InterviewerType
    interview_date: DateStr
    comments: str
    interview_rating: InterviewRating | None
    ai_rating: AIRating | None
    new_status: FeedbackStatus | None
    is_deleted: bool
    created_at: datetime
    # Nested data (populated by service layer)
    interviewer_name: str | None = None
    candidate_name: str | None = None
    position_title: str | None = None


# ============================================================================
# Specialized Create Schemas (Convenience Wrappers)
# ============================================================================


class InterviewEvaluationCreate(CreateSchema):
    """Schema for creating an interview evaluation record."""

    candidate_id: int
    position_id: int | None = None
    interviewer: UUID
    interviewer_type: InterviewerType = "user"
    interview_date: DateStr
    comments: str
    interview_rating: InterviewRating

    def to_feedback_create(self) -> InterviewFeedbackCreate:
        """Convert to InterviewFeedbackCreate."""
        return InterviewFeedbackCreate(
            candidate_id=self.candidate_id,
            position_id=self.position_id,
            interviewer=self.interviewer,
            interviewer_type=self.interviewer_type,
            interview_date=self.interview_date,
            comments=self.comments,
            interview_rating=self.interview_rating,
            ai_rating=None,
            new_status=None,
        )


class AIEvaluationCreate(CreateSchema):
    """Schema for creating an AI evaluation record."""

    candidate_id: int
    position_id: int | None = None
    interviewer: UUID  # AI agent UUID
    interviewer_type: InterviewerType = "agent"
    comments: str
    ai_rating: AIRating

    def to_feedback_create(self) -> InterviewFeedbackCreate:
        """Convert to InterviewFeedbackCreate."""
        return InterviewFeedbackCreate(
            candidate_id=self.candidate_id,
            position_id=self.position_id,
            interviewer=self.interviewer,
            interviewer_type=self.interviewer_type,
            interview_date=None,  # Will use created_at date
            comments=self.comments,
            interview_rating=None,
            ai_rating=self.ai_rating,
            new_status=None,
        )


class StatusChangeCreate(CreateSchema):
    """Schema for creating a status change record."""

    candidate_id: int
    position_id: int | None = None  # Optional: allows candidate-level status changes
    interviewer: UUID
    interviewer_type: InterviewerType = "user"
    new_status: FeedbackStatus
    comments: str

    def to_feedback_create(self) -> InterviewFeedbackCreate:
        """Convert to InterviewFeedbackCreate."""
        return InterviewFeedbackCreate(
            candidate_id=self.candidate_id,
            position_id=self.position_id,
            interviewer=self.interviewer,
            interviewer_type=self.interviewer_type,
            interview_date=None,  # Will use created_at date
            comments=self.comments,
            interview_rating=None,
            ai_rating=None,
            new_status=self.new_status,
        )
