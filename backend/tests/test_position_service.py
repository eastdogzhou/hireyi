"""Tests for PositionService."""

from unittest.mock import MagicMock

import pytest

from app.services.position_service import PositionService


@pytest.fixture
def mock_supabase():
    """Create a mock Supabase client."""
    return MagicMock()


@pytest.fixture
def position_service(mock_supabase):
    """Create PositionService instance with mock Supabase client."""
    return PositionService(mock_supabase)


def test_get_by_status(position_service, mock_supabase):
    """Test getting positions by status."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Python开发工程师", "status": "open"},
        {"id": 2, "title": "前端工程师", "status": "open"},
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
    result = position_service.get_by_status("open")

    # Verify
    assert len(result) == 2
    assert all(pos["status"] == "open" for pos in result)


def test_get_by_department(position_service, mock_supabase):
    """Test getting positions by department."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Python开发工程师", "department": "技术部"},
        {"id": 3, "title": "测试工程师", "department": "技术部"},
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
    result = position_service.get_by_department("技术部")

    # Verify
    assert len(result) == 2
    assert all(pos["department"] == "技术部" for pos in result)


def test_search_positions_by_title(position_service, mock_supabase):
    """Test searching positions by title (fuzzy match)."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Python开发工程师", "status": "open"},
        {"id": 4, "title": "Python后端工程师", "status": "open"},
    ]
    mock_response.count = 2

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .ilike.return_value
        .order.return_value
        .range.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    result = position_service.search_positions(title_query="Python")

    # Verify
    assert len(result["positions"]) == 2
    assert result["total"] == 2
    assert all("Python" in pos["title"] for pos in result["positions"])


def test_search_positions_with_filters(position_service, mock_supabase):
    """Test searching positions with multiple filters."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Python开发工程师", "department": "技术部", "status": "open"},
    ]
    mock_response.count = 1

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .ilike.return_value
        .eq.return_value
        .eq.return_value
        .order.return_value
        .range.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    result = position_service.search_positions(
        title_query="Python",
        department="技术部",
        status="open",
    )

    # Verify
    assert len(result["positions"]) == 1
    assert result["total"] == 1
    assert result["positions"][0]["title"] == "Python开发工程师"
    assert result["positions"][0]["department"] == "技术部"
    assert result["positions"][0]["status"] == "open"


def test_update_status_success(position_service, mock_supabase):
    """Test successful status update."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Python开发工程师", "status": "closed"},
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
    result = position_service.update_status(1, "closed")

    # Verify
    assert result["id"] == 1
    assert result["status"] == "closed"


def test_update_status_not_found(position_service, mock_supabase):
    """Test status update for non-existent position raises error."""
    # Mock response for not found
    mock_response = MagicMock()
    mock_response.data = []

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .update.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = mock_response

    # Execute and verify
    with pytest.raises(ValueError, match="not found or already deleted"):
        position_service.update_status(999, "closed")


def test_soft_delete_cascade(position_service, mock_supabase):
    """Test soft delete with cascade to position_candidates."""
    # Mock soft delete on position
    mock_response_delete = MagicMock()
    mock_response_delete.data = [{"id": 1, "is_deleted": True}]

    # Mock cascade update
    mock_response_cascade = MagicMock()
    mock_response_cascade.data = [
        {"id": 10, "position_id": 1, "is_deleted": True},
        {"id": 11, "position_id": 1, "is_deleted": True},
    ]

    # Setup mock chains
    (
        mock_supabase.table.return_value
        .update.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = mock_response_delete

    # Setup cascade mock
    mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response_cascade

    # Execute
    result = position_service.soft_delete(1)

    # Verify
    assert result is True
    # Verify cascade was called
    assert mock_supabase.table.call_count >= 2  # Once for position, once for position_candidates


def test_count_by_status(position_service, mock_supabase):
    """Test counting positions by status."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [{"id": 1}, {"id": 2}, {"id": 3}]

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    count = position_service.count_by_status("open")

    # Verify
    assert count == 3


def test_get_open_positions(position_service, mock_supabase):
    """Test getting open positions (convenience method)."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Python开发工程师", "status": "open"},
        {"id": 2, "title": "前端工程师", "status": "open"},
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
    result = position_service.get_open_positions()

    # Verify
    assert len(result) == 2
    assert all(pos["status"] == "open" for pos in result)


def test_close_position(position_service, mock_supabase):
    """Test closing a position (convenience method)."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Python开发工程师", "status": "closed"},
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
    result = position_service.close_position(1)

    # Verify
    assert result["status"] == "closed"


def test_reopen_position(position_service, mock_supabase):
    """Test reopening a position (convenience method)."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Python开发工程师", "status": "open"},
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
    result = position_service.reopen_position(1)

    # Verify
    assert result["status"] == "open"


def test_create_position(position_service, mock_supabase):
    """Test creating a new position."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {
            "id": 1,
            "title": "Python开发工程师",
            "department": "技术部",
            "jd": "负责后端开发",
            "status": "open",
        }
    ]

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .insert.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    position_data = {
        "title": "Python开发工程师",
        "department": "技术部",
        "jd": "负责后端开发",
        "status": "open",
    }

    result = position_service.create(position_data)

    # Verify
    assert result["id"] == 1
    assert result["title"] == "Python开发工程师"
    assert result["department"] == "技术部"


def test_update_position(position_service, mock_supabase):
    """Test updating position information."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {
            "id": 1,
            "title": "高级Python开发工程师",
            "department": "技术部",
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
    update_data = {"title": "高级Python开发工程师"}
    result = position_service.update(1, update_data)

    # Verify
    assert result["title"] == "高级Python开发工程师"


def test_get_all_positions(position_service, mock_supabase):
    """Test getting all active positions."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Python开发工程师", "status": "open"},
        {"id": 2, "title": "前端工程师", "status": "open"},
        {"id": 3, "title": "测试工程师", "status": "closed"},
    ]

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .order.return_value
        .range.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    result = position_service.get_all()

    # Verify
    assert len(result) == 3
