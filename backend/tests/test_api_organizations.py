"""Integration tests for Organization Management API endpoints."""

from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.models.organization import (
    OrganizationInfo,
    OrganizationMemberInfo,
    OrganizationWithRole,
)


@pytest.fixture
def sample_organization():
    """Sample organization for testing."""
    return OrganizationInfo(
        id="org-123",
        name="Test Organization",
        description="A test organization",
        org_code="TEST123",
        created_at=datetime.now(UTC),
    )


@pytest.fixture
def sample_organization_with_role():
    """Sample organization with user role for testing."""
    return OrganizationWithRole(
        id="org-123",
        name="Test Organization",
        description="A test organization",
        org_code="TEST123",
        created_at=datetime.now(UTC),
        user_role="creator",
        user_status="approved",
    )


@pytest.fixture
def sample_member():
    """Sample organization member for testing."""
    return OrganizationMemberInfo(
        id=1,
        org_id="org-123",
        user_id="user-456",
        user_name="Test Member",
        user_email="member@example.com",
        role="member",
        status="pending",
        joined_at=datetime.now(UTC),
    )


@pytest.fixture
def mock_current_user():
    """Mock authenticated user."""
    from app.models.auth import CurrentUser

    return CurrentUser(
        user_id="user-123",
        email="admin@example.com",
        name="Admin User",
        org_id="org-123",
        org_role="admin",
        is_admin=True,
    )


@pytest.fixture
def mock_non_admin_user():
    """Mock non-admin user."""
    from app.models.auth import CurrentUser

    return CurrentUser(
        user_id="user-456",
        email="member@example.com",
        name="Member User",
        org_id="org-123",
        org_role="member",
        is_admin=False,
    )


def test_create_organization_success(test_client: TestClient, sample_organization, mock_current_user, monkeypatch):
    """Test creating a new organization."""
    from app.middleware.auth import get_current_user

    # Mock auth dependency
    from app.main import app

    app.dependency_overrides[get_current_user] = lambda: mock_current_user

    # Mock organization service
    async def mock_create_org(self, user_id, user_name, request):
        return sample_organization

    from app.services.organization_service import OrganizationService

    monkeypatch.setattr(OrganizationService, "create_organization", mock_create_org)

    # Create organization request
    org_data = {
        "name": "New Organization",
        "description": "A new test organization",
    }

    response = test_client.post("/api/organizations", json=org_data)

    assert response.status_code == 201
    data = response.json()

    assert data["name"] == sample_organization.name
    assert data["org_code"] == sample_organization.org_code
    assert "id" in data

    # Clean up
    app.dependency_overrides.clear()


def test_create_organization_unauthorized(test_client: TestClient):
    """Test creating organization without authentication."""
    org_data = {
        "name": "New Organization",
        "description": "Test",
    }

    response = test_client.post("/api/organizations", json=org_data)

    assert response.status_code in [401, 403]


def test_create_organization_validation_error(test_client: TestClient, mock_current_user):
    """Test creating organization with invalid data."""
    from app.middleware.auth import get_current_user
    from app.main import app

    app.dependency_overrides[get_current_user] = lambda: mock_current_user

    invalid_data = {
        "name": "",  # Empty name
        "description": None,
    }

    response = test_client.post("/api/organizations", json=invalid_data)

    assert response.status_code == 422

    # Clean up
    app.dependency_overrides.clear()


def test_join_organization_success(test_client: TestClient, sample_organization, mock_current_user, monkeypatch):
    """Test joining an existing organization."""
    from app.middleware.auth import get_current_user
    from app.main import app

    app.dependency_overrides[get_current_user] = lambda: mock_current_user

    # Mock organization service
    async def mock_join_org(self, user_id, request):
        return sample_organization

    from app.services.organization_service import OrganizationService

    monkeypatch.setattr(OrganizationService, "join_organization", mock_join_org)

    # Join request
    join_data = {
        "org_code": "TEST123",
    }

    response = test_client.post("/api/organizations/join", json=join_data)

    assert response.status_code == 200
    data = response.json()

    assert data["org_code"] == "TEST123"
    assert data["name"] == sample_organization.name

    # Clean up
    app.dependency_overrides.clear()


