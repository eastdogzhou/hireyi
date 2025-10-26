"""Base models for all Pydantic schemas."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class TimestampMixin(BaseModel):
    """Mixin for models with timestamp fields."""

    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    model_config = ConfigDict(from_attributes=True)


class SoftDeleteMixin(BaseModel):
    """Mixin for models with soft delete support."""

    is_deleted: bool = Field(default=False)

    model_config = ConfigDict(from_attributes=True)


class DatabaseModel(TimestampMixin, SoftDeleteMixin):
    """Base model for all database entities with timestamps and soft delete."""

    id: int

    model_config = ConfigDict(from_attributes=True)


class CreateSchema(BaseModel):
    """Base schema for create operations."""

    model_config = ConfigDict(
        from_attributes=True,
        # Allow arbitrary types for JSONB fields
        arbitrary_types_allowed=True,
    )


class UpdateSchema(BaseModel):
    """Base schema for update operations."""

    model_config = ConfigDict(
        from_attributes=True,
        arbitrary_types_allowed=True,
        # All fields optional in update operations
        extra="forbid",
    )


class ResponseSchema(BaseModel):
    """Base schema for API responses."""

    model_config = ConfigDict(
        from_attributes=True,
        arbitrary_types_allowed=True,
    )
