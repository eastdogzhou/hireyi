"""Candidate data models."""

import re
from datetime import datetime
from typing import Literal

from pydantic import EmailStr, Field, field_validator

from .base import CreateSchema, DatabaseModel, ResponseSchema, UpdateSchema


# ============================================================================
# Enums and Type Definitions
# ============================================================================

CandidateScore = Literal[1, 2, 3, 4]


# ============================================================================
# Database Models
# ============================================================================

class Candidate(DatabaseModel):
    """Candidate database model."""

    name: str = Field(min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    skills: list[str] = Field(default_factory=list)
    highlights: str | None = None
    years_of_experience: int | None = None
    education_level: str | None = Field(default=None, max_length=50)
    recent_company: str | None = Field(default=None, max_length=200)
    recent_position: str | None = Field(default=None, max_length=200)
    score: CandidateScore | None = None
    resume_file: str = Field(min_length=1, max_length=500)
    resume_md5: str = Field(min_length=32, max_length=32)
    # New fields for resume optimization
    resume_text: str | None = None
    work_experience: str | None = None
    education_background: str | None = None


# ============================================================================
# Create Schemas
# ============================================================================

class CandidateCreate(CreateSchema):
    """Schema for creating a new candidate."""

    name: str = Field(min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    skills: list[str] = Field(default_factory=list)
    highlights: str | None = None
    years_of_experience: int | None = None
    education_level: str | None = Field(default=None, max_length=50)
    recent_company: str | None = Field(default=None, max_length=200)
    recent_position: str | None = Field(default=None, max_length=200)
    score: CandidateScore | None = None
    resume_file: str = Field(min_length=1, max_length=500)
    resume_md5: str = Field(min_length=32, max_length=32)
    # New fields for resume optimization
    resume_text: str | None = None
    work_experience: str | None = None
    education_background: str | None = None

    @field_validator("skills")
    @classmethod
    def validate_skills(cls, v: list[str]) -> list[str]:
        """Validate skills list."""
        # Remove empty strings and duplicates
        return list(set(skill.strip() for skill in v if skill.strip()))

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        """Validate and normalize phone number format.

        Supports Chinese mobile numbers (11 digits starting with 1).
        Normalizes to pure digits (e.g., "138-0013-8000" -> "13800138000").
        """
        if v is None or v.strip() == "":
            return None

        # Remove all non-digit characters
        cleaned = re.sub(r'\D', '', v.strip())

        if not cleaned:
            return None

        # Validate Chinese mobile number format: 11 digits starting with 1
        if not re.match(r'^1\d{10}$', cleaned):
            # If doesn't match Chinese mobile format, still accept (for international numbers)
            # But must have at least 7 digits
            if len(cleaned) < 7:
                return None

        return cleaned

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str | None) -> str | None:
        """Normalize email to lowercase."""
        if v:
            return v.lower().strip()
        return v


# ============================================================================
# Update Schemas
# ============================================================================

class CandidateUpdate(UpdateSchema):
    """Schema for updating a candidate."""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    phone: str | None = None
    email: EmailStr | None = None
    skills: list[str] | None = None
    highlights: str | None = None
    years_of_experience: int | None = None
    education_level: str | None = Field(default=None, max_length=50)
    recent_company: str | None = Field(default=None, max_length=200)
    recent_position: str | None = Field(default=None, max_length=200)
    score: CandidateScore | None = None
    resume_file: str | None = Field(default=None, min_length=1, max_length=500)
    resume_md5: str | None = Field(default=None, min_length=32, max_length=32)
    # New fields for resume optimization
    resume_text: str | None = None
    work_experience: str | None = None
    education_background: str | None = None

    @field_validator("skills")
    @classmethod
    def validate_skills(cls, v: list[str] | None) -> list[str] | None:
        """Validate skills list."""
        if v is None:
            return None
        return list(set(skill.strip() for skill in v if skill.strip()))

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        """Validate and normalize phone number format.

        Supports Chinese mobile numbers (11 digits starting with 1).
        Normalizes to pure digits (e.g., "138-0013-8000" -> "13800138000").
        """
        if v is None or v.strip() == "":
            return None

        # Remove all non-digit characters
        cleaned = re.sub(r'\D', '', v.strip())

        if not cleaned:
            return None

        # Validate Chinese mobile number format: 11 digits starting with 1
        if not re.match(r'^1\d{10}$', cleaned):
            # If doesn't match Chinese mobile format, still accept (for international numbers)
            # But must have at least 7 digits
            if len(cleaned) < 7:
                return None

        return cleaned

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str | None) -> str | None:
        """Normalize email to lowercase."""
        if v:
            return v.lower().strip()
        return v


# ============================================================================
# Response Schemas
# ============================================================================

class CandidateResponse(ResponseSchema):
    """Candidate response schema."""

    id: int
    name: str
    phone: str | None
    email: EmailStr | None
    skills: list[str]
    highlights: str | None
    years_of_experience: int | None
    education_level: str | None
    recent_company: str | None
    recent_position: str | None
    score: CandidateScore | None
    resume_file: str
    resume_md5: str
    # New fields for resume optimization
    resume_text: str | None
    work_experience: str | None
    education_background: str | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime


class CandidateListItem(ResponseSchema):
    """Simplified candidate schema for list views."""

    id: int
    name: str
    phone: str | None
    email: EmailStr | None
    skills: list[str]
    years_of_experience: int | None
    recent_company: str | None
    recent_position: str | None
    score: CandidateScore | None
    created_at: datetime
