"""End-to-end integration tests for complete business workflows."""

from __future__ import annotations

from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient


@pytest.mark.asyncio
async def test_complete_hiring_workflow(
    test_client: TestClient,
    sample_position_data,
    monkeypatch,
):
    """Test complete hiring workflow from resume upload to interview feedback.

    Workflow:
    1. Create position
    2. Upload candidate resume
    3. Link candidate to position (auto-scoring)
    4. Create interview feedback
    5. Update candidate status
    6. Get complete timeline
    """
    from app.services.candidate_service import CandidateService
    from app.services.interview_feedback_service import InterviewFeedbackService
    from app.services.position_candidate_service import PositionCandidateService
    from app.services.position_service import PositionService

    # Step 1: Create position
    created_position = {
        **sample_position_data,
        "id": 1,
        "is_deleted": False,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
    }

    def mock_create_position(self, data):
        return created_position

    monkeypatch.setattr(PositionService, "create", mock_create_position)

    response = test_client.post("/api/positions/", json=sample_position_data)
    assert response.status_code == 201
    position = response.json()
    position_id = position["id"]

    # Step 2: Upload candidate resume
    async def mock_upload_and_create(self, file_content, file_name, auto_parse=True):
        return {
            "candidate": {
                "id": 1,
                "name": "张三",
                "email": "zhangsan@example.com",
                "phone": "13800138000",
                "skills": ["Python", "Django"],
                "highlights": "5年全栈开发经验",
                "score": 3,
                "years_of_experience": 5,
                "education_level": "本科",
                "recent_company": "某互联网公司",
                "recent_position": "高级工程师",
                "resume_file": "https://oss.example.com/resume.pdf",
                "resume_md5": "abc123",
                "is_deleted": False,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z",
            },
            "file_url": "https://oss.example.com/resume.pdf",
            "parse_status": "success",
        }

    monkeypatch.setattr(
        CandidateService,
        "upload_and_create_from_resume",
        mock_upload_and_create,
    )

    files = {"file": ("resume.pdf", b"%PDF-1.4 content", "application/pdf")}
    response = test_client.post("/api/candidates/upload", files=files)
    assert response.status_code == 201
    upload_result = response.json()
    assert upload_result["status"] == "success"
    candidate = upload_result["candidate"]
    candidate_id = candidate["id"]

    # Step 3: Link candidate to position with auto-scoring (simulated)
    # Note: This would normally be done via smart screening API endpoint
    # For this test, we'll simulate the result
    assert position_id == 1
    assert candidate_id == 1

    # Step 4: Create interview feedback
    feedback_data = {
        "candidate_id": candidate_id,
        "position_id": position_id,
        "interviewer": 1,
        "rating": 4,
        "comments": "技术基础扎实，沟通能力强",
        "interview_date": "2024-01-15",
    }

    created_feedback = {
        **feedback_data,
        "id": 1,
        "new_status": None,
        "is_status_change": False,
        "is_deleted": False,
        "created_at": "2024-01-15T10:00:00Z",
    }

    def mock_create_feedback(self, data):
        return created_feedback

    monkeypatch.setattr(InterviewFeedbackService, "create", mock_create_feedback)

    response = test_client.post("/api/interview-feedbacks/", json=feedback_data)
    assert response.status_code == 201
    feedback = response.json()
    assert feedback["rating"] == 4

    # Step 5: Update candidate status to "offer"
    status_change_data = {
        "candidate_id": candidate_id,
        "position_id": position_id,
        "interviewer": 1,
        "new_status": "offer",
        "comments": "通过所有面试，发放offer",
    }

    created_status_change = {
        "id": 2,
        "candidate_id": candidate_id,
        "position_id": position_id,
        "interviewer": 1,
        "rating": None,
        "comments": "通过所有面试，发放offer",
        "interview_date": None,
        "new_status": "offer",
        "is_status_change": True,
        "is_deleted": False,
        "created_at": "2024-01-16T10:00:00Z",
    }

    def mock_create_status_change(self, data):
        return created_status_change

    monkeypatch.setattr(InterviewFeedbackService, "create", mock_create_status_change)

    response = test_client.post(
        "/api/interview-feedbacks/status-change", json=status_change_data
    )
    assert response.status_code == 201
    status_change = response.json()
    assert status_change["new_status"] == "offer"
    assert status_change["is_status_change"] is True

    # Step 6: Get complete timeline
    def mock_get_timeline(
        self, candidate_id, position_id, include_status_changes, limit, offset
    ):
        return {
            "feedbacks": [created_feedback, created_status_change],
            "total": 2,
            "limit": limit,
            "offset": offset,
        }

    monkeypatch.setattr(
        InterviewFeedbackService,
        "get_feedbacks_for_candidate_position",
        mock_get_timeline,
    )

    response = test_client.get(
        "/api/interview-feedbacks/",
        params={"candidate_id": candidate_id, "position_id": position_id},
    )
    assert response.status_code == 200
    timeline = response.json()
    assert timeline["total"] == 2
    assert timeline["feedbacks"][0]["is_status_change"] is False
    assert timeline["feedbacks"][1]["new_status"] == "offer"


