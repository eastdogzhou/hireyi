"""Authentication related Pydantic models."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator


class LoginRequest(BaseModel):
    """User login request."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password")


class RegisterRequest(BaseModel):
    """User registration request."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password")
    name: str = Field(..., min_length=1, max_length=255, description="User full name")
    org_id: str | None = Field(
        default=None, description="Optional: Organization ID to join"
    )

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets strength requirements.

        :param v: Password to validate.
        :return: Validated password.
        :raises ValueError: If password doesn't meet requirements.
        """
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")

        has_upper = any(c.isupper() for c in v)
        has_lower = any(c.islower() for c in v)
        has_digit = any(c.isdigit() for c in v)

        if not has_upper:
            raise ValueError("Password must contain at least one uppercase letter")
        if not has_lower:
            raise ValueError("Password must contain at least one lowercase letter")
        if not has_digit:
            raise ValueError("Password must contain at least one digit")

        return v


class PasswordResetRequest(BaseModel):
    """Password reset request."""

    email: EmailStr = Field(..., description="User email address")


class PasswordUpdateRequest(BaseModel):
    """Password update request."""

    new_password: str = Field(..., min_length=8, description="New password")

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets strength requirements.

        :param v: Password to validate.
        :return: Validated password.
        :raises ValueError: If password doesn't meet requirements.
        """
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")

        has_upper = any(c.isupper() for c in v)
        has_lower = any(c.islower() for c in v)
        has_digit = any(c.isdigit() for c in v)

        if not has_upper:
            raise ValueError("Password must contain at least one uppercase letter")
        if not has_lower:
            raise ValueError("Password must contain at least one lowercase letter")
        if not has_digit:
            raise ValueError("Password must contain at least one digit")

        return v


class AuthToken(BaseModel):
    """Authentication token response."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")
    refresh_token: str | None = Field(
        default=None, description="Optional refresh token"
    )


class UserProfile(BaseModel):
    """User profile information."""

    id: str = Field(..., description="User UUID")
    email: str = Field(..., description="User email")
    name: str = Field(..., description="User full name")
    current_org_id: str | None = Field(default=None, description="Current organization")
    created_at: datetime = Field(..., description="Account creation time")


class OrganizationMember(BaseModel):
    """Organization member information."""

    id: int = Field(..., description="Member record ID")
    org_id: str = Field(..., description="Organization UUID")
    user_id: str = Field(..., description="User UUID")
    role: Literal["creator", "admin", "interviewer", "pending"] = Field(
        ..., description="Member role"
    )
    requested_at: datetime = Field(..., description="Request timestamp")
    approved_at: datetime | None = Field(default=None, description="Approval timestamp")
    approved_by: str | None = Field(default=None, description="Approver user UUID")


class CurrentUser(BaseModel):
    """Current authenticated user with organization context."""

    user_id: str = Field(..., description="User UUID")
    email: str = Field(..., description="User email")
    name: str = Field(..., description="User full name")
    org_id: str | None = Field(default=None, description="Current organization UUID")
    org_role: Literal["creator", "admin", "interviewer", "pending"] | None = Field(
        default=None, description="Role in current organization"
    )
    is_admin: bool = Field(
        default=False, description="Whether user is creator or admin"
    )

    @property
    def is_creator(self) -> bool:
        """Check if user is organization creator."""
        return self.org_role == "creator"

    @property
    def is_admin_or_above(self) -> bool:
        """Check if user is creator or admin (HR level)."""
        return self.org_role in ("creator", "admin")

    @property
    def is_interviewer_or_above(self) -> bool:
        """Check if user is creator, admin, or interviewer."""
        return self.org_role in ("creator", "admin", "interviewer")

    @property
    def is_approved(self) -> bool:
        """Check if user is approved (not pending)."""
        return self.org_role != "pending" and self.org_role is not None
