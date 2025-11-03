"""Integration tests for Authentication API endpoints."""

from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.models.auth import AuthToken, UserProfile


@pytest.fixture
def sample_auth_token():
    """Sample authentication token for testing."""
    return AuthToken(
        access_token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
        token_type="bearer",
        expires_in=3600,
        refresh_token="refresh_token_here",
    )


@pytest.fixture
def sample_user_profile():
    """Sample user profile for testing."""
    return UserProfile(
        id="550e8400-e29b-41d4-a716-446655440000",
        email="test@example.com",
        name="Test User",
        current_org_id=None,
        created_at=datetime.now(UTC),
    )


def test_register_success(test_client: TestClient, sample_auth_token, sample_user_profile, monkeypatch):
    """Test user registration with valid data."""
    # Mock auth service register method
    async def mock_register(self, request):
        return sample_auth_token, sample_user_profile

    from app.services.auth_service import AuthService

    monkeypatch.setattr(AuthService, "register", mock_register)

    # Register request
    register_data = {
        "email": "newuser@example.com",
        "password": "SecurePass123!",
        "name": "New User",
    }

    response = test_client.post("/api/auth/register", json=register_data)

    assert response.status_code == 201
    data = response.json()

    # Verify response structure
    assert "token" in data
    assert "user" in data
    assert data["token"]["access_token"] == sample_auth_token.access_token
    assert data["token"]["token_type"] == "bearer"
    assert data["user"]["email"] == sample_user_profile.email
    assert data["user"]["name"] == sample_user_profile.name


def test_register_with_org_id(test_client: TestClient, sample_auth_token, sample_user_profile, monkeypatch):
    """Test user registration with organization join request."""
    async def mock_register(self, request):
        return sample_auth_token, sample_user_profile

    from app.services.auth_service import AuthService

    monkeypatch.setattr(AuthService, "register", mock_register)

    register_data = {
        "email": "newuser@example.com",
        "password": "SecurePass123!",
        "name": "New User",
        "org_id": "org123",
    }

    response = test_client.post("/api/auth/register", json=register_data)

    assert response.status_code == 201
    data = response.json()
    assert "token" in data
    assert "user" in data


def test_register_validation_error(test_client: TestClient):
    """Test registration with invalid data."""
    invalid_data = {
        "email": "invalid-email",  # Invalid email format
        "password": "weak",  # Weak password
        "name": "",  # Empty name
    }

    response = test_client.post("/api/auth/register", json=invalid_data)

    assert response.status_code == 422  # Validation error


def test_register_duplicate_email(test_client: TestClient, monkeypatch):
    """Test registration with existing email."""
    async def mock_register_fail(self, request):
        raise ValueError("Email already registered")

    from app.services.auth_service import AuthService

    monkeypatch.setattr(AuthService, "register", mock_register_fail)

    register_data = {
        "email": "existing@example.com",
        "password": "SecurePass123!",
        "name": "Test User",
    }

    response = test_client.post("/api/auth/register", json=register_data)

    assert response.status_code == 400
    data = response.json()
    assert "already registered" in data["detail"].lower()


def test_login_success(test_client: TestClient, sample_auth_token, sample_user_profile, monkeypatch):
    """Test successful login with valid credentials."""
    async def mock_login(self, request):
        return sample_auth_token, sample_user_profile

    from app.services.auth_service import AuthService

    monkeypatch.setattr(AuthService, "login", mock_login)

    login_data = {
        "email": "test@example.com",
        "password": "SecurePass123!",
    }

    response = test_client.post("/api/auth/login", json=login_data)

    assert response.status_code == 200
    data = response.json()

    assert "token" in data
    assert "user" in data
    assert data["token"]["access_token"] == sample_auth_token.access_token
    assert data["user"]["email"] == sample_user_profile.email


def test_login_invalid_credentials(test_client: TestClient, monkeypatch):
    """Test login with invalid email/password."""
    async def mock_login_fail(self, request):
        raise ValueError("Invalid email or password")

    from app.services.auth_service import AuthService

    monkeypatch.setattr(AuthService, "login", mock_login_fail)

    login_data = {
        "email": "wrong@example.com",
        "password": "WrongPass123!",
    }

    response = test_client.post("/api/auth/login", json=login_data)

    assert response.status_code == 401
    data = response.json()
    assert "invalid" in data["detail"].lower()


def test_login_validation_error(test_client: TestClient):
    """Test login with invalid data format."""
    invalid_data = {
        "email": "not-an-email",
        "password": "",
    }

    response = test_client.post("/api/auth/login", json=invalid_data)

    assert response.status_code == 422


