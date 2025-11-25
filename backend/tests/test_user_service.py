"""Tests for UserService."""

from unittest.mock import MagicMock

import pytest

from app.services.user_service import UserService


@pytest.fixture
def mock_supabase():
    """Create a mock Supabase client."""
    return MagicMock()


@pytest.fixture
def user_service(mock_supabase):
    """Create UserService instance with mock Supabase client."""
    return UserService(mock_supabase)


def test_create_user_success(user_service, mock_supabase):
    """Test successful user creation."""
    # Mock response for exists check (no existing user)
    mock_response_exists = MagicMock()
    mock_response_exists.data = None

    # Mock response for create
    mock_response_create = MagicMock()
    mock_response_create.data = [{
        "id": 1,
        "email": "test@example.com",
        "name": "Test User",
        "role": "recruiter",
        "is_deleted": False,
    }]

    # Setup mock chain for exists check
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = mock_response_exists

    # Setup mock chain for create
    (
        mock_supabase.table.return_value
        .insert.return_value
        .execute.return_value
    ) = mock_response_create

    # Create user
    user_data = {
        "email": "test@example.com",
        "name": "Test User",
        "role": "recruiter",
    }

    result = user_service.create(user_data)

    # Verify
    assert result["id"] == 1
    assert result["email"] == "test@example.com"
    assert result["name"] == "Test User"
    assert result["role"] == "recruiter"


def test_create_user_duplicate_email(user_service, mock_supabase):
    """Test creating user with duplicate email raises error."""
    # Mock response for exists check (existing user found)
    mock_response_exists = MagicMock()
    mock_response_exists.data = {
        "id": 1,
        "email": "existing@example.com",
        "name": "Existing User",
    }

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = mock_response_exists

    # Attempt to create user with duplicate email
    user_data = {
        "email": "existing@example.com",
        "name": "New User",
        "role": "recruiter",
    }

    with pytest.raises(ValueError, match="already exists"):
        user_service.create(user_data)


def test_get_by_email_found(user_service, mock_supabase):
    """Test getting user by email when user exists."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = {
        "id": 1,
        "email": "found@example.com",
        "name": "Found User",
        "role": "recruiter",
    }

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    result = user_service.get_by_email("found@example.com")

    # Verify
    assert result is not None
    assert result["email"] == "found@example.com"


def test_get_by_email_not_found(user_service, mock_supabase):
    """Test getting user by email when user doesn't exist."""
    # Mock response for not found
    mock_response = MagicMock()
    mock_response.data = None

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    result = user_service.get_by_email("notfound@example.com")

    # Verify
    assert result is None


def test_exists_by_email_true(user_service, mock_supabase):
    """Test exists_by_email returns True when user exists."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = {"id": 1, "email": "exists@example.com"}

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    result = user_service.exists_by_email("exists@example.com")

    # Verify
    assert result is True


def test_exists_by_email_false(user_service, mock_supabase):
    """Test exists_by_email returns False when user doesn't exist."""
    # Mock response for not found
    mock_response = MagicMock()
    mock_response.data = None

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    result = user_service.exists_by_email("notexists@example.com")

    # Verify
    assert result is False


def test_get_by_role(user_service, mock_supabase):
    """Test getting users by role."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "email": "user1@example.com", "role": "admin"},
        {"id": 2, "email": "user2@example.com", "role": "admin"},
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
    result = user_service.get_by_role("admin")

    # Verify
    assert len(result) == 2
    assert all(user["role"] == "admin" for user in result)


def test_update_user_success(user_service, mock_supabase):
    """Test successful user update."""
    # Mock response for email check (no conflict)
    mock_response_check = MagicMock()
    mock_response_check.data = None

    # Mock response for update
    mock_response_update = MagicMock()
    mock_response_update.data = [{
        "id": 1,
        "email": "updated@example.com",
        "name": "Updated Name",
        "role": "admin",
    }]

    # Setup mock chains
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_response_check
    mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response_update

    # Execute
    update_data = {"name": "Updated Name"}
    result = user_service.update(1, update_data)

    # Verify
    assert result["name"] == "Updated Name"


def test_update_user_email_conflict(user_service, mock_supabase):
    """Test updating user with conflicting email raises error."""
    # Mock response for email check (conflict found)
    mock_response_check = MagicMock()
    mock_response_check.data = {
        "id": 2,  # Different user ID
        "email": "conflict@example.com",
    }

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = mock_response_check

    # Execute
    update_data = {"email": "conflict@example.com"}

    with pytest.raises(ValueError, match="already in use"):
        user_service.update(1, update_data)


def test_count_by_role(user_service, mock_supabase):
    """Test counting users by role."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [{"id": 1}, {"id": 2}, {"id": 3}]
    mock_response.count = 3

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    count = user_service.count_by_role("recruiter")

    # Verify
    assert count == 3