def test_join_organization_invalid_code(test_client: TestClient, mock_current_user, monkeypatch):
    """Test joining with invalid organization code."""
    from app.middleware.auth import get_current_user
    from app.main import app

    app.dependency_overrides[get_current_user] = lambda: mock_current_user

    async def mock_join_fail(self, user_id, request):
        raise ValueError("Organization not found")

    from app.services.organization_service import OrganizationService

    monkeypatch.setattr(OrganizationService, "join_organization", mock_join_fail)

    join_data = {
        "org_code": "INVALID",
    }

    response = test_client.post("/api/organizations/join", json=join_data)

    assert response.status_code == 400
    data = response.json()
    assert "not found" in data["detail"].lower()

    # Clean up
    app.dependency_overrides.clear()


def test_join_organization_already_member(test_client: TestClient, mock_current_user, monkeypatch):
    """Test joining an organization user is already a member of."""
    from app.middleware.auth import get_current_user
    from app.main import app

    app.dependency_overrides[get_current_user] = lambda: mock_current_user

    async def mock_join_fail(self, user_id, request):
        raise ValueError("Already a member of this organization")

    from app.services.organization_service import OrganizationService

    monkeypatch.setattr(OrganizationService, "join_organization", mock_join_fail)

    join_data = {
        "org_code": "TEST123",
    }

    response = test_client.post("/api/organizations/join", json=join_data)

    assert response.status_code == 400
    data = response.json()
    assert "already" in data["detail"].lower()

    # Clean up
    app.dependency_overrides.clear()


def test_get_my_organizations_success(
    test_client: TestClient, sample_organization_with_role, mock_current_user, monkeypatch
):
    """Test getting user's organizations."""
    from app.middleware.auth import get_current_user
    from app.main import app

    app.dependency_overrides[get_current_user] = lambda: mock_current_user

    # Mock organization service
    async def mock_get_orgs(self, user_id):
        return [sample_organization_with_role]

    from app.services.organization_service import OrganizationService

    monkeypatch.setattr(OrganizationService, "get_user_organizations", mock_get_orgs)

    response = test_client.get("/api/organizations")

    assert response.status_code == 200
    data = response.json()

    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["id"] == sample_organization_with_role.id
    assert data[0]["user_role"] == "creator"
    assert data[0]["user_status"] == "approved"

    # Clean up
    app.dependency_overrides.clear()


def test_get_my_organizations_empty(test_client: TestClient, mock_current_user, monkeypatch):
    """Test getting organizations when user has none."""
    from app.middleware.auth import get_current_user
    from app.main import app

    app.dependency_overrides[get_current_user] = lambda: mock_current_user

    async def mock_get_orgs_empty(self, user_id):
        return []

    from app.services.organization_service import OrganizationService

    monkeypatch.setattr(OrganizationService, "get_user_organizations", mock_get_orgs_empty)

    response = test_client.get("/api/organizations")

    assert response.status_code == 200
    data = response.json()

    assert isinstance(data, list)
    assert len(data) == 0

    # Clean up
    app.dependency_overrides.clear()


def test_get_organization_members_success(test_client: TestClient, sample_member, mock_current_user, monkeypatch):
    """Test getting organization members."""
    from app.middleware.auth import get_current_user
    from app.main import app

    app.dependency_overrides[get_current_user] = lambda: mock_current_user

    # Mock organization service
    async def mock_get_members(self, org_id, user_id):
        return [sample_member]

    from app.services.organization_service import OrganizationService

    monkeypatch.setattr(OrganizationService, "get_organization_members", mock_get_members)

    org_id = "org-123"
    response = test_client.get(f"/api/organizations/{org_id}/members")

    assert response.status_code == 200
    data = response.json()

    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["user_id"] == sample_member.user_id
    assert data[0]["role"] == sample_member.role
    assert data[0]["status"] == sample_member.status

    # Clean up
    app.dependency_overrides.clear()