@pytest.mark.asyncio
async def test_batch_resume_upload_and_filter(test_client: TestClient, monkeypatch):
    """Test batch uploading resumes and filtering candidates.

    Workflow:
    1. Batch upload 3 resumes
    2. Search candidates by skills
    3. Filter by score range
    """
    from app.services.candidate_service import CandidateService

    # Step 1: Batch upload resumes
    async def mock_batch_upload(self, files, auto_parse=True):
        return {
            "total": 3,
            "successful": 3,
            "failed": 0,
            "results": [
                {
                    "file_name": "resume1.pdf",
                    "status": "success",
                    "candidate": {
                        "id": 1,
                        "name": "候选人1",
                        "email": "test1@example.com",
                        "skills": ["Python", "Django"],
                        "score": 3,
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
                        "skills": ["Python", "React"],
                        "score": 4,
                    },
                    "error": None,
                },
                {
                    "file_name": "resume3.pdf",
                    "status": "success",
                    "candidate": {
                        "id": 3,
                        "name": "候选人3",
                        "email": "test3@example.com",
                        "skills": ["Java", "Spring"],
                        "score": 2,
                    },
                    "error": None,
                },
            ],
        }

    monkeypatch.setattr(CandidateService, "batch_upload_resumes", mock_batch_upload)

    files = [
        ("files", ("resume1.pdf", b"%PDF-1.4 content1", "application/pdf")),
        ("files", ("resume2.pdf", b"%PDF-1.4 content2", "application/pdf")),
        ("files", ("resume3.pdf", b"%PDF-1.4 content3", "application/pdf")),
    ]

    response = test_client.post("/api/candidates/batch-upload", files=files)
    assert response.status_code == 201
    batch_result = response.json()
    assert batch_result["total"] == 3
    assert batch_result["successful"] == 3

    # Step 2: Search candidates by Python skill
    def mock_search_candidates(
        self, name_query, skills, min_score, max_score, limit, offset
    ):
        # Filter results based on skills
        all_candidates = [
            {
                "id": 1,
                "name": "候选人1",
                "skills": ["Python", "Django"],
                "score": 3,
            },
            {
                "id": 2,
                "name": "候选人2",
                "skills": ["Python", "React"],
                "score": 4,
            },
        ]
        return {
            "candidates": all_candidates,
            "total": 2,
            "limit": limit,
            "offset": offset,
        }

    monkeypatch.setattr(CandidateService, "search_candidates", mock_search_candidates)

    response = test_client.get("/api/candidates/", params={"skills": ["Python"]})
    assert response.status_code == 200
    search_result = response.json()
    assert search_result["total"] == 2
    assert all("Python" in c["skills"] for c in search_result["candidates"])

    # Step 3: Filter by score >= 3
    def mock_search_high_score(
        self, name_query, skills, min_score, max_score, limit, offset
    ):
        return {
            "candidates": [
                {
                    "id": 1,
                    "name": "候选人1",
                    "skills": ["Python", "Django"],
                    "score": 3,
                },
                {
                    "id": 2,
                    "name": "候选人2",
                    "skills": ["Python", "React"],
                    "score": 4,
                },
            ],
            "total": 2,
            "limit": limit,
            "offset": offset,
        }

    monkeypatch.setattr(CandidateService, "search_candidates", mock_search_high_score)

    response = test_client.get(
        "/api/candidates/", params={"skills": ["Python"], "min_score": 3}
    )
    assert response.status_code == 200
    filtered_result = response.json()
    assert filtered_result["total"] == 2
    assert all(c["score"] >= 3 for c in filtered_result["candidates"])


