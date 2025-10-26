"""Integration tests for Position API endpoints."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def test_get_positions_empty(test_client: TestClient):
    """Test getting positions when database is empty."""
    response = test_client.get("/api/positions/")

    assert response.status_code == 200
    data = response.json()
    assert "positions" in data
    assert "total" in data
    assert "limit" in data
    assert "offset" in data
    assert isinstance(data["positions"], list)


def test_get_positions_with_filters(test_client: TestClient):
    """Test getting positions with query filters."""
    response = test_client.get(
        "/api/positions/",
        params={
            "title": "Python",
            "department": "技术部",
            "status": "open",
            "limit": 10,
            "offset": 0,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["limit"] == 10
    assert data["offset"] == 0


def test_get_position_not_found(test_client: TestClient):
    """Test getting a non-existent position."""
    response = test_client.get("/api/positions/99999")

    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


def test_create_position_success(test_client: TestClient, sample_position_data, monkeypatch):
    """Test creating a position successfully."""
    # Mock service to return created position
    created_position = {
        **sample_position_data,
        "id": 1,
        "is_deleted": False,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
    }

    def mock_create(self, data):
        return created_position

    from app.services.position_service import PositionService

    monkeypatch.setattr(PositionService, "create", mock_create)

    response = test_client.post("/api/positions/", json=sample_position_data)

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == sample_position_data["title"]
    assert data["department"] == sample_position_data["department"]
    assert data["status"] == "open"
    assert "id" in data


def test_create_position_validation_error(test_client: TestClient):
    """Test creating position with invalid data."""
    invalid_data = {
        "title": "",  # Empty title should fail validation
        "jd": "",  # Empty JD should fail validation
    }

    response = test_client.post("/api/positions/", json=invalid_data)

    assert response.status_code == 422  # Validation error


def test_update_position_success(test_client: TestClient, monkeypatch):
    """Test updating a position successfully."""
    position_id = 1
    update_data = {
        "title": "高级Python工程师",
        "department": "研发部",
    }

    # Mock exists check
    def mock_exists(self, record_id):
        return True

    # Mock update
    def mock_update(self, record_id, data):
        return {
            "id": record_id,
            "title": data["title"],
            "department": data["department"],
            "jd": "原JD内容",
            "requirements": {},
            "status": "open",
            "created_by": 1,
            "is_deleted": False,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z",
        }

    from app.services.position_service import PositionService

    monkeypatch.setattr(PositionService, "exists", mock_exists)
    monkeypatch.setattr(PositionService, "update", mock_update)

    response = test_client.patch(f"/api/positions/{position_id}", json=update_data)

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == update_data["title"]
    assert data["department"] == update_data["department"]


def test_update_position_not_found(test_client: TestClient, monkeypatch):
    """Test updating a non-existent position."""

    def mock_exists(self, record_id):
        return False

    from app.services.position_service import PositionService

    monkeypatch.setattr(PositionService, "exists", mock_exists)

    response = test_client.patch("/api/positions/99999", json={"title": "新职位"})

    assert response.status_code == 404


def test_update_position_status_success(test_client: TestClient, monkeypatch):
    """Test updating position status successfully."""
    position_id = 1

    # Mock update_status
    def mock_update_status(self, record_id, new_status):
        return {
            "id": record_id,
            "title": "Python工程师",
            "department": "技术部",
            "jd": "职位描述",
            "requirements": {},
            "status": new_status,
            "created_by": 1,
            "is_deleted": False,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z",
        }

    from app.services.position_service import PositionService

    monkeypatch.setattr(PositionService, "update_status", mock_update_status)

    response = test_client.patch(
        f"/api/positions/{position_id}/status",
        json={"status": "closed"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "closed"


def test_update_position_status_invalid(test_client: TestClient):
    """Test updating position status with invalid value."""
    position_id = 1

    response = test_client.patch(
        f"/api/positions/{position_id}/status",
        json={"status": "invalid_status"},
    )

    assert response.status_code == 400
    data = response.json()
    assert "open" in data["detail"].lower() or "closed" in data["detail"].lower()


def test_update_position_status_not_found(test_client: TestClient, monkeypatch):
    """Test updating status of non-existent position."""

    def mock_update_status(self, record_id, new_status):
        raise ValueError(f"Position {record_id} not found or already deleted")

    from app.services.position_service import PositionService

    monkeypatch.setattr(PositionService, "update_status", mock_update_status)

    response = test_client.patch(
        "/api/positions/99999/status",
        json={"status": "closed"},
    )

    assert response.status_code == 404


def test_delete_position_success(test_client: TestClient, monkeypatch):
    """Test deleting a position successfully."""
    position_id = 1

    # Mock exists check
    def mock_exists(self, record_id):
        return True

    # Mock soft delete
    def mock_soft_delete(self, record_id):
        return True

    from app.services.position_service import PositionService

    monkeypatch.setattr(PositionService, "exists", mock_exists)
    monkeypatch.setattr(PositionService, "soft_delete", mock_soft_delete)

    response = test_client.delete(f"/api/positions/{position_id}")

    assert response.status_code == 204


def test_delete_position_not_found(test_client: TestClient, monkeypatch):
    """Test deleting a non-existent position."""

    def mock_exists(self, record_id):
        return False

    from app.services.position_service import PositionService

    monkeypatch.setattr(PositionService, "exists", mock_exists)

    response = test_client.delete("/api/positions/99999")

    assert response.status_code == 404


def test_position_lifecycle(test_client: TestClient, sample_position_data, monkeypatch):
    """Test complete position lifecycle: create → update → close → delete."""
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
    position_id = response.json()["id"]

    # Step 2: Update position
    def mock_exists(self, record_id):
        return True

    def mock_update(self, record_id, data):
        return {**created_position, **data, "updated_at": "2024-01-02T00:00:00Z"}

    monkeypatch.setattr(PositionService, "exists", mock_exists)
    monkeypatch.setattr(PositionService, "update", mock_update)

    response = test_client.patch(
        f"/api/positions/{position_id}",
        json={"department": "研发部"},
    )
    assert response.status_code == 200
    assert response.json()["department"] == "研发部"

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

    # Step 4: Delete position
    def mock_soft_delete(self, record_id):
        return True

    monkeypatch.setattr(PositionService, "soft_delete", mock_soft_delete)

    response = test_client.delete(f"/api/positions/{position_id}")
    assert response.status_code == 204
