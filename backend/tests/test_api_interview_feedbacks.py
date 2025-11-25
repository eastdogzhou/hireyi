"""Integration tests for Interview Feedback API endpoints."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def test_create_interview_feedback_success(
    test_client: TestClient, sample_feedback_data, monkeypatch
):
    """Test creating interview feedback successfully."""
    # Mock service to return created feedback
    created_feedback = {
        **sample_feedback_data,
        "id": 1,
        "is_status_change": False,
        "new_status": None,
        "is_deleted": False,
        "created_at": "2024-01-15T00:00:00Z",
    }

    def mock_create(self, data):
        return created_feedback

    from app.services.interview_feedback_service import InterviewFeedbackService

    monkeypatch.setattr(InterviewFeedbackService, "create", mock_create)

    response = test_client.post("/api/interview-feedbacks/", json=sample_feedback_data)

    assert response.status_code == 201
    data = response.json()
    assert data["candidate_id"] == sample_feedback_data["candidate_id"]
    assert data["position_id"] == sample_feedback_data["position_id"]
    assert data["rating"] == sample_feedback_data["rating"]
    assert data["is_status_change"] is False


def test_create_interview_feedback_validation_error(test_client: TestClient):
    """Test creating feedback with invalid data."""
    invalid_data = {
        "candidate_id": 1,
        "position_id": 1,
        "interviewer": 1,
        "rating": 10,  # Rating > 5 should fail
    }

    response = test_client.post("/api/interview-feedbacks/", json=invalid_data)

    assert response.status_code == 422  # Validation error


def test_create_status_change_success(test_client: TestClient, monkeypatch):
    """Test creating status change record successfully."""
    status_change_data = {
        "candidate_id": 1,
        "position_id": 1,
        "interviewer": 1,
        "new_status": "interview",
        "comments": "初筛通过，邀请面试",
    }

    # Mock service to return created record
    created_record = {
        "id": 1,
        "candidate_id": 1,
        "position_id": 1,
        "interviewer": 1,
        "rating": None,
        "comments": "初筛通过，邀请面试",
        "interview_date": None,
        "new_status": "interview",
        "is_status_change": True,
        "is_deleted": False,
        "created_at": "2024-01-15T00:00:00Z",
    }

    def mock_create(self, data):
        return created_record

    from app.services.interview_feedback_service import InterviewFeedbackService

    monkeypatch.setattr(InterviewFeedbackService, "create", mock_create)

    response = test_client.post(
        "/api/interview-feedbacks/status-change", json=status_change_data
    )

    assert response.status_code == 201
    data = response.json()
    assert data["new_status"] == "interview"
    assert data["is_status_change"] is True
    assert data["rating"] is None


def test_get_feedbacks_for_candidate_position(test_client: TestClient, monkeypatch):
    """Test getting feedbacks for a candidate-position pair."""
    # Mock service to return feedbacks
    def mock_get_feedbacks(
        self, candidate_id, position_id, include_status_changes, limit, offset
    ):
        return {
            "feedbacks": [
                {
                    "id": 1,
                    "candidate_id": candidate_id,
                    "position_id": position_id,
                    "interviewer": 1,
                    "rating": 4,
                    "comments": "技术基础扎实",
                    "interview_date": "2024-01-15",
                    "new_status": None,
                    "is_status_change": False,
                    "is_deleted": False,
                    "created_at": "2024-01-15T10:00:00Z",
                },
                {
                    "id": 2,
                    "candidate_id": candidate_id,
                    "position_id": position_id,
                    "interviewer": 1,
                    "rating": None,
                    "comments": "初筛通过",
                    "interview_date": None,
                    "new_status": "interview",
                    "is_status_change": True,
                    "is_deleted": False,
                    "created_at": "2024-01-15T11:00:00Z",
                },
            ],
            "total": 2,
            "limit": limit,
            "offset": offset,
        }

    from app.services.interview_feedback_service import InterviewFeedbackService

    monkeypatch.setattr(
        InterviewFeedbackService,
        "get_feedbacks_for_candidate_position",
        mock_get_feedbacks,
    )

    response = test_client.get(
        "/api/interview-feedbacks/",
        params={"candidate_id": 1, "position_id": 1, "include_status_changes": True},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["feedbacks"]) == 2
    # First should be interview feedback
    assert data["feedbacks"][0]["is_status_change"] is False
    assert data["feedbacks"][0]["rating"] == 4
    # Second should be status change
    assert data["feedbacks"][1]["is_status_change"] is True
    assert data["feedbacks"][1]["new_status"] == "interview"


def test_get_feedbacks_interview_only(test_client: TestClient, monkeypatch):
    """Test getting only interview feedbacks (exclude status changes)."""

    def mock_get_feedbacks(
        self, candidate_id, position_id, include_status_changes, limit, offset
    ):
        feedbacks = []
        if include_status_changes:
            # Should not reach here in this test
            pass
        else:
            feedbacks = [
                {
                    "id": 1,
                    "candidate_id": candidate_id,
                    "position_id": position_id,
                    "interviewer": 1,
                    "rating": 4,
                    "comments": "技术基础扎实",
                    "interview_date": "2024-01-15",
                    "new_status": None,
                    "is_status_change": False,
                    "is_deleted": False,
                    "created_at": "2024-01-15T10:00:00Z",
                },
            ]
        return {
            "feedbacks": feedbacks,
            "total": len(feedbacks),
            "limit": limit,
            "offset": offset,
        }

    from app.services.interview_feedback_service import InterviewFeedbackService

    monkeypatch.setattr(
        InterviewFeedbackService,
        "get_feedbacks_for_candidate_position",
        mock_get_feedbacks,
    )

    response = test_client.get(
        "/api/interview-feedbacks/",
        params={
            "candidate_id": 1,
            "position_id": 1,
            "include_status_changes": False,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert all(f["is_status_change"] is False for f in data["feedbacks"])


def test_get_feedbacks_by_interviewer(test_client: TestClient, monkeypatch):
    """Test getting feedbacks by interviewer."""

    def mock_get_feedbacks_by_interviewer(self, interviewer, limit, offset):
        return [
            {
                "id": 1,
                "candidate_id": 1,
                "position_id": 1,
                "interviewer": interviewer,
                "rating": 4,
                "comments": "不错",
                "interview_date": "2024-01-15",
                "new_status": None,
                "is_status_change": False,
                "is_deleted": False,
                "created_at": "2024-01-15T10:00:00Z",
            },
            {
                "id": 2,
                "candidate_id": 2,
                "position_id": 1,
                "interviewer": interviewer,
                "rating": 5,
                "comments": "优秀",
                "interview_date": "2024-01-16",
                "new_status": None,
                "is_status_change": False,
                "is_deleted": False,
                "created_at": "2024-01-16T10:00:00Z",
            },
        ]

    from app.services.interview_feedback_service import InterviewFeedbackService

    monkeypatch.setattr(
        InterviewFeedbackService,
        "get_feedbacks_by_interviewer",
        mock_get_feedbacks_by_interviewer,
    )

    response = test_client.get("/api/interview-feedbacks/interviewer/1")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    assert all(f["interviewer"] == 1 for f in data)


def test_get_feedback_by_id_success(test_client: TestClient, monkeypatch):
    """Test getting feedback by ID."""
    feedback_id = 1

    def mock_get_by_id(self, record_id):
        return {
            "id": record_id,
            "candidate_id": 1,
            "position_id": 1,
            "interviewer": 1,
            "rating": 4,
            "comments": "技术基础扎实",
            "interview_date": "2024-01-15",
            "new_status": None,
            "is_status_change": False,
            "is_deleted": False,
            "created_at": "2024-01-15T10:00:00Z",
        }

    from app.services.interview_feedback_service import InterviewFeedbackService

    monkeypatch.setattr(InterviewFeedbackService, "get_by_id", mock_get_by_id)

    response = test_client.get(f"/api/interview-feedbacks/{feedback_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == feedback_id


def test_get_feedback_by_id_not_found(test_client: TestClient, monkeypatch):
    """Test getting non-existent feedback."""

    def mock_get_by_id(self, record_id):
        return None

    from app.services.interview_feedback_service import InterviewFeedbackService

    monkeypatch.setattr(InterviewFeedbackService, "get_by_id", mock_get_by_id)

    response = test_client.get("/api/interview-feedbacks/99999")

    assert response.status_code == 404


def test_update_feedback_success(test_client: TestClient, monkeypatch):
    """Test updating interview feedback successfully."""
    feedback_id = 1
    update_data = {"rating": 5, "comments": "非常优秀"}

    # Mock exists check
    def mock_exists(self, record_id):
        return True

    # Mock update
    def mock_update(self, record_id, data):
        return {
            "id": record_id,
            "candidate_id": 1,
            "position_id": 1,
            "interviewer": 1,
            "rating": data["rating"],
            "comments": data["comments"],
            "interview_date": "2024-01-15",
            "new_status": None,
            "is_status_change": False,
            "is_deleted": False,
            "created_at": "2024-01-15T10:00:00Z",
        }

    from app.services.interview_feedback_service import InterviewFeedbackService

    monkeypatch.setattr(InterviewFeedbackService, "exists", mock_exists)
    monkeypatch.setattr(InterviewFeedbackService, "update", mock_update)

    response = test_client.patch(f"/api/interview-feedbacks/{feedback_id}", json=update_data)

    assert response.status_code == 200
    data = response.json()
    assert data["rating"] == update_data["rating"]
    assert data["comments"] == update_data["comments"]


def test_update_feedback_not_found(test_client: TestClient, monkeypatch):
    """Test updating non-existent feedback."""

    def mock_exists(self, record_id):
        return False

    from app.services.interview_feedback_service import InterviewFeedbackService

    monkeypatch.setattr(InterviewFeedbackService, "exists", mock_exists)

    response = test_client.patch("/api/interview-feedbacks/99999", json={"rating": 5})

    assert response.status_code == 404


def test_feedback_timeline(test_client: TestClient, monkeypatch):
    """Test complete feedback timeline: feedback → status change → feedback."""
    from app.services.interview_feedback_service import InterviewFeedbackService

    # Step 1: Create initial interview feedback
    created_feedback = {
        "id": 1,
        "candidate_id": 1,
        "position_id": 1,
        "interviewer": 1,
        "rating": 4,
        "comments": "初试表现良好",
        "interview_date": "2024-01-15",
        "new_status": None,
        "is_status_change": False,
        "is_deleted": False,
        "created_at": "2024-01-15T10:00:00Z",
    }

    def mock_create_feedback(self, data):
        return created_feedback

    monkeypatch.setattr(InterviewFeedbackService, "create", mock_create_feedback)

    response = test_client.post(
        "/api/interview-feedbacks/",
        json={
            "candidate_id": 1,
            "position_id": 1,
            "interviewer": 1,
            "rating": 4,
            "comments": "初试表现良好",
            "interview_date": "2024-01-15",
        },
    )
    assert response.status_code == 201

    # Step 2: Create status change
    created_status_change = {
        "id": 2,
        "candidate_id": 1,
        "position_id": 1,
        "interviewer": 1,
        "rating": None,
        "comments": "通过初试，进入复试",
        "interview_date": None,
        "new_status": "interview",
        "is_status_change": True,
        "is_deleted": False,
        "created_at": "2024-01-15T11:00:00Z",
    }

    def mock_create_status(self, data):
        return created_status_change

    monkeypatch.setattr(InterviewFeedbackService, "create", mock_create_status)

    response = test_client.post(
        "/api/interview-feedbacks/status-change",
        json={
            "candidate_id": 1,
            "position_id": 1,
            "interviewer": 1,
            "new_status": "interview",
            "comments": "通过初试，进入复试",
        },
    )
    assert response.status_code == 201

    # Step 3: Get complete timeline
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
        params={"candidate_id": 1, "position_id": 1},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
