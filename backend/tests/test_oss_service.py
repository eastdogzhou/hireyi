"""Tests for OSS file storage service."""

from unittest.mock import MagicMock, patch

import pytest

from app.services.storage.oss_service import OSSService


@pytest.fixture
def mock_settings():
    """Mock settings for OSS configuration."""
    with patch("app.services.storage.oss_service.get_settings") as mock:
        settings = MagicMock()
        settings.aliyun_oss_access_key_id = "test_access_key_id"
        settings.aliyun_oss_access_key_secret = "test_access_key_secret"
        settings.aliyun_oss_endpoint = "https://oss-cn-test.aliyuncs.com"
        settings.aliyun_oss_bucket = "test-bucket"
        mock.return_value = settings
        yield settings


@pytest.fixture
def oss_service(mock_settings):
    """Create OSSService instance with mocked settings."""
    with patch("app.services.storage.oss_service.oss2.Bucket"):
        service = OSSService()
        return service


def test_upload_file_success(oss_service):
    """Test successful file upload."""
    # Prepare test data
    test_content = b"Test resume content"
    test_filename = "test_resume.pdf"

    # Mock bucket.put_object response
    mock_result = MagicMock()
    mock_result.status = 200
    oss_service.bucket.put_object = MagicMock(return_value=mock_result)

    # Execute upload
    result = oss_service.upload_file(
        file_content=test_content,
        file_name=test_filename,
    )

    # Verify result
    assert result["success"] is True
    assert "file_url" in result
    assert result["file_md5"] is not None
    assert result["file_size"] == len(test_content)
    assert test_filename in result["file_path"]
    assert "resumes/" in result["file_path"]

    # Verify bucket.put_object was called
    oss_service.bucket.put_object.assert_called_once()


def test_upload_file_failure(oss_service):
    """Test file upload failure."""
    # Prepare test data
    test_content = b"Test content"
    test_filename = "test.pdf"

    # Mock bucket.put_object response with failure
    mock_result = MagicMock()
    mock_result.status = 500
    oss_service.bucket.put_object = MagicMock(return_value=mock_result)

    # Execute upload
    result = oss_service.upload_file(
        file_content=test_content,
        file_name=test_filename,
    )

    # Verify failure result
    assert result["success"] is False
    assert result["file_path"] == ""
    assert result["file_url"] == ""


def test_delete_file_success(oss_service):
    """Test successful file deletion."""
    test_file_path = "resumes/test_resume.pdf"

    # Mock bucket.delete_object response
    mock_result = MagicMock()
    mock_result.status = 204
    oss_service.bucket.delete_object = MagicMock(return_value=mock_result)

    # Execute delete
    result = oss_service.delete_file(test_file_path)

    # Verify result
    assert result["success"] is True
    assert "successfully" in result["message"].lower()

    # Verify bucket.delete_object was called
    oss_service.bucket.delete_object.assert_called_once_with(test_file_path)


def test_delete_file_failure(oss_service):
    """Test file deletion failure."""
    test_file_path = "resumes/test.pdf"

    # Mock bucket.delete_object response with failure
    mock_result = MagicMock()
    mock_result.status = 500
    oss_service.bucket.delete_object = MagicMock(return_value=mock_result)

    # Execute delete
    result = oss_service.delete_file(test_file_path)

    # Verify failure result
    assert result["success"] is False
    assert "failed" in result["message"].lower()


def test_get_file_url(oss_service):
    """Test getting public file URL."""
    test_file_path = "resumes/test_resume.pdf"

    # Execute
    url = oss_service.get_file_url(test_file_path)

    # Verify URL format
    assert url.startswith("https://")
    assert test_file_path in url
    assert oss_service.bucket_name in url


def test_file_exists_true(oss_service):
    """Test file exists check when file exists."""
    test_file_path = "resumes/existing_file.pdf"

    # Mock bucket.object_exists
    oss_service.bucket.object_exists = MagicMock(return_value=True)

    # Execute
    exists = oss_service.file_exists(test_file_path)

    # Verify
    assert exists is True
    oss_service.bucket.object_exists.assert_called_once_with(test_file_path)


def test_file_exists_false(oss_service):
    """Test file exists check when file doesn't exist."""
    test_file_path = "resumes/nonexistent_file.pdf"

    # Mock bucket.object_exists
    oss_service.bucket.object_exists = MagicMock(return_value=False)

    # Execute
    exists = oss_service.file_exists(test_file_path)

    # Verify
    assert exists is False


def test_calculate_md5(oss_service):
    """Test MD5 calculation."""
    test_content = b"Test content for MD5"

    # Calculate MD5
    md5_hash = oss_service._calculate_md5(test_content)

    # Verify MD5 format (32 hexadecimal characters)
    assert len(md5_hash) == 32
    assert all(c in "0123456789abcdef" for c in md5_hash)

    # Verify consistency
    md5_hash2 = oss_service._calculate_md5(test_content)
    assert md5_hash == md5_hash2


def test_upload_file_with_custom_subfolder(oss_service):
    """Test file upload with custom subfolder."""
    test_content = b"Test content"
    test_filename = "test.pdf"
    custom_subfolder = "documents/"

    # Mock bucket.put_object
    mock_result = MagicMock()
    mock_result.status = 200
    oss_service.bucket.put_object = MagicMock(return_value=mock_result)

    # Execute upload
    result = oss_service.upload_file(
        file_content=test_content,
        file_name=test_filename,
        subfolder=custom_subfolder,
    )

    # Verify custom subfolder is used
    assert result["success"] is True
    assert custom_subfolder in result["file_path"]
