"""Tests for CandidateService."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.candidate_service import CandidateService


@pytest.fixture
def mock_supabase():
    """Create a mock Supabase client."""
    return MagicMock()


@pytest.fixture
def mock_oss_service():
    """Create a mock OSS service."""
    return MagicMock()


@pytest.fixture
def mock_resume_parser():
    """Create a mock resume parser."""
    parser = MagicMock()
    parser.parse_resume = AsyncMock()
    return parser


@pytest.fixture
def candidate_service(mock_supabase, mock_oss_service, mock_resume_parser):
    """Create CandidateService instance with mock dependencies."""
    return CandidateService(mock_supabase, mock_oss_service, mock_resume_parser)


def test_find_by_unique_key_by_name_phone(candidate_service, mock_supabase):
    """Test finding candidate by name + phone (Priority 1)."""
    # Mock response for name+phone match
    mock_response = MagicMock()
    mock_response.data = {
        "id": 1,
        "name": "张三",
        "phone": "13812345678",
        "resume_md5": "abc123",
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
    result = candidate_service.find_by_unique_key(
        name="张三",
        phone="13812345678",
        resume_md5="different_md5",
    )

    # Verify Priority 1 match found (even with different MD5)
    assert result is not None
    assert result["id"] == 1
    assert result["name"] == "张三"
    assert result["phone"] == "13812345678"


def test_find_by_unique_key_by_resume_md5(candidate_service, mock_supabase):
    """Test finding candidate by resume_md5 (Priority 2)."""
    # Mock response for MD5 match (phone is None, so name+phone check is skipped)
    mock_response_md5 = MagicMock()
    mock_response_md5.data = {
        "id": 2,
        "name": "李四",
        "phone": None,
        "resume_md5": "xyz789",
    }

    # Setup mock chain - only MD5 check will be executed
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = mock_response_md5

    # Execute
    result = candidate_service.find_by_unique_key(
        name="李四",
        phone=None,
        resume_md5="xyz789",
    )

    # Verify Priority 2 match found
    assert result is not None
    assert result["id"] == 2
    assert result["resume_md5"] == "xyz789"


def test_find_by_unique_key_not_found(candidate_service, mock_supabase):
    """Test finding candidate when no match exists (phone is None, only MD5 check)."""
    # Mock response for MD5 check (not found)
    mock_response_md5 = MagicMock()
    mock_response_md5.data = None

    # Setup mock chain - only MD5 check will be executed (phone is None)
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = mock_response_md5

    # Execute - phone is None, so only MD5 check runs
    result = candidate_service.find_by_unique_key(
        name="不存在",
        phone=None,
        resume_md5="nonexistent",
    )

    # Verify not found
    assert result is None


def test_search_candidates_by_name(candidate_service, mock_supabase):
    """Test searching candidates by name (fuzzy match)."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "name": "张三", "skills": ["Python"]},
        {"id": 2, "name": "张小三", "skills": ["Java"]},
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
    result = candidate_service.search_candidates(name_query="张")

    # Verify
    assert len(result["candidates"]) == 2
    assert result["total"] == 2
    assert all("张" in c["name"] for c in result["candidates"])


