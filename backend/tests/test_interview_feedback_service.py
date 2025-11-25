"""Tests for InterviewFeedbackService."""

from unittest.mock import MagicMock

import pytest

from app.services.interview_feedback_service import InterviewFeedbackService


@pytest.fixture
def mock_supabase():
    """Create a mock Supabase client."""
    return MagicMock()


@pytest.fixture
def interview_feedback_service(mock_supabase):
    """Create InterviewFeedbackService instance with mock Supabase client."""
    return InterviewFeedbackService(mock_supabase)


def test_create_interview_feedback_success(interview_feedback_service, mock_supabase):
    """Test successful interview feedback creation."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {
            "id": 1,
            "candidate_id": 20,
            "position_id": 10,
            "interviewer": 1,
            "rating": 4,
            "comments": "技术扎实，沟通能力强",
            "interview_date": "2025-10-16",
            "is_status_change": False,
        }
    ]

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .insert.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    result = interview_feedback_service.create_interview_feedback(
        candidate_id=20,
        position_id=10,
        interviewer=1,
        rating=4,
        comments="技术扎实，沟通能力强",
        interview_date="2025-10-16",
    )

    # Verify
    assert result["id"] == 1
    assert result["rating"] == 4
    assert result["is_status_change"] is False


def test_create_interview_feedback_invalid_rating(interview_feedback_service):
    """Test creating feedback with invalid rating raises error."""
    # Test rating out of range
    with pytest.raises(ValueError, match="Rating must be between 1 and 5"):
        interview_feedback_service.create_interview_feedback(
            candidate_id=20,
            position_id=10,
            interviewer=1,
            rating=6,  # Invalid
        )

    with pytest.raises(ValueError, match="Rating must be between 1 and 5"):
        interview_feedback_service.create_interview_feedback(
            candidate_id=20,
            position_id=10,
            interviewer=1,
            rating=0,  # Invalid
        )


def test_create_status_change_record_success(interview_feedback_service, mock_supabase):
    """Test successful status change record creation."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {
            "id": 2,
            "candidate_id": 20,
            "position_id": 10,
            "interviewer": 1,
            "new_status": "interview",
            "comments": "初步筛选通过，安排面试",
            "is_status_change": True,
            "rating": None,
            "interview_date": None,
        }
    ]

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .insert.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    result = interview_feedback_service.create_status_change_record(
        candidate_id=20,
        position_id=10,
        operator=1,
        new_status="interview",
        reason="初步筛选通过，安排面试",
    )

    # Verify
    assert result["id"] == 2
    assert result["new_status"] == "interview"
    assert result["is_status_change"] is True
    assert result["rating"] is None


def test_create_status_change_record_invalid_status(interview_feedback_service):
    """Test creating status change with invalid status raises error."""
    with pytest.raises(ValueError, match="Invalid status"):
        interview_feedback_service.create_status_change_record(
            candidate_id=20,
            position_id=10,
            operator=1,
            new_status="invalid_status",  # Invalid
        )


