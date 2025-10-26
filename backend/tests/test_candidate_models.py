"""Tests for Candidate Pydantic models."""

import pytest
from pydantic import ValidationError

from app.models.candidate import CandidateCreate, CandidateUpdate


def test_candidate_create_email_normalization():
    """Test that email is normalized to lowercase."""
    candidate = CandidateCreate(
        name="张三",
        phone="13812345678",
        email="Test@Example.COM",
        skills=["Python"],
        resume_file="https://example.com/resume.pdf",
        resume_md5="a" * 32,
    )

    assert candidate.email == "test@example.com"


def test_candidate_create_phone_cleaning():
    """Test that phone number is cleaned of spaces and dashes."""
    candidate = CandidateCreate(
        name="张三",
        phone="138-1234-5678",
        skills=["Python"],
        resume_file="https://example.com/resume.pdf",
        resume_md5="a" * 32,
    )

    assert candidate.phone == "13812345678"


def test_candidate_create_phone_empty_becomes_none():
    """Test that empty phone string becomes None."""
    candidate = CandidateCreate(
        name="张三",
        phone="   ",
        skills=["Python"],
        resume_file="https://example.com/resume.pdf",
        resume_md5="a" * 32,
    )

    assert candidate.phone is None


def test_candidate_create_skills_deduplication():
    """Test that duplicate skills are removed."""
    candidate = CandidateCreate(
        name="张三",
        skills=["Python", "python", "Python", "React"],
        resume_file="https://example.com/resume.pdf",
        resume_md5="a" * 32,
    )

    # Skills should be deduplicated (case-sensitive)
    assert len(candidate.skills) <= 3
    assert "Python" in candidate.skills or "python" in candidate.skills
    assert "React" in candidate.skills


def test_candidate_create_skills_empty_strings_removed():
    """Test that empty skill strings are removed."""
    candidate = CandidateCreate(
        name="张三",
        skills=["Python", "", "  ", "React", ""],
        resume_file="https://example.com/resume.pdf",
        resume_md5="a" * 32,
    )

    # Empty strings should be removed
    assert len(candidate.skills) == 2
    assert "Python" in candidate.skills
    assert "React" in candidate.skills


def test_candidate_create_invalid_email():
    """Test that invalid email raises validation error."""
    with pytest.raises(ValidationError):
        CandidateCreate(
            name="张三",
            email="not_an_email",
            skills=["Python"],
            resume_file="https://example.com/resume.pdf",
            resume_md5="a" * 32,
        )


def test_candidate_create_invalid_md5_length():
    """Test that invalid MD5 length raises validation error."""
    with pytest.raises(ValidationError):
        CandidateCreate(
            name="张三",
            skills=["Python"],
            resume_file="https://example.com/resume.pdf",
            resume_md5="too_short",
        )


def test_candidate_update_email_normalization():
    """Test that email is normalized in update schema."""
    update = CandidateUpdate(email="UPPER@CASE.COM")

    assert update.email == "upper@case.com"


def test_candidate_update_phone_cleaning():
    """Test that phone is cleaned in update schema."""
    update = CandidateUpdate(phone="138 1234 5678")

    assert update.phone == "13812345678"


def test_candidate_update_skills_deduplication():
    """Test that skills are deduplicated in update schema."""
    update = CandidateUpdate(skills=["Python", "Python", "React"])

    # Should deduplicate
    assert len(update.skills) <= 2
    assert "Python" in update.skills
    assert "React" in update.skills
