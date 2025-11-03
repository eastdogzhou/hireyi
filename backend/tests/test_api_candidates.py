"""Integration tests for Candidate API endpoints."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient


def test_health_check(test_client: TestClient):
    """Test health check endpoint."""
    response = test_client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "timestamp" in data


def test_root_endpoint(test_client: TestClient):
    """Test root endpoint."""
    response = test_client.get("/")

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "hireyi API"
    assert data["docs"] == "/docs"


def test_get_candidates_empty(test_client: TestClient):
    """Test getting candidates when database is empty."""
    response = test_client.get("/api/candidates/")

    assert response.status_code == 200
    data = response.json()
    assert "candidates" in data
    assert "total" in data
    assert "limit" in data
    assert "offset" in data
    assert isinstance(data["candidates"], list)


def test_get_candidates_with_filters(test_client: TestClient):
    """Test getting candidates with query filters."""
    response = test_client.get(
        "/api/candidates/",
        params={
            "name": "张三",
            "skills": ["Python", "React"],
            "min_score": 2,
            "max_score": 4,
            "limit": 10,
            "offset": 0,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["limit"] == 10
    assert data["offset"] == 0


def test_get_candidate_not_found(test_client: TestClient):
    """Test getting a non-existent candidate."""
    response = test_client.get("/api/candidates/99999")

    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


def test_create_candidate_success(test_client: TestClient, sample_candidate_data, monkeypatch):
    """Test creating a candidate successfully."""
    from datetime import datetime, timezone

    # Mock service to return created candidate
    created_candidate = {
        **sample_candidate_data,
        "id": 1,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    def mock_create(self, data):
        return created_candidate

    from app.services.candidate_service import CandidateService

    monkeypatch.setattr(CandidateService, "create", mock_create)

    response = test_client.post("/api/candidates/", json=sample_candidate_data)

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == sample_candidate_data["name"]
    assert data["email"] == sample_candidate_data["email"]
    assert "id" in data


def test_create_candidate_validation_error(test_client: TestClient):
    """Test creating candidate with invalid data."""
    invalid_data = {
        "name": "",  # Empty name should fail validation
        "email": "invalid-email",  # Invalid email format
    }

    response = test_client.post("/api/candidates/", json=invalid_data)

    assert response.status_code == 422  # Validation error


def test_update_candidate_success(test_client: TestClient, monkeypatch):
    """Test updating a candidate successfully."""
    from datetime import datetime, timezone

    candidate_id = 1
    update_data = {"name": "新名字", "skills": ["Python", "Django", "React"]}

    # Mock exists check
    def mock_exists(self, record_id):
        return True

    # Mock update
    def mock_update(self, record_id, data):
        return {
            "id": record_id,
            "name": data["name"],
            "skills": data["skills"],
            "email": "test@example.com",
            "phone": "13800138000",
            "highlights": "测试亮点",
            "years_of_experience": 5,
            "education_level": "本科",
            "recent_company": "测试公司",
            "recent_position": "工程师",
            "score": 3,
            "resume_file": "https://oss.example.com/resume.pdf",
            "resume_md5": "d41d8cd98f00b204e9800998ecf8427e",
            "resume_text": None,
            "work_experience": None,
            "education_background": None,
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }

    from app.services.candidate_service import CandidateService

    monkeypatch.setattr(CandidateService, "exists", mock_exists)
    monkeypatch.setattr(CandidateService, "update", mock_update)

    response = test_client.patch(f"/api/candidates/{candidate_id}", json=update_data)

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["skills"] == update_data["skills"]


def test_update_candidate_not_found(test_client: TestClient, monkeypatch):
    """Test updating a non-existent candidate."""

    def mock_exists(self, record_id):
        return False

    from app.services.candidate_service import CandidateService

    monkeypatch.setattr(CandidateService, "exists", mock_exists)

    response = test_client.patch("/api/candidates/99999", json={"name": "新名字"})

    assert response.status_code == 404


def test_delete_candidate_success(test_client: TestClient, monkeypatch):
    """Test deleting a candidate successfully."""
    candidate_id = 1

    # Mock exists check
    def mock_exists(self, record_id):
        return True

    # Mock soft delete
    def mock_soft_delete(self, record_id):
        return True

    from app.services.candidate_service import CandidateService

    monkeypatch.setattr(CandidateService, "exists", mock_exists)
    monkeypatch.setattr(CandidateService, "soft_delete", mock_soft_delete)

    response = test_client.delete(f"/api/candidates/{candidate_id}")

    assert response.status_code == 204


def test_delete_candidate_not_found(test_client: TestClient, monkeypatch):
    """Test deleting a non-existent candidate."""

    def mock_exists(self, record_id):
        return False

    from app.services.candidate_service import CandidateService

    monkeypatch.setattr(CandidateService, "exists", mock_exists)

    response = test_client.delete("/api/candidates/99999")

    assert response.status_code == 404


def test_upload_resume_invalid_file_type(test_client: TestClient):
    """Test uploading non-PDF file."""
    # Create a fake text file
    files = {"file": ("resume.txt", b"fake content", "text/plain")}

    response = test_client.post("/api/candidates/upload", files=files)

    assert response.status_code == 400
    data = response.json()
    assert "pdf" in data["detail"].lower()


@pytest.mark.asyncio
async def test_upload_resume_success(test_client: TestClient, monkeypatch):
    """Test uploading resume successfully."""
    from datetime import datetime, timezone
    from unittest.mock import AsyncMock

    # Mock upload_and_create_from_resume
    async def mock_upload_and_create(self, file_content, file_name, auto_parse=True):
        return {
            "candidate": {
                "id": 1,
                "name": "张三",
                "email": "zhangsan@example.com",
                "phone": "13800138000",
                "skills": ["Python"],
                "highlights": "5年经验",
                "years_of_experience": 5,
                "education_level": "本科",
                "recent_company": "某公司",
                "recent_position": "工程师",
                "score": 3,
                "resume_file": "https://oss.example.com/resume.pdf",
                "resume_md5": "d41d8cd98f00b204e9800998ecf8427e",
                "resume_text": None,
                "work_experience": None,
                "education_background": None,
                "is_deleted": False,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            },
            "file_url": "https://oss.example.com/resume.pdf",
            "parse_status": "success",
        }

    from app.services.candidate_service import CandidateService

    monkeypatch.setattr(
        CandidateService,
        "upload_and_create_from_resume",
        mock_upload_and_create,
    )

    # Create a fake PDF file
    files = {"file": ("resume.pdf", b"%PDF-1.4 fake content", "application/pdf")}

    response = test_client.post("/api/candidates/upload", files=files)

    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert data["candidate"] is not None
    assert data["file_url"] is not None


@pytest.mark.asyncio
async def test_batch_upload_resumes(test_client: TestClient, monkeypatch):
    """Test batch uploading resumes."""
    from unittest.mock import AsyncMock

    # Mock batch_upload_resumes
    async def mock_batch_upload(self, files, auto_parse=True):
        return {
            "total": 2,
            "successful": 2,
            "failed": 0,
            "results": [
                {
                    "file_name": "resume1.pdf",
                    "status": "success",
                    "candidate": {
                        "id": 1,
                        "name": "候选人1",
                        "email": "test1@example.com",
                    },
                    "error": None,
                },
                {
                    "file_name": "resume2.pdf",
                    "status": "success",
                    "candidate": {
                        "id": 2,
                        "name": "候选人2",
                        "email": "test2@example.com",
                    },
                    "error": None,
                },
            ],
        }

    from app.services.candidate_service import CandidateService

    monkeypatch.setattr(CandidateService, "batch_upload_resumes", mock_batch_upload)

    # Create fake PDF files
    files = [
        ("files", ("resume1.pdf", b"%PDF-1.4 content1", "application/pdf")),
        ("files", ("resume2.pdf", b"%PDF-1.4 content2", "application/pdf")),
    ]

    response = test_client.post("/api/candidates/batch-upload", files=files)

    assert response.status_code == 201
    data = response.json()
    assert data["total"] == 2
    assert data["successful"] == 2
    assert data["failed"] == 0
    assert len(data["results"]) == 2