def test_get_organization_members_unauthorized(test_client: TestClient, mock_non_admin_user, monkeypatch):
    """Test getting members when not a member of the organization."""
    from app.middleware.auth import get_current_user
    from app.main import app

    # User is not a member of this organization
    non_member_user = mock_non_admin_user
    non_member_user.org_id = "different-org"

    app.dependency_overrides[get_current_user] = lambda: non_member_user

    async def mock_get_members_fail(self, org_id, user_id):
        raise ValueError("User is not a member of this organization")

    from app.services.organization_service import OrganizationService

    monkeypatch.setattr(OrganizationService, "get_organization_members", mock_get_members_fail)

    org_id = "org-123"
    response = test_client.get(f"/api/organizations/{org_id}/members")

    assert response.status_code == 403

    # Clean up
    app.dependency_overrides.clear()


def test_approve_member_success(test_client: TestClient, sample_member, mock_current_user, monkeypatch):
    """Test approving a member join request (admin only)."""
    from app.middleware.auth import require_admin
    from app.main import app

    app.dependency_overrides[require_admin] = lambda: mock_current_user

    # Mock organization service
    approved_member = sample_member.model_copy()
    approved_member.status = "approved"

    async def mock_approve(self, org_id, admin_user_id, request):
        return approved_member

    from app.services.organization_service import OrganizationService

    monkeypatch.setattr(OrganizationService, "approve_or_reject_member", mock_approve)

    org_id = "org-123"
    approval_data = {
        "user_id": "user-456",
        "approved": True,
    }

    response = test_client.post(f"/api/organizations/{org_id}/members/approve", json=approval_data)

    assert response.status_code == 200
    data = response.json()

    assert data["user_id"] == "user-456"
    assert data["status"] == "approved"

    # Clean up
    app.dependency_overrides.clear()


def test_reject_member_success(test_client: TestClient, sample_member, mock_current_user, monkeypatch):
    """Test rejecting a member join request (admin only)."""
    from app.middleware.auth import require_admin
    from app.main import app

    app.dependency_overrides[require_admin] = lambda: mock_current_user

    # Mock organization service
    rejected_member = sample_member.model_copy()
    rejected_member.status = "rejected"

    async def mock_reject(self, org_id, admin_user_id, request):
        return rejected_member

    from app.services.organization_service import OrganizationService

    monkeypatch.setattr(OrganizationService, "approve_or_reject_member", mock_reject)

    org_id = "org-123"
    approval_data = {
        "user_id": "user-456",
        "approved": False,
    }

    response = test_client.post(f"/api/organizations/{org_id}/members/approve", json=approval_data)

    assert response.status_code == 200
    data = response.json()

    assert data["user_id"] == "user-456"
    assert data["status"] == "rejected"

    # Clean up
    app.dependency_overrides.clear()


def test_approve_member_non_admin(test_client: TestClient, mock_non_admin_user):
    """Test approving member without admin privileges."""
    from app.middleware.auth import require_admin
    from app.main import app

    # Non-admin user should be rejected by require_admin dependency
    # In real scenario, require_admin would raise HTTPException
    # For testing, we simulate the 403 response

    approval_data = {
        "user_id": "user-456",
        "approved": True,
    }

    org_id = "org-123"
    response = test_client.post(f"/api/organizations/{org_id}/members/approve", json=approval_data)

    # Should be unauthorized since we didn't override require_admin
    assert response.status_code in [401, 403]


def test_update_member_role_success(test_client: TestClient, sample_member, mock_current_user, monkeypatch):
    """Test updating member role (admin only)."""
    from app.middleware.auth import require_admin
    from app.main import app

    app.dependency_overrides[require_admin] = lambda: mock_current_user

    # Mock organization service
    updated_member = sample_member.model_copy()
    updated_member.role = "admin"

    async def mock_update_role(self, org_id, admin_user_id, request):
        return updated_member

    from app.services.organization_service import OrganizationService

    monkeypatch.setattr(OrganizationService, "update_member_role", mock_update_role)

    org_id = "org-123"
    role_data = {
        "user_id": "user-456",
        "role": "admin",
    }

    response = test_client.put(f"/api/organizations/{org_id}/members/role", json=role_data)

    assert response.status_code == 200
    data = response.json()

    assert data["user_id"] == "user-456"
    assert data["role"] == "admin"

    # Clean up
    app.dependency_overrides.clear()


