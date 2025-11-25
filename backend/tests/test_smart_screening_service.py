"""Tests for SmartScreeningService."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.smart_screening_service import SmartScreeningService


@pytest.fixture
def mock_supabase():
    """Create a mock Supabase client."""
    return MagicMock()


@pytest.fixture
def mock_candidate_service():
    """Create a mock CandidateService."""
    return MagicMock()


@pytest.fixture
def mock_position_service():
    """Create a mock PositionService."""
    return MagicMock()


@pytest.fixture
def mock_position_candidate_service():
    """Create a mock PositionCandidateService."""
    return MagicMock()


@pytest.fixture
def smart_screening_service(
    mock_supabase,
    mock_candidate_service,
    mock_position_service,
    mock_position_candidate_service,
):
    """Create SmartScreeningService instance with mocks."""
    return SmartScreeningService(
        mock_supabase,
        mock_candidate_service,
        mock_position_service,
        mock_position_candidate_service,
    )


def test_extract_keywords_from_jd(smart_screening_service):
    """Test extracting keywords from job description."""
    jd = """
    我们正在寻找一位经验丰富的 Python 后端工程师。

    要求：
    - 3年以上 Python 开发经验
    - 熟悉 FastAPI 或 Django 框架
    - 熟悉 PostgreSQL 数据库
    - 了解 Docker 和 Kubernetes
    - 有 AWS 或 Azure 云服务经验优先
    """

    keywords = smart_screening_service._extract_keywords_from_jd(jd)

    # Verify common keywords are extracted
    assert "python" in keywords
    assert "fastapi" in keywords
    assert "django" in keywords
    assert "postgresql" in keywords
    assert "docker" in keywords
    assert "kubernetes" in keywords


def test_pre_screen_candidates_with_matches(smart_screening_service):
    """Test pre-screening candidates with keyword matches."""
    candidates = [
        {
            "id": 1,
            "name": "张三",
            "skills": ["Python", "FastAPI", "PostgreSQL"],
            "highlights": "5年后端开发经验，熟悉微服务架构",
        },
        {
            "id": 2,
            "name": "李四",
            "skills": ["Java", "Spring", "MySQL"],
            "highlights": "3年 Java 开发经验",
        },
        {
            "id": 3,
            "name": "王五",
            "skills": ["Python", "Django"],
            "highlights": "2年 Python 开发经验",
        },
    ]

    keywords = ["python", "fastapi", "postgresql"]

    result = smart_screening_service._pre_screen_candidates(
        candidates, keywords, max_candidates=10
    )

    # Verify candidates with matches are included
    assert len(result) > 0
    # Verify ordering by match score (张三 has most matches)
    assert result[0]["id"] == 1


def test_pre_screen_candidates_no_matches(smart_screening_service):
    """Test pre-screening with no matching candidates."""
    candidates = [
        {
            "id": 1,
            "name": "张三",
            "skills": ["Java", "Spring"],
            "highlights": "Java 开发",
        },
    ]

    keywords = ["python", "fastapi"]

    result = smart_screening_service._pre_screen_candidates(
        candidates, keywords, max_candidates=10
    )

    # No matches
    assert len(result) == 0


@pytest.mark.asyncio
async def test_score_candidate_for_position_success(smart_screening_service):
    """Test successfully scoring a candidate for a position."""
    candidate = {
        "id": 1,
        "name": "张三",
        "skills": ["Python", "FastAPI"],
        "years_of_experience": 5,
    }

    position = {
        "id": 10,
        "title": "Python 后端工程师",
        "jd": "需要 3 年以上 Python 经验",
    }

    # Mock LLM response
    mock_response = MagicMock()
    mock_response.content = """
    {
        "relevance_score": 4,
        "relevance_reason": "技能高度匹配",
        "fit_score": 3,
        "fit_reason": "经验符合要求",
        "strengths": ["Python 经验丰富", "熟悉 FastAPI"],
        "concerns": ["无"],
        "recommendation": "强烈推荐"
    }
    """

    with patch(
        "app.services.smart_screening_service.text_complete",
        new_callable=AsyncMock,
        return_value=mock_response,
    ):
        result = await smart_screening_service._score_candidate_for_position(
            candidate, position
        )

        # Verify scores
        assert result["relevance_score"] == 4
        assert result["fit_score"] == 3
        assert "strengths" in result
        assert "recommendation" in result


@pytest.mark.asyncio
async def test_score_candidate_for_position_error_fallback(smart_screening_service):
    """Test fallback to default scores when LLM fails."""
    candidate = {"id": 1, "name": "张三"}
    position = {"id": 10, "title": "工程师", "jd": "招聘工程师"}

    # Mock LLM error
    with patch(
        "app.services.smart_screening_service.text_complete",
        new_callable=AsyncMock,
        side_effect=Exception("LLM error"),
    ):
        result = await smart_screening_service._score_candidate_for_position(
            candidate, position
        )

        # Verify fallback to default scores
        assert result["relevance_score"] == 2
        assert result["fit_score"] == 2
        assert "AI 评分失败" in result["concerns"]


@pytest.mark.asyncio
async def test_run_smart_screening_complete_flow(
    smart_screening_service,
    mock_position_service,
    mock_candidate_service,
    mock_position_candidate_service,
):
    """Test complete smart screening workflow."""
    # Mock position
    position_data = {
        "id": 10,
        "title": "Python 工程师",
        "jd": "需要 Python、FastAPI、PostgreSQL 经验",
    }
    mock_position_service.get_by_id.return_value = position_data

    # Mock candidates
    candidates_data = [
        {
            "id": 1,
            "name": "张三",
            "skills": ["Python", "FastAPI", "PostgreSQL"],
            "highlights": "5年 Python 开发经验",
        },
        {
            "id": 2,
            "name": "李四",
            "skills": ["Python", "Django"],
            "highlights": "3年 Python 开发",
        },
    ]
    mock_candidate_service.get_all.return_value = candidates_data

    # Mock association check (none exist)
    mock_position_candidate_service.check_association_exists.return_value = False

    # Mock association creation (success)
    mock_position_candidate_service.create_association.return_value = {
        "id": 1,
        "position_id": 10,
        "candidate_id": 1,
    }

    # Mock LLM response
    mock_response = MagicMock()
    mock_response.content = """
    {
        "relevance_score": 4,
        "fit_score": 3,
        "relevance_reason": "技能匹配",
        "fit_reason": "经验符合",
        "strengths": ["Python"],
        "concerns": [],
        "recommendation": "推荐"
    }
    """

    with patch(
        "app.services.smart_screening_service.text_complete",
        new_callable=AsyncMock,
        return_value=mock_response,
    ):
        result = await smart_screening_service.run_smart_screening(
            position_id=10,
            max_candidates=10,
        )

        # Verify result structure
        assert result["position_id"] == 10
        assert result["total_candidates"] == 2
        assert result["pre_screened"] > 0
        assert result["new_associations"] > 0


@pytest.mark.asyncio
async def test_run_smart_screening_with_existing_associations(
    smart_screening_service,
    mock_position_service,
    mock_candidate_service,
    mock_position_candidate_service,
):
    """Test smart screening skips existing associations."""
    # Mock position
    position_data = {
        "id": 10,
        "title": "Python 工程师",
        "jd": "需要 Python 经验",
    }
    mock_position_service.get_by_id.return_value = position_data

    # Mock candidates
    candidates_data = [
        {
            "id": 1,
            "name": "张三",
            "skills": ["Python"],
            "highlights": "Python 开发",
        },
    ]
    mock_candidate_service.get_all.return_value = candidates_data

    # Mock association check (already exists)
    mock_position_candidate_service.check_association_exists.return_value = True

    result = await smart_screening_service.run_smart_screening(
        position_id=10,
        max_candidates=10,
    )

    # Verify skipped count
    assert result["skipped_existing"] > 0
    assert result["new_associations"] == 0


@pytest.mark.asyncio
async def test_run_smart_screening_no_pre_screened_candidates(
    smart_screening_service,
    mock_position_service,
    mock_candidate_service,
):
    """Test smart screening with no candidates passing pre-screening."""
    # Mock position
    position_data = {
        "id": 10,
        "title": "Rust 工程师",
        "jd": "需要 Rust 经验",
    }
    mock_position_service.get_by_id.return_value = position_data

    # Mock candidates with no matching skills
    candidates_data = [
        {
            "id": 1,
            "name": "张三",
            "skills": ["Python"],
            "highlights": "Python 开发",
        },
    ]
    mock_candidate_service.get_all.return_value = candidates_data

    result = await smart_screening_service.run_smart_screening(
        position_id=10,
        max_candidates=10,
    )

    # Verify no candidates passed pre-screening
    assert result["pre_screened"] == 0
    assert result["new_associations"] == 0


@pytest.mark.asyncio
async def test_recalculate_scores_for_position(
    smart_screening_service,
    mock_position_service,
    mock_candidate_service,
    mock_position_candidate_service,
):
    """Test recalculating scores for existing associations."""
    # Mock position
    position_data = {
        "id": 10,
        "title": "Python 工程师",
        "jd": "需要 Python 经验",
    }
    mock_position_service.get_by_id.return_value = position_data

    # Mock existing associations
    associations_data = {
        "associations": [
            {"id": 1, "candidate_id": 20},
            {"id": 2, "candidate_id": 21},
        ],
        "total": 2,
    }
    mock_position_candidate_service.get_candidates_for_position.return_value = (
        associations_data
    )

    # Mock candidates
    mock_candidate_service.get_by_id.side_effect = [
        {"id": 20, "name": "张三", "skills": ["Python"]},
        {"id": 21, "name": "李四", "skills": ["Python"]},
    ]

    # Mock score update (success)
    mock_position_candidate_service.update_scores.return_value = {"id": 1}

    # Mock LLM response
    mock_response = MagicMock()
    mock_response.content = """
    {
        "relevance_score": 3,
        "fit_score": 3,
        "relevance_reason": "重新评分",
        "fit_reason": "重新评分",
        "strengths": [],
        "concerns": [],
        "recommendation": "可考虑"
    }
    """

    with patch(
        "app.services.smart_screening_service.text_complete",
        new_callable=AsyncMock,
        return_value=mock_response,
    ):
        result = await smart_screening_service.recalculate_scores_for_position(
            position_id=10
        )

        # Verify recalculation results
        assert result["position_id"] == 10
        assert result["total_associations"] == 2
        assert result["updated"] == 2
        assert result["errors"] == 0


@pytest.mark.asyncio
async def test_recalculate_scores_with_missing_candidate(
    smart_screening_service,
    mock_position_service,
    mock_candidate_service,
    mock_position_candidate_service,
):
    """Test recalculation handles missing candidates gracefully."""
    # Mock position
    position_data = {"id": 10, "title": "工程师", "jd": "招聘"}
    mock_position_service.get_by_id.return_value = position_data

    # Mock associations
    associations_data = {
        "associations": [{"id": 1, "candidate_id": 999}],
        "total": 1,
    }
    mock_position_candidate_service.get_candidates_for_position.return_value = (
        associations_data
    )

    # Mock candidate not found
    mock_candidate_service.get_by_id.return_value = None

    result = await smart_screening_service.recalculate_scores_for_position(
        position_id=10
    )

    # Verify error handling
    assert result["errors"] == 1
    assert result["updated"] == 0
