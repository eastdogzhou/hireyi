"""Tests for PositionCandidateService."""

from unittest.mock import MagicMock

import pytest

from app.services.position_candidate_service import PositionCandidateService


@pytest.fixture
def mock_supabase():
    """Create a mock Supabase client."""
    return MagicMock()


@pytest.fixture
def position_candidate_service(mock_supabase):
    """Create PositionCandidateService instance with mock Supabase client."""
    return PositionCandidateService(mock_supabase)


def test_calculate_overall_score(position_candidate_service):
    """Test overall score calculation formula."""
    # Test case 1: relevance=4, fit=3
    # Expected: (4*0.6 + 3*0.4) * 25 = (2.4 + 1.2) * 25 = 90
    overall, numeric = position_candidate_service._calculate_overall_score(4, 3)
    assert numeric == 90
    assert overall == 4  # round(3.6) = 4

    # Test case 2: relevance=2, fit=2
    # Expected: (2*0.6 + 2*0.4) * 25 = 2.0 * 25 = 50
    overall, numeric = position_candidate_service._calculate_overall_score(2, 2)
    assert numeric == 50
    assert overall == 2

    # Test case 3: relevance=3, fit=4
    # Expected: (3*0.6 + 4*0.4) * 25 = (1.8 + 1.6) * 25 = 85
    overall, numeric = position_candidate_service._calculate_overall_score(3, 4)
    assert numeric == 85
    assert overall == 3  # round(3.4) = 3


def test_create_association_success(position_candidate_service, mock_supabase):
    """Test successful association creation with score calculation."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {
            "id": 1,
            "position_id": 10,
            "candidate_id": 20,
            "relevance_score": 4,
            "fit_score": 3,
            "overall_score": 4,
            "overall_score_numeric": 90,
            "current_status": "screening",
        }
    ]

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .insert.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    result = position_candidate_service.create_association(
        position_id=10,
        candidate_id=20,
        relevance_score=4,
        fit_score=3,
    )

    # Verify
    assert result["id"] == 1
    assert result["relevance_score"] == 4
    assert result["fit_score"] == 3
    assert result["overall_score"] == 4
    assert result["overall_score_numeric"] == 90
    assert result["current_status"] == "screening"


def test_create_association_invalid_scores(position_candidate_service):
    """Test creating association with invalid scores raises error."""
    # Test score out of range
    with pytest.raises(ValueError, match="Scores must be between 1 and 4"):
        position_candidate_service.create_association(
            position_id=10,
            candidate_id=20,
            relevance_score=5,  # Invalid
            fit_score=3,
        )

    with pytest.raises(ValueError, match="Scores must be between 1 and 4"):
        position_candidate_service.create_association(
            position_id=10,
            candidate_id=20,
            relevance_score=3,
            fit_score=0,  # Invalid
        )


def test_create_association_duplicate(position_candidate_service, mock_supabase):
    """Test creating duplicate association raises error."""
    # Mock duplicate key error
    mock_supabase.table.return_value.insert.return_value.execute.side_effect = Exception(
        "duplicate key value violates unique constraint"
    )

    # Execute and verify
    with pytest.raises(ValueError, match="already exists"):
        position_candidate_service.create_association(
            position_id=10,
            candidate_id=20,
            relevance_score=4,
            fit_score=3,
        )


def test_update_scores_success(position_candidate_service, mock_supabase):
    """Test updating scores with recalculation."""
    # Mock get_by_id response
    mock_get_response = MagicMock()
    mock_get_response.data = {
        "id": 1,
        "relevance_score": 3,
        "fit_score": 3,
        "overall_score": 3,
        "overall_score_numeric": 75,
    }

    # Mock update response
    mock_update_response = MagicMock()
    mock_update_response.data = [
        {
            "id": 1,
            "relevance_score": 4,
            "fit_score": 3,
            "overall_score": 4,
            "overall_score_numeric": 90,
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
    result = position_candidate_service.update_scores(
        record_id=1,
        relevance_score=4,  # Update only relevance
    )

    # Verify recalculation
    assert result["relevance_score"] == 4
    assert result["overall_score"] == 4
    assert result["overall_score_numeric"] == 90


def test_update_status_success(position_candidate_service, mock_supabase):
    """Test updating candidate status."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {
            "id": 1,
            "current_status": "interview",
        }
    ]

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .update.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    result = position_candidate_service.update_status(1, "interview")

    # Verify
    assert result["current_status"] == "interview"


