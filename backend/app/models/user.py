"""User data models."""

from datetime import datetime
from typing import Literal

from pydantic import EmailStr, Field

from .base import CreateSchema, DatabaseModel, ResponseSchema, UpdateSchema

# ============================================================================
# Enums and Type Definitions
# ============================================================================

UserRole = Literal["recruiter", "admin"]


# ============================================================================
# Database Models
# ============================================================================


class User(DatabaseModel):
    """User database model."""

    email: EmailStr
    name: str = Field(min_length=1, max_length=100)
    role: UserRole = Field(default="recruiter")


# ============================================================================
# Create Schemas
# ============================================================================


class UserCreate(CreateSchema):
    """Schema for creating a new user."""

    email: EmailStr
    name: str = Field(min_length=1, max_length=100)
    role: UserRole = Field(default="recruiter")


# ============================================================================
# Update Schemas
# ============================================================================


class UserUpdate(UpdateSchema):
    """Schema for updating a user."""

    email: EmailStr | None = None
    name: str | None = Field(default=None, min_length=1, max_length=100)
    role: UserRole | None = None


# ============================================================================
# Response Schemas
# ============================================================================


class UserResponse(ResponseSchema):
    """User response schema."""

    id: int
    email: EmailStr
    name: str
    role: UserRole
    is_deleted: bool
    created_at: datetime
