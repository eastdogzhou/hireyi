"""Aliyun OSS file storage service."""

import hashlib
import logging
import time
from typing import Any

import backoff
import oss2

from app.config.settings import get_settings

logger = logging.getLogger(__name__)


class OSSService:
    """Aliyun OSS file storage service.

    Provides file upload, download, deletion, and management functionality
    using Aliyun Object Storage Service (OSS).
    """

    def __init__(self) -> None:
        """Initialize OSS service with credentials from settings."""
        settings = get_settings()

        # Initialize OSS auth
        auth = oss2.Auth(
            settings.aliyun_oss_access_key_id,
            settings.aliyun_oss_access_key_secret,
        )

        # Initialize OSS bucket with timeout configuration
        # Increased timeout for overseas deployment (e.g., Railway US -> Aliyun CN)
        self.bucket = oss2.Bucket(
            auth,
            settings.aliyun_oss_endpoint,
            settings.aliyun_oss_bucket,
            connect_timeout=settings.aliyun_oss_connect_timeout,
        )

        self.bucket_name = settings.aliyun_oss_bucket
        self.endpoint = settings.aliyun_oss_endpoint
        self.connect_timeout = settings.aliyun_oss_connect_timeout

        logger.info(
            f"OSSService initialized with bucket: {self.bucket_name}, "
            f"endpoint: {self.endpoint}, timeout: {self.connect_timeout}s"
        )

    @backoff.on_exception(
        backoff.expo,
        (oss2.exceptions.RequestError, TimeoutError),
        max_tries=3,
        max_time=300,
        on_backoff=lambda details: logger.warning(
            f"OSS upload retry {details['tries']}/{details['max_tries']}: {details['exception']}"
        ),
    )
    def upload_file(
        self,
        file_content: bytes,
        file_name: str,
        subfolder: str = "resumes/",
    ) -> dict[str, Any]:
        """Upload file to Aliyun OSS with automatic retry on timeout.

        :param file_content: Binary content of the file to upload
        :param file_name: Original filename
        :param subfolder: Subfolder path in OSS bucket (default: "resumes/")
        :return: Dictionary with upload result containing:
            - success (bool): Whether upload succeeded
            - file_path (str): OSS file path
            - file_url (str): Public access URL
            - file_md5 (str): MD5 hash of the file
            - file_size (int): File size in bytes
        :raises oss2.exceptions.OssError: If OSS operation fails after 3 retries
        """
        try:
            # Calculate MD5 hash
            file_md5 = self._calculate_md5(file_content)

            # Generate unique file path
            timestamp = int(time.time())
            file_path = f"{subfolder}{timestamp}_{file_name}"

            # Upload file
            logger.info(f"Uploading file to OSS: {file_path}")
            result = self.bucket.put_object(file_path, file_content)

            if result.status == 200:
                # Generate public URL
                file_url = self._generate_public_url(file_path)
                file_size = len(file_content)

                logger.info(
                    f"File uploaded successfully: {file_path} "
                    f"(size: {file_size} bytes, md5: {file_md5})"
                )

                return {
                    "success": True,
                    "file_path": file_path,
                    "file_url": file_url,
                    "file_md5": file_md5,
                    "file_size": file_size,
                }
            else:
                logger.error(f"Upload failed with status: {result.status}")
                return {
                    "success": False,
                    "file_path": "",
                    "file_url": "",
                    "file_md5": "",
                    "file_size": 0,
                }

        except oss2.exceptions.OssError as e:
            logger.error(f"OSS upload error: {e}")
            raise

    def delete_file(self, file_path: str) -> dict[str, Any]:
        """Delete file from Aliyun OSS.

        :param file_path: OSS file path to delete
        :return: Dictionary with deletion result containing:
            - success (bool): Whether deletion succeeded
            - message (str): Result message
        :raises oss2.exceptions.OssError: If OSS operation fails
        """
        try:
            logger.info(f"Deleting file from OSS: {file_path}")
            result = self.bucket.delete_object(file_path)

            if result.status == 204:
                logger.info(f"File deleted successfully: {file_path}")
                return {
                    "success": True,
                    "message": f"File {file_path} deleted successfully",
                }
            else:
                logger.error(f"Delete failed with status: {result.status}")
                return {
                    "success": False,
                    "message": f"Failed to delete file: status {result.status}",
                }

        except oss2.exceptions.OssError as e:
            logger.error(f"OSS delete error: {e}")
            raise

    def get_file_url(self, file_path: str) -> str:
        """Get public access URL for a file.

        :param file_path: OSS file path
        :return: Public access URL
        """
        return self._generate_public_url(file_path)

    def file_exists(self, file_path: str) -> bool:
        """Check if file exists in OSS.

        :param file_path: OSS file path to check
        :return: True if file exists, False otherwise
        """
        try:
            logger.debug(f"Checking if file exists: {file_path}")
            result = self.bucket.object_exists(file_path)
            logger.debug(f"File exists: {result}")
            return result
        except oss2.exceptions.OssError as e:
            logger.error(f"OSS file_exists error: {e}")
            return False

    def _calculate_md5(self, file_content: bytes) -> str:
        """Calculate MD5 hash of file content.

        :param file_content: Binary content of the file
        :return: MD5 hash as hexadecimal string
        """
        md5_hash = hashlib.md5(file_content)
        return md5_hash.hexdigest()

    def _generate_public_url(self, file_path: str) -> str:
        """Generate public access URL for a file.

        :param file_path: OSS file path
        :return: Public access URL (HTTPS)
        """
        # Format: https://{bucket}.{endpoint}/{file_path}
        # Remove 'http://' or 'https://' from endpoint if present
        endpoint_clean = self.endpoint.replace("http://", "").replace("https://", "")
        return f"https://{self.bucket_name}.{endpoint_clean}/{file_path}"