def test_logout_success(test_client: TestClient, monkeypatch):
    """Test successful logout."""
    from app.middleware.auth import get_current_user
    from app.models.auth import CurrentUser

    # Mock current user
    mock_user = CurrentUser(
        user_id="user123",
        email="test@example.com",
        name="Test User",
        org_id=None,
        org_role=None,
        is_admin=False,
    )

    # Override get_current_user dependency
    from app.main import app

    app.dependency_overrides[get_current_user] = lambda: mock_user

    response = test_client.post("/api/auth/logout")

    assert response.status_code == 204

    # Clean up
    app.dependency_overrides.clear()


def test_logout_unauthorized(test_client: TestClient):
    """Test logout without authentication."""
    # Don't provide auth token
    response = test_client.post("/api/auth/logout")

    # Should return 401 or 403 depending on implementation
    assert response.status_code in [401, 403]


def test_get_me_success(test_client: TestClient):
    """Test getting current user profile."""
    from app.middleware.auth import get_current_user
    from app.models.auth import CurrentUser

    mock_user = CurrentUser(
        user_id="user123",
        email="test@example.com",
        name="Test User",
        org_id="org123",
        org_role="admin",
        is_admin=True,
    )

    from app.main import app

    app.dependency_overrides[get_current_user] = lambda: mock_user

    response = test_client.get("/api/auth/me")

    assert response.status_code == 200
    data = response.json()

    assert data["user_id"] == "user123"
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"
    assert data["org_id"] == "org123"
    assert data["org_role"] == "admin"
    assert data["is_admin"] is True

    # Clean up
    app.dependency_overrides.clear()


def test_get_me_unauthorized(test_client: TestClient):
    """Test getting profile without authentication."""
    response = test_client.get("/api/auth/me")

    assert response.status_code in [401, 403]


def test_password_reset_request_success(test_client: TestClient, monkeypatch):
    """Test password reset request."""
    async def mock_password_reset(self, request):
        pass  # Successful no-op

    from app.services.auth_service import AuthService

    monkeypatch.setattr(AuthService, "request_password_reset", mock_password_reset)

    reset_data = {
        "email": "test@example.com",
    }

    response = test_client.post("/api/auth/reset-password", json=reset_data)

    assert response.status_code == 204


def test_password_reset_invalid_email(test_client: TestClient, monkeypatch):
    """Test password reset with invalid email."""
    async def mock_password_reset_fail(self, request):
        raise ValueError("Email not found")

    from app.services.auth_service import AuthService

    monkeypatch.setattr(AuthService, "request_password_reset", mock_password_reset_fail)

    reset_data = {
        "email": "nonexistent@example.com",
    }

    response = test_client.post("/api/auth/reset-password", json=reset_data)

    assert response.status_code == 400


def test_password_reset_validation_error(test_client: TestClient):
    """Test password reset with invalid email format."""
    invalid_data = {
        "email": "not-an-email",
    }

    response = test_client.post("/api/auth/reset-password", json=invalid_data)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_auth_token_creation():
    """Test JWT token creation and verification."""
    from app.config.settings import get_settings
    from app.services.auth_service import AuthService
    from unittest.mock import MagicMock

    settings = get_settings()
    mock_supabase = MagicMock()
    auth_service = AuthService(mock_supabase)

    # Create token
    user_id = "test-user-id"
    email = "test@example.com"

    token = auth_service._create_access_token(user_id, email)

    assert isinstance(token, str)
    assert len(token) > 0

    # Verify token
    payload = auth_service.verify_token(token)

    assert payload["sub"] == user_id
    assert payload["email"] == email
    assert "exp" in payload
    assert "iat" in payload


@pytest.mark.asyncio
async def test_auth_token_verification_expired():
    """Test verification of expired token."""
    from app.services.auth_service import AuthService
    from unittest.mock import MagicMock
    import jwt
    from datetime import timedelta

    mock_supabase = MagicMock()
    auth_service = AuthService(mock_supabase)

    # Create an expired token (manually)
    from app.config.settings import get_settings

    settings = get_settings()

    payload = {
        "sub": "user123",
        "email": "test@example.com",
        "exp": datetime.now(UTC) - timedelta(hours=1),  # Expired 1 hour ago
        "iat": datetime.now(UTC) - timedelta(hours=2),
    }

    expired_token = jwt.encode(
        payload,
        settings.supabase_jwt_secret,
        algorithm=settings.jwt_algorithm,
    )

    # Verify should raise ValueError
    with pytest.raises(ValueError) as exc_info:
        auth_service.verify_token(expired_token)

    assert "expired" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_auth_token_verification_invalid():
    """Test verification of invalid token."""
    from app.services.auth_service import AuthService
    from unittest.mock import MagicMock

    mock_supabase = MagicMock()
    auth_service = AuthService(mock_supabase)

    invalid_token = "invalid.jwt.token"

    with pytest.raises(ValueError) as exc_info:
        auth_service.verify_token(invalid_token)

    assert "invalid" in str(exc_info.value).lower()
