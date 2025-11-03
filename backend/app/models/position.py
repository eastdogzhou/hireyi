"""Position data models."""

from datetime import datetime
from typing import Any, Literal

from pydantic import Field

from .base import CreateSchema, DatabaseModel, ResponseSchema, UpdateSchema

# ============================================================================
# Enums and Type Definitions
# ============================================================================

PositionStatus = Literal["open", "closed"]


# ============================================================================
# Database Models
# ============================================================================


class Position(DatabaseModel):
    """Position database model."""

    title: str = Field(min_length=1, max_length=200)
    department: str | None = Field(default=None, max_length=100)
    jd: str = Field(min_length=1)
    requirements: dict[str, Any] | None = None
    status: PositionStatus = Field(default="open")
    created_by: int | None = None


# ============================================================================
# Create Schemas
# ============================================================================


class PositionCreate(CreateSchema):
    """Schema for creating a new position."""

    title: str = Field(min_length=1, max_length=200)
    department: str | None = Field(default=None, max_length=100)
    jd: str = Field(min_length=1)
    requirements: dict[str, Any] | None = None
    status: PositionStatus = Field(default="open")
    created_by: int | None = None


# ============================================================================
# Update Schemas
# ============================================================================


class PositionUpdate(UpdateSchema):
    """Schema for updating a position."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    department: str | None = None
    jd: str | None = Field(default=None, min_length=1)
    requirements: dict[str, Any] | None = None
    status: PositionStatus | None = None


# ============================================================================
# Response Schemas
# ============================================================================


class PositionResponse(ResponseSchema):
    """Position response schema."""

    id: int
    title: str
    department: str | None
    jd: str
    requirements: dict[str, Any] | None
    status: PositionStatus
    created_by: int | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime


class PositionListItem(ResponseSchema):
    """Simplified position schema for list views."""

    id: int
    title: str
    department: str | None
    status: PositionStatus
    created_at: datetime