def test_update_status_invalid(position_candidate_service):
    """Test updating with invalid status raises error."""
    with pytest.raises(ValueError, match="Invalid status"):
        position_candidate_service.update_status(1, "invalid_status")


def test_get_candidates_for_position(position_candidate_service, mock_supabase):
    """Test getting candidates for a position with filtering."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {
            "id": 1,
            "position_id": 10,
            "candidate_id": 20,
            "overall_score_numeric": 90,
            "current_status": "screening",
        },
        {
            "id": 2,
            "position_id": 10,
            "candidate_id": 21,
            "overall_score_numeric": 85,
            "current_status": "screening",
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
    result = position_candidate_service.get_candidates_for_position(
        position_id=10,
        status="screening",
        sort_by="score",
    )

    # Verify
    assert len(result["associations"]) == 2
    assert result["total"] == 2
    assert all(a["position_id"] == 10 for a in result["associations"])


def test_get_candidates_for_position_with_min_score(position_candidate_service, mock_supabase):
    """Test getting candidates with minimum score filter."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {
            "id": 1,
            "position_id": 10,
            "candidate_id": 20,
            "overall_score_numeric": 90,
        },
    ]
    mock_response.count = 1

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .gte.return_value
        .order.return_value
        .range.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    result = position_candidate_service.get_candidates_for_position(
        position_id=10,
        min_score=85,
        sort_by="score",
    )

    # Verify
    assert len(result["associations"]) == 1
    assert result["total"] == 1
    assert result["associations"][0]["overall_score_numeric"] == 90


def test_get_positions_for_candidate(position_candidate_service, mock_supabase):
    """Test getting positions for a candidate."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {
            "id": 1,
            "position_id": 10,
            "candidate_id": 20,
            "current_status": "interview",
        },
        {
            "id": 2,
            "position_id": 11,
            "candidate_id": 20,
            "current_status": "screening",
        },
    ]
    mock_response.count = 2

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
    result = position_candidate_service.get_positions_for_candidate(candidate_id=20)

    # Verify
    assert len(result["associations"]) == 2
    assert result["total"] == 2
    assert all(a["candidate_id"] == 20 for a in result["associations"])


def test_check_association_exists_true(position_candidate_service, mock_supabase):
    """Test checking if association exists (true case)."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = {"id": 1, "position_id": 10, "candidate_id": 20}

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    exists = position_candidate_service.check_association_exists(
        position_id=10,
        candidate_id=20,
    )

    # Verify
    assert exists is True


def test_check_association_exists_false(position_candidate_service, mock_supabase):
    """Test checking if association exists (false case)."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = None

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    exists = position_candidate_service.check_association_exists(
        position_id=10,
        candidate_id=20,
    )

    # Verify
    assert exists is False


def test_get_association(position_candidate_service, mock_supabase):
    """Test getting specific association."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = {
        "id": 1,
        "position_id": 10,
        "candidate_id": 20,
        "relevance_score": 4,
        "fit_score": 3,
    }

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    result = position_candidate_service.get_association(
        position_id=10,
        candidate_id=20,
    )

    # Verify
    assert result is not None
    assert result["position_id"] == 10
    assert result["candidate_id"] == 20


def test_count_by_status(position_candidate_service, mock_supabase):
    """Test counting candidates by status for a position."""
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
    count = position_candidate_service.count_by_status(
        position_id=10,
        status="interview",
    )

    # Verify
    assert count == 3