def test_update_member_role_non_admin(test_client: TestClient):
    """Test updating role without admin privileges."""
    org_id = "org-123"
    role_data = {
        "user_id": "user-456",
        "role": "admin",
    }

    response = test_client.put(f"/api/organizations/{org_id}/members/role", json=role_data)

    assert response.status_code in [401, 403]


def test_update_member_role_invalid_role(test_client: TestClient, mock_current_user, monkeypatch):
    """Test updating to invalid role."""
    from app.middleware.auth import require_admin
    from app.main import app

    app.dependency_overrides[require_admin] = lambda: mock_current_user

    async def mock_update_fail(self, org_id, admin_user_id, request):
        raise ValueError("Invalid role")

    from app.services.organization_service import OrganizationService

    monkeypatch.setattr(OrganizationService, "update_member_role", mock_update_fail)

    org_id = "org-123"
    role_data = {
        "user_id": "user-456",
        "role": "super_admin",  # Invalid role
    }

    response = test_client.put(f"/api/organizations/{org_id}/members/role", json=role_data)

    assert response.status_code == 400

    # Clean up
    app.dependency_overrides.clear()


def test_remove_member_success(test_client: TestClient, mock_current_user, monkeypatch):
    """Test removing a member from organization (admin only)."""
    from app.middleware.auth import require_admin
    from app.main import app

    app.dependency_overrides[require_admin] = lambda: mock_current_user

    # Mock organization service
    async def mock_remove(self, org_id, admin_user_id, member_id):
        pass  # Successful removal

    from app.services.organization_service import OrganizationService

    monkeypatch.setattr(OrganizationService, "remove_member", mock_remove)

    org_id = "org-123"
    member_id = 1

    response = test_client.delete(f"/api/organizations/{org_id}/members/{member_id}")

    assert response.status_code == 204

    # Clean up
    app.dependency_overrides.clear()


def test_remove_member_non_admin(test_client: TestClient):
    """Test removing member without admin privileges."""
    org_id = "org-123"
    member_id = 1

    response = test_client.delete(f"/api/organizations/{org_id}/members/{member_id}")

    assert response.status_code in [401, 403]


def test_remove_member_not_found(test_client: TestClient, mock_current_user, monkeypatch):
    """Test removing non-existent member."""
    from app.middleware.auth import require_admin
    from app.main import app

    app.dependency_overrides[require_admin] = lambda: mock_current_user

    async def mock_remove_fail(self, org_id, admin_user_id, member_id):
        raise ValueError("Member not found")

    from app.services.organization_service import OrganizationService

    monkeypatch.setattr(OrganizationService, "remove_member", mock_remove_fail)

    org_id = "org-123"
    member_id = 99999

    response = test_client.delete(f"/api/organizations/{org_id}/members/{member_id}")

    assert response.status_code == 400

    # Clean up
    app.dependency_overrides.clear()


def test_remove_member_cannot_remove_creator(test_client: TestClient, mock_current_user, monkeypatch):
    """Test that creator cannot be removed from organization."""
    from app.middleware.auth import require_admin
    from app.main import app

    app.dependency_overrides[require_admin] = lambda: mock_current_user

    async def mock_remove_fail(self, org_id, admin_user_id, member_id):
        raise ValueError("Cannot remove organization creator")

    from app.services.organization_service import OrganizationService

    monkeypatch.setattr(OrganizationService, "remove_member", mock_remove_fail)

    org_id = "org-123"
    member_id = 1  # Assume this is the creator

    response = test_client.delete(f"/api/organizations/{org_id}/members/{member_id}")

    assert response.status_code == 400
    data = response.json()
    assert "creator" in data["detail"].lower()

    # Clean up
    app.dependency_overrides.clear()