def test_search_candidates_by_skills(candidate_service, mock_supabase):
    """Test searching candidates by skills."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "name": "张三", "skills": ["Python", "React"]},
        {"id": 3, "name": "王五", "skills": ["Python", "Django"]},
    ]
    mock_response.count = 2

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .overlaps.return_value
        .order.return_value
        .range.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    result = candidate_service.search_candidates(skills=["Python"])

    # Verify
    assert len(result["candidates"]) == 2
    assert result["total"] == 2
    assert all("Python" in c["skills"] for c in result["candidates"])


def test_search_candidates_by_score_range(candidate_service, mock_supabase):
    """Test searching candidates by score range."""
    # Mock response
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "name": "张三", "score": 4},
        {"id": 2, "name": "李四", "score": 3},
    ]
    mock_response.count = 2

    # Setup mock chain
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .gte.return_value
        .lte.return_value
        .order.return_value
        .range.return_value
        .execute.return_value
    ) = mock_response

    # Execute
    result = candidate_service.search_candidates(min_score=3, max_score=4)

    # Verify
    assert len(result["candidates"]) == 2
    assert result["total"] == 2
    assert all(3 <= c["score"] <= 4 for c in result["candidates"])


@pytest.mark.asyncio
async def test_upload_and_create_from_resume_success(
    candidate_service,
    mock_oss_service,
    mock_resume_parser,
    mock_supabase,
):
    """Test successful resume upload and candidate creation."""
    # Mock OSS upload
    mock_oss_service.upload_file.return_value = {
        "success": True,
        "file_url": "https://oss.example.com/resume.pdf",
        "file_md5": "abc123def456",
        "file_size": 12345,
    }

    # Mock resume parsing
    mock_resume_parser.parse_resume.return_value = {
        "name": "测试候选人",
        "phone": "13800138000",
        "email": "test@example.com",
        "skills": ["Python", "FastAPI"],
        "highlights": "5年开发经验",
        "years_of_experience": 5,
        "education_level": "本科",
        "recent_company": "科技公司",
        "recent_position": "高级工程师",
    }

    # Mock find_by_unique_key (not found) and create
    from unittest.mock import patch

    with patch.object(candidate_service, 'find_by_unique_key', return_value=None):
        with patch.object(candidate_service, 'create', return_value={
            "id": 1,
            "name": "测试候选人",
            "phone": "13800138000",
            "resume_md5": "abc123def456",
        }):
            # Execute
            result = await candidate_service.upload_and_create_from_resume(
                file_content=b"fake pdf content",
                file_name="resume.pdf",
                auto_parse=True,
            )

            # Verify
            assert result["parse_status"] == "success"
            assert result["file_url"] == "https://oss.example.com/resume.pdf"
            assert result["candidate"]["id"] == 1
            mock_oss_service.upload_file.assert_called_once()
            mock_resume_parser.parse_resume.assert_called_once()


@pytest.mark.asyncio
async def test_upload_and_create_from_resume_parse_failed(
    candidate_service,
    mock_oss_service,
    mock_resume_parser,
    mock_supabase,
):
    """Test resume upload with parsing failure."""
    # Mock OSS upload success
    mock_oss_service.upload_file.return_value = {
        "success": True,
        "file_url": "https://oss.example.com/resume.pdf",
        "file_md5": "abc123def456",
        "file_size": 12345,
    }

    # Mock parsing failure
    mock_resume_parser.parse_resume.side_effect = Exception("AI parsing failed")

    # Mock find_by_unique_key (not found) and create
    from unittest.mock import patch

    with patch.object(candidate_service, 'find_by_unique_key', return_value=None):
        with patch.object(candidate_service, 'create', return_value={
            "id": 2,
            "name": "解析失败 - 请手动编辑",
            "resume_md5": "abc123def456",
        }):
            # Execute
            result = await candidate_service.upload_and_create_from_resume(
                file_content=b"fake pdf content",
                file_name="resume.pdf",
                auto_parse=True,
            )

            # Verify partial success
            assert result["parse_status"] == "parse_failed"
            assert result["file_url"] == "https://oss.example.com/resume.pdf"
            assert result["candidate"]["name"] == "解析失败 - 请手动编辑"
            mock_oss_service.upload_file.assert_called_once()


@pytest.mark.asyncio
async def test_upload_and_create_from_resume_duplicate(
    candidate_service,
    mock_oss_service,
    mock_resume_parser,
    mock_supabase,
):
    """Test resume upload with duplicate candidate (update scenario)."""
    # Mock OSS upload
    mock_oss_service.upload_file.return_value = {
        "success": True,
        "file_url": "https://oss.example.com/resume_v2.pdf",
        "file_md5": "new_md5_hash",
        "file_size": 12345,
    }

    # Mock resume parsing
    mock_resume_parser.parse_resume.return_value = {
        "name": "张三",
        "phone": "13812345678",
        "email": "zhangsan@example.com",
        "skills": ["Python", "React", "PostgreSQL"],
        "highlights": "更新后的亮点",
        "years_of_experience": 6,
        "education_level": "本科",
        "recent_company": "新公司",
        "recent_position": "资深工程师",
    }

    # Mock uniqueness check (existing candidate found)
    mock_response_exists = MagicMock()
    mock_response_exists.data = {
        "id": 1,
        "name": "张三",
        "phone": "13812345678",
        "resume_md5": "old_md5_hash",
    }

    # Mock update
    mock_response_update = MagicMock()
    mock_response_update.data = [
        {
            "id": 1,
            "name": "张三",
            "phone": "13812345678",
            "resume_md5": "new_md5_hash",
            "highlights": "更新后的亮点",
        }
    ]

    # Setup mock chains
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = mock_response_exists

    (
        mock_supabase.table.return_value
        .update.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = mock_response_update

    # Execute
    result = await candidate_service.upload_and_create_from_resume(
        file_content=b"fake pdf content",
        file_name="resume_v2.pdf",
        auto_parse=True,
    )

    # Verify update occurred
    assert result["parse_status"] == "success"
    assert result["candidate"]["id"] == 1
    assert result["candidate"]["resume_md5"] == "new_md5_hash"


@pytest.mark.asyncio
async def test_batch_upload_resumes_all_success(
    candidate_service,
    mock_oss_service,
    mock_resume_parser,
    mock_supabase,
):
    """Test batch upload with all files succeeding."""
    # Mock OSS upload
    mock_oss_service.upload_file.return_value = {
        "success": True,
        "file_url": "https://oss.example.com/resume.pdf",
        "file_md5": "abc123",
        "file_size": 12345,
    }

    # Mock resume parsing
    mock_resume_parser.parse_resume.return_value = {
        "name": "候选人",
        "phone": "13800138000",
        "email": "test@example.com",
        "skills": ["Python"],
        "highlights": "测试",
    }

    # Mock uniqueness check (not found)
    mock_response_exists = MagicMock()
    mock_response_exists.data = None

    # Mock create
    mock_response_create = MagicMock()
    mock_response_create.data = [{"id": 1, "name": "候选人"}]

    # Setup mock chains
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = mock_response_exists

    (
        mock_supabase.table.return_value
        .insert.return_value
        .execute.return_value
    ) = mock_response_create

    # Execute
    files = [
        (b"file1 content", "resume1.pdf"),
        (b"file2 content", "resume2.pdf"),
        (b"file3 content", "resume3.pdf"),
    ]

    result = await candidate_service.batch_upload_resumes(files, auto_parse=True)

    # Verify
    assert result["total"] == 3
    assert result["successful"] == 3
    assert result["failed"] == 0
    assert len(result["results"]) == 3
    assert all(r["status"] == "success" for r in result["results"])


@pytest.mark.asyncio
async def test_batch_upload_resumes_partial_failure(
    candidate_service,
    mock_oss_service,
    mock_resume_parser,
    mock_supabase,
):
    """Test batch upload with some files failing (fault tolerance)."""
    # Mock OSS upload - succeed for first, fail for second
    upload_results = [
        {
            "success": True,
            "file_url": "https://oss.example.com/resume1.pdf",
            "file_md5": "abc123",
            "file_size": 12345,
        },
        {
            "success": False,
            "file_url": "",
        },
        {
            "success": True,
            "file_url": "https://oss.example.com/resume3.pdf",
            "file_md5": "xyz789",
            "file_size": 12345,
        },
    ]

    mock_oss_service.upload_file.side_effect = upload_results

    # Mock resume parsing
    mock_resume_parser.parse_resume.return_value = {
        "name": "候选人",
        "phone": "13800138000",
        "email": "test@example.com",
        "skills": ["Python"],
        "highlights": "测试",
    }

    # Mock uniqueness check (not found)
    mock_response_exists = MagicMock()
    mock_response_exists.data = None

    # Mock create
    mock_response_create = MagicMock()
    mock_response_create.data = [{"id": 1, "name": "候选人"}]

    # Setup mock chains
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = mock_response_exists

    (
        mock_supabase.table.return_value
        .insert.return_value
        .execute.return_value
    ) = mock_response_create

    # Execute
    files = [
        (b"file1 content", "resume1.pdf"),
        (b"file2 content", "resume2.pdf"),
        (b"file3 content", "resume3.pdf"),
    ]

    result = await candidate_service.batch_upload_resumes(files, auto_parse=True)

    # Verify fault tolerance
    assert result["total"] == 3
    assert result["successful"] == 2
    assert result["failed"] == 1
    assert len(result["results"]) == 3

    # Check specific results
    assert result["results"][0]["status"] == "success"
    assert result["results"][1]["status"] == "failed"
    assert result["results"][2]["status"] == "success"


def test_soft_delete_cascade(candidate_service, mock_supabase):
    """Test soft delete with cascade to position_candidates."""
    # Mock soft delete on candidate
    mock_response_delete = MagicMock()
    mock_response_delete.data = [{"id": 1, "is_deleted": True}]

    # Mock cascade update
    mock_response_cascade = MagicMock()
    mock_response_cascade.data = [
        {"id": 10, "candidate_id": 1, "is_deleted": True},
        {"id": 11, "candidate_id": 1, "is_deleted": True},
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
    result = candidate_service.soft_delete(1)

    # Verify
    assert result is True
    # Verify cascade was called
    assert mock_supabase.table.call_count >= 2  # Once for candidate, once for position_candidates


@pytest.mark.asyncio
async def test_upload_with_highlights_array_conversion(
    candidate_service,
    mock_oss_service,
    mock_resume_parser,
    mock_supabase,
):
    """Test that highlights array from AI is converted to newline-separated string."""
    # Mock OSS upload
    mock_oss_service.upload_file.return_value = {
        "success": True,
        "file_url": "https://oss.example.com/resume.pdf",
        "file_md5": "abc123def456",
        "file_size": 12345,
    }

    # Mock resume parsing - AI returns highlights as array
    mock_resume_parser.parse_resume.return_value = {
        "name": "测试候选人",
        "phone": "13800138000",
        "email": "Test@Example.COM",  # Test email normalization
        "skills": ["Python", "FastAPI"],
        "highlights": [
            "5年全栈开发经验",
            "熟悉微服务架构",
            "具备大型项目架构能力"
        ],
        "years_of_experience": 5,
        "education_level": "本科",
    }

    # Mock find_by_unique_key (not found)
    from unittest.mock import patch

    created_data = {}

    def mock_create(data):
        created_data.update(data)
        return {
            "id": 1,
            **data,
        }

    with patch.object(candidate_service, 'find_by_unique_key', return_value=None):
        with patch.object(candidate_service, 'create', side_effect=mock_create):
            # Execute
            result = await candidate_service.upload_and_create_from_resume(
                file_content=b"fake pdf content",
                file_name="resume.pdf",
                auto_parse=True,
            )

            # Verify parse status
            assert result["parse_status"] == "success"

            # Verify highlights was converted from array to string
            assert "highlights" in created_data
            assert isinstance(created_data["highlights"], str)
            assert created_data["highlights"] == "5年全栈开发经验\n熟悉微服务架构\n具备大型项目架构能力"

            # Verify email was normalized to lowercase
            assert created_data["email"] == "test@example.com"
