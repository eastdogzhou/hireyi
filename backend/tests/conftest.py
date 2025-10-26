"""Pytest configuration and fixtures for all tests."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient
from supabase import Client


@pytest.fixture
def mock_supabase():
    """Mock Supabase client for testing."""
    mock_client = MagicMock(spec=Client)
    return mock_client


@pytest.fixture
def mock_oss_service():
    """Mock OSS service for testing."""
    mock = MagicMock()

    # Mock upload_file method
    mock.upload_file.return_value = {
        "success": True,
        "file_path": "resumes/test_resume.pdf",
        "file_url": "https://oss.example.com/resumes/test_resume.pdf",
        "file_md5": "abc123def456",
        "file_size": 1024,
    }

    # Mock other methods
    mock.delete_file.return_value = {"success": True, "message": "File deleted"}
    mock.get_file_url.return_value = "https://oss.example.com/resumes/test_resume.pdf"
    mock.file_exists.return_value = True

    return mock


@pytest.fixture
def mock_resume_parser():
    """Mock resume parser for testing."""
    mock = MagicMock()

    # Mock parse_resume method
    mock.parse_resume = AsyncMock(
        return_value={
            "name": "张三",
            "phone": "13800138000",
            "email": "zhangsan@example.com",
            "skills": ["Python", "Django", "React"],
            "highlights": "5年全栈开发经验\n熟悉微服务架构\n具备大型项目架构能力",
            "years_of_experience": 5,
            "education_level": "本科",
            "recent_company": "某互联网公司",
            "recent_position": "高级工程师",
        }
    )

    return mock


@pytest.fixture
def test_client():
    """FastAPI TestClient for integration testing.

    This fixture provides a test client for making HTTP requests to the API.
    It mocks external dependencies like Supabase and OSS to isolate API testing.
    """
    # Import app first
    from app.main import app

    # Override all dependencies with mocks
    from app.api.dependencies import (
        get_candidate_service,
        get_interview_feedback_service,
        get_oss_service,
        get_position_candidate_service,
        get_position_service,
        get_resume_parser,
    )
    from app.services.candidate_service import CandidateService
    from app.services.interview_feedback_service import InterviewFeedbackService
    from app.services.position_candidate_service import PositionCandidateService
    from app.services.position_service import PositionService

    # Mock Supabase client
    mock_supabase = MagicMock(spec=Client)

    # Mock table responses for common queries
    def mock_table(table_name):
        mock_table_obj = MagicMock()

        # Default empty response
        mock_response = MagicMock()
        mock_response.data = []

        # Chain method mocks
        mock_table_obj.select.return_value = mock_table_obj
        mock_table_obj.insert.return_value = mock_table_obj
        mock_table_obj.update.return_value = mock_table_obj
        mock_table_obj.delete.return_value = mock_table_obj
        mock_table_obj.eq.return_value = mock_table_obj
        mock_table_obj.neq.return_value = mock_table_obj
        mock_table_obj.gte.return_value = mock_table_obj
        mock_table_obj.lte.return_value = mock_table_obj
        mock_table_obj.ilike.return_value = mock_table_obj
        mock_table_obj.contains.return_value = mock_table_obj
        mock_table_obj.order.return_value = mock_table_obj
        mock_table_obj.range.return_value = mock_table_obj
        mock_table_obj.limit.return_value = mock_table_obj
        mock_table_obj.single.return_value = mock_table_obj
        mock_table_obj.maybe_single.return_value = mock_table_obj
        mock_table_obj.execute.return_value = mock_response

        return mock_table_obj

    mock_supabase.table.side_effect = mock_table

    # Mock OSS service
    mock_oss = MagicMock()
    mock_oss.upload_file.return_value = {
        "success": True,
        "file_path": "resumes/test.pdf",
        "file_url": "https://oss.example.com/test.pdf",
        "file_md5": "abc123",
        "file_size": 1024,
    }

    # Mock resume parser
    mock_parser = MagicMock()
    mock_parser.parse_resume = AsyncMock(
        return_value={
            "name": "张三",
            "phone": "13800138000",
            "email": "test@example.com",
            "skills": ["Python"],
            "highlights": "5年经验",
        }
    )

    # Create service instances with mocks
    candidate_service = CandidateService(mock_supabase, mock_oss, mock_parser)
    position_service = PositionService(mock_supabase)
    pc_service = PositionCandidateService(mock_supabase)
    feedback_service = InterviewFeedbackService(mock_supabase)

    # Override dependencies
    app.dependency_overrides[get_candidate_service] = lambda: candidate_service
    app.dependency_overrides[get_position_service] = lambda: position_service
    app.dependency_overrides[get_position_candidate_service] = lambda: pc_service
    app.dependency_overrides[get_interview_feedback_service] = lambda: feedback_service
    app.dependency_overrides[get_oss_service] = lambda: mock_oss
    app.dependency_overrides[get_resume_parser] = lambda: mock_parser

    # Create test client
    client = TestClient(app)

    yield client

    # Clear overrides after test
    app.dependency_overrides.clear()


@pytest.fixture
def sample_candidate_data():
    """Sample candidate data for testing."""
    return {
        "name": "测试候选人",
        "phone": "13800138000",
        "email": "test@example.com",
        "skills": ["Python", "React"],
        "highlights": "5年开发经验",
        "score": 3,
        "years_of_experience": 5,
        "education_level": "本科",
        "recent_company": "某公司",
        "recent_position": "工程师",
        "resume_file": "https://oss.example.com/resume.pdf",
        "resume_md5": "abc123def456",
    }


@pytest.fixture
def sample_position_data():
    """Sample position data for testing."""
    return {
        "title": "Python工程师",
        "department": "技术部",
        "jd": "负责后端开发工作，要求精通Python",
        "requirements": {
            "skills": ["Python", "Django"],
            "experience": "3年以上",
            "education": "本科及以上",
        },
        "status": "open",
        "created_by": 1,
    }


@pytest.fixture
def sample_feedback_data():
    """Sample interview feedback data for testing."""
    return {
        "candidate_id": 1,
        "position_id": 1,
        "interviewer": 1,
        "rating": 4,
        "comments": "技术基础扎实，沟通能力强",
        "interview_date": "2024-01-15",
    }