def test_position_status_workflow(test_client: TestClient, sample_position_data, monkeypatch):
    """Test position status management workflow.

    Workflow:
    1. Create position (status=open)
    2. Update position details
    3. Close position (status=closed)
    4. Reopen position (status=open)
    """
    from app.services.position_service import PositionService

    # Step 1: Create position
    created_position = {
        **sample_position_data,
        "id": 1,
        "status": "open",
        "is_deleted": False,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
    }

    def mock_create(self, data):
        return created_position

    monkeypatch.setattr(PositionService, "create", mock_create)

    response = test_client.post("/api/positions/", json=sample_position_data)
    assert response.status_code == 201
    position = response.json()
    assert position["status"] == "open"
    position_id = position["id"]

    # Step 2: Update position details
    def mock_exists(self, record_id):
        return True

    def mock_update(self, record_id, data):
        return {**created_position, **data}

    monkeypatch.setattr(PositionService, "exists", mock_exists)
    monkeypatch.setattr(PositionService, "update", mock_update)

    response = test_client.patch(
        f"/api/positions/{position_id}",
        json={"jd": "更新后的职位描述"},
    )
    assert response.status_code == 200

    # Step 3: Close position
    def mock_update_status(self, record_id, new_status):
        return {**created_position, "status": new_status}

    monkeypatch.setattr(PositionService, "update_status", mock_update_status)

    response = test_client.patch(
        f"/api/positions/{position_id}/status",
        json={"status": "closed"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "closed"

    # Step 4: Reopen position
    response = test_client.patch(
        f"/api/positions/{position_id}/status",
        json={"status": "open"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "open"


def test_api_error_handling(test_client: TestClient):
    """Test API error handling and validation.

    Tests:
    1. 404 errors for non-existent resources
    2. 422 validation errors for invalid data
    3. 400 bad request errors
    """
    # Test 404 for non-existent candidate
    response = test_client.get("/api/candidates/99999")
    assert response.status_code == 404
    assert "detail" in response.json()

    # Test 404 for non-existent position
    response = test_client.get("/api/positions/99999")
    assert response.status_code == 404

    # Test 404 for non-existent feedback
    response = test_client.get("/api/interview-feedbacks/99999")
    assert response.status_code == 404

    # Test 422 validation error for invalid candidate data
    response = test_client.post(
        "/api/candidates/",
        json={"name": "", "email": "invalid"},
    )
    assert response.status_code == 422

    # Test 422 validation error for invalid position data
    response = test_client.post("/api/positions/", json={"title": ""})
    assert response.status_code == 422

    # Test 422 validation error for invalid feedback rating
    response = test_client.post(
        "/api/interview-feedbacks/",
        json={
            "candidate_id": 1,
            "position_id": 1,
            "interviewer": 1,
            "rating": 10,  # Invalid: > 5
        },
    )
    assert response.status_code == 422

    # Test 400 bad request for invalid position status
    response = test_client.patch(
        "/api/positions/1/status",
        json={"status": "invalid_status"},
    )
    assert response.status_code == 400