def test_update_feedback_success(interview_feedback_service, mock_supabase):
    """Test successful feedback update."""
    # Mock get_by_id response
    mock_get_response = MagicMock()
    mock_get_response.data = {
        "id": 1,
        "rating": 3,
        "comments": "初步评价",
        "is_status_change": False,
    }

    # Mock update response
    mock_update_response = MagicMock()
    mock_update_response.data = [
        {
            "id": 1,
            "rating": 4,
            "comments": "更新后的详细评价",
            "is_status_change": False,
        }
    ]

    # Setup mock chains
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = mock_get_response

    (
        mock_supabase.table.return_value
        .update.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = mock_update_response

    # Execute
    result = interview_feedback_service.update_feedback(
        record_id=1,
        rating=4,
        comments="更新后的详细评价",
    )

    # Verify
    assert result["rating"] == 4
    assert result["comments"] == "更新后的详细评价"


def test_update_feedback_status_change_forbidden(interview_feedback_service, mock_supabase):
    """Test updating status change record raises error."""
    # Mock get_by_id response - status change record
    mock_get_response = MagicMock()
    mock_get_response.data = {
        "id": 2,
        "is_status_change": True,
        "new_status": "interview",
    }

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = mock_get_response

    # Execute and verify
    with pytest.raises(ValueError, match="Cannot edit status change records"):
        interview_feedback_service.update_feedback(
            record_id=2,
            comments="尝试修改状态变更记录",
        )


def test_get_feedbacks_for_candidate_position(interview_feedback_service, mock_supabase):
    """Test getting all feedbacks for a candidate-position pair."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {
            "id": 1,
            "candidate_id": 20,
            "position_id": 10,
            "is_status_change": False,
            "rating": 4,
            "created_at": "2025-10-16T10:00:00",
        },
        {
            "id": 2,
            "candidate_id": 20,
            "position_id": 10,
            "is_status_change": True,
            "new_status": "interview",
            "created_at": "2025-10-16T11:00:00",
        },
    ]
    mock_response.count = 2

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .order.return_value
        .range.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    result = interview_feedback_service.get_feedbacks_for_candidate_position(
        candidate_id=20,
        position_id=10,
    )

    # Verify
    assert len(result["feedbacks"]) == 2
    assert result["total"] == 2
    assert result["feedbacks"][0]["is_status_change"] is False
    assert result["feedbacks"][1]["is_status_change"] is True


def test_get_interview_feedbacks_only(interview_feedback_service, mock_supabase):
    """Test getting only interview evaluations (exclude status changes)."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {
            "id": 1,
            "candidate_id": 20,
            "position_id": 10,
            "is_status_change": False,
            "rating": 4,
        },
        {
            "id": 3,
            "candidate_id": 20,
            "position_id": 10,
            "is_status_change": False,
            "rating": 5,
        },
    ]

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .order.return_value
        .range.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    result = interview_feedback_service.get_interview_feedbacks_only(
        candidate_id=20,
        position_id=10,
    )

    # Verify
    assert len(result) == 2
    assert all(f["is_status_change"] is False for f in result)


def test_get_status_change_history(interview_feedback_service, mock_supabase):
    """Test getting only status change history (exclude interviews)."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {
            "id": 2,
            "candidate_id": 20,
            "position_id": 10,
            "is_status_change": True,
            "new_status": "interview",
        },
        {
            "id": 4,
            "candidate_id": 20,
            "position_id": 10,
            "is_status_change": True,
            "new_status": "offer",
        },
    ]

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .order.return_value
        .range.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    result = interview_feedback_service.get_status_change_history(
        candidate_id=20,
        position_id=10,
    )

    # Verify
    assert len(result) == 2
    assert all(f["is_status_change"] is True for f in result)


def test_get_feedbacks_by_interviewer(interview_feedback_service, mock_supabase):
    """Test getting feedbacks by specific interviewer."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {
            "id": 1,
            "interviewer": 5,
            "rating": 4,
        },
        {
            "id": 3,
            "interviewer": 5,
            "rating": 5,
        },
    ]

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .order.return_value
        .range.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    result = interview_feedback_service.get_feedbacks_by_interviewer(interviewer=5)

    # Verify
    assert len(result) == 2
    assert all(f["interviewer"] == 5 for f in result)


def test_count_feedbacks_all(interview_feedback_service, mock_supabase):
    """Test counting all feedbacks for a candidate-position pair."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1},
        {"id": 2},
        {"id": 3},
    ]

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    count = interview_feedback_service.count_feedbacks_for_candidate_position(
        candidate_id=20,
        position_id=10,
    )

    # Verify
    assert count == 3


def test_count_feedbacks_interview_only(interview_feedback_service, mock_supabase):
    """Test counting only interview feedbacks."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1},
        {"id": 3},
    ]

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    count = interview_feedback_service.count_feedbacks_for_candidate_position(
        candidate_id=20,
        position_id=10,
        is_status_change=False,
    )

    # Verify
    assert count == 2


def test_count_feedbacks_status_change_only(interview_feedback_service, mock_supabase):
    """Test counting only status change records."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 2},
    ]

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    count = interview_feedback_service.count_feedbacks_for_candidate_position(
        candidate_id=20,
        position_id=10,
        is_status_change=True,
    )

    # Verify
    assert count == 1
