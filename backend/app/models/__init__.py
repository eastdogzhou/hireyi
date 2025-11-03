"""Pydantic data models."""

# Base models
# Authentication models
from .auth import (
    AuthToken,
    CurrentUser,
    LoginRequest,
    OrganizationMember,
    PasswordResetRequest,
    PasswordUpdateRequest,
    RegisterRequest,
    UserProfile,
)
from .base import (
    CreateSchema,
    DatabaseModel,
    ResponseSchema,
    SoftDeleteMixin,
    TimestampMixin,
    UpdateSchema,
)

# Candidate models
from .candidate import (
    Candidate,
    CandidateCreate,
    CandidateListItem,
    CandidateResponse,
    CandidateUpdate,
)

# Interview Feedback models
from .interview_feedback import (
    InterviewFeedback,
    InterviewFeedbackCreate,
    InterviewFeedbackResponse,
    InterviewFeedbackUpdate,
    InterviewFeedbackWithDetails,
    StatusChangeCreate,
)

# Organization models
from .organization import (
    MemberApprovalRequest,
    MemberRoleUpdateRequest,
    OrganizationCreate,
    OrganizationInfo,
    OrganizationJoinRequest,
    OrganizationMemberInfo,
    OrganizationWithRole,
)

# Position models
from .position import (
    Position,
    PositionCreate,
    PositionListItem,
    PositionResponse,
    PositionUpdate,
)

# Position-Candidate models
from .position_candidate import (
    PositionCandidate,
    PositionCandidateCreate,
    PositionCandidateResponse,
    PositionCandidateUpdate,
    PositionCandidateWithDetails,
)

# User models
from .user import User, UserCreate, UserResponse, UserUpdate

__all__ = [
    # Base
    "CreateSchema",
    "DatabaseModel",
    "ResponseSchema",
    "SoftDeleteMixin",
    "TimestampMixin",
    "UpdateSchema",
    # User
    "User",
    "UserCreate",
    "UserResponse",
    "UserUpdate",
    # Candidate
    "Candidate",
    "CandidateCreate",
    "CandidateListItem",
    "CandidateResponse",
    "CandidateUpdate",
    # Position
    "Position",
    "PositionCreate",
    "PositionListItem",
    "PositionResponse",
    "PositionUpdate",
    # Position-Candidate
    "PositionCandidate",
    "PositionCandidateCreate",
    "PositionCandidateResponse",
    "PositionCandidateUpdate",
    "PositionCandidateWithDetails",
    # Interview Feedback
    "InterviewFeedback",
    "InterviewFeedbackCreate",
    "InterviewFeedbackResponse",
    "InterviewFeedbackUpdate",
    "InterviewFeedbackWithDetails",
    "StatusChangeCreate",
    # Authentication
    "AuthToken",
    "CurrentUser",
    "LoginRequest",
    "OrganizationMember",
    "PasswordResetRequest",
    "PasswordUpdateRequest",
    "RegisterRequest",
    "UserProfile",
    # Organization
    "MemberApprovalRequest",
    "MemberRoleUpdateRequest",
    "OrganizationCreate",
    "OrganizationInfo",
    "OrganizationJoinRequest",
    "OrganizationMemberInfo",
    "OrganizationWithRole",
]
