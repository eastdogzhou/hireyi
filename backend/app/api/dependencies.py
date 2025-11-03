"""Dependency injection for FastAPI routes."""

from functools import lru_cache

from supabase import Client

from app.config.database import get_supabase
from app.config.settings import get_settings
from app.services.candidate_service import CandidateService
from app.services.interview_feedback_service import InterviewFeedbackService
from app.services.parser.resume_parser import ResumeParser
from app.services.position_candidate_service import PositionCandidateService
from app.services.position_service import PositionService
from app.services.smart_screening_service import SmartScreeningService
from app.services.storage.oss_service import OSSService
from app.services.user_service import UserService


def get_supabase_client() -> Client:
    """Get Supabase client instance.

    :return: Supabase client
    """
    return get_supabase()


@lru_cache
def get_oss_service() -> OSSService:
    """Get OSS service instance (cached).

    :return: OSS service instance
    """
    return OSSService()


@lru_cache
def get_resume_parser() -> ResumeParser:
    """Get resume parser instance (cached).

    :return: Resume parser instance
    """
    settings = get_settings()
    return ResumeParser(
        default_model=settings.default_llm_model,
        default_temperature=settings.llm_temperature,
        max_retries=settings.ai_max_retries,
    )


def get_user_service() -> UserService:
    """Get user service instance.

    :return: User service instance
    """
    supabase = get_supabase_client()
    return UserService(supabase)


def get_candidate_service(org_id: str | None = None) -> CandidateService:
    """Get candidate service instance.

    :param org_id: Organization ID for data isolation (optional).
    :return: Candidate service instance
    """
    supabase = get_supabase_client()
    oss_service = get_oss_service()
    resume_parser = get_resume_parser()

    return CandidateService(supabase, oss_service, resume_parser, org_id=org_id)


def get_position_service(org_id: str | None = None) -> PositionService:
    """Get position service instance.

    :param org_id: Organization ID for data isolation (optional).
    :return: Position service instance
    """
    supabase = get_supabase_client()
    return PositionService(supabase, org_id=org_id)


def get_position_candidate_service(org_id: str | None = None) -> PositionCandidateService:
    """Get position-candidate service instance.

    :param org_id: Organization ID for data isolation (optional).
    :return: Position-candidate service instance
    """
    supabase = get_supabase_client()
    return PositionCandidateService(supabase, org_id=org_id)


def get_interview_feedback_service(org_id: str | None = None) -> InterviewFeedbackService:
    """Get interview feedback service instance.

    :param org_id: Organization ID for data isolation (optional).
    :return: Interview feedback service instance
    """
    supabase = get_supabase_client()
    return InterviewFeedbackService(supabase, org_id=org_id)


def get_smart_screening_service(org_id: str | None = None) -> SmartScreeningService:
    """Get smart screening service instance.

    :param org_id: Organization ID for data isolation (optional).
    :return: Smart screening service instance
    """
    supabase = get_supabase_client()

    candidate_service = get_candidate_service(org_id=org_id)
    position_service = get_position_service(org_id=org_id)
    position_candidate_service = get_position_candidate_service(org_id=org_id)

    return SmartScreeningService(
        supabase,
        candidate_service,
        position_service,
        position_candidate_service,
    )
