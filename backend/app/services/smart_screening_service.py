"""Smart screening service for AI-powered candidate-position matching.

This service implements a two-phase screening approach:
1. Pre-screening: Keyword-based filtering using highlights and skills
2. AI Ranking: LLM-based scoring for pre-screened candidates

Business Rules:
- Maximum 100 candidates per screening run
- Skip existing associations (deduplication)
- Recalculate scores for all associated candidates when re-run
"""

import json
import logging
from typing import Any

from supabase import Client

from app.services.candidate_service import CandidateService
from app.services.llm.client import text_complete
from app.services.llm.prompts import CANDIDATE_MATCHING_PROMPT, format_candidate_info
from app.services.position_candidate_service import PositionCandidateService
from app.services.position_service import PositionService

logger = logging.getLogger(__name__)


class SmartScreeningService:
    """Smart screening service for intelligent candidate matching.

    Implements two-phase screening:
    1. Pre-screening: Keyword matching on highlights + skills
    2. AI Ranking: LLM scoring for detailed evaluation
    """

    def __init__(
        self,
        supabase: Client,
        candidate_service: CandidateService,
        position_service: PositionService,
        position_candidate_service: PositionCandidateService,
    ):
        """Initialize smart screening service.

        :param supabase: Supabase client instance
        :param candidate_service: Candidate service instance
        :param position_service: Position service instance
        :param position_candidate_service: Position-candidate relationship service
        """
        self.supabase = supabase
        self.candidate_service = candidate_service
        self.position_service = position_service
        self.position_candidate_service = position_candidate_service
        logger.info("SmartScreeningService initialized")

    def _extract_keywords_from_jd(self, jd: str) -> list[str]:
        """Extract keywords from job description for pre-screening.

        Simple implementation: extract words that appear to be skills/technologies.

        :param jd: Job description text
        :return: List of keywords
        """
        # Common technology keywords and patterns
        # In production, this could use NLP or a more sophisticated approach
        common_keywords = [
            "python", "java", "javascript", "typescript", "react", "vue", "angular",
            "node", "django", "flask", "fastapi", "spring", "golang", "rust",
            "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
            "docker", "kubernetes", "aws", "azure", "gcp",
            "git", "ci/cd", "devops", "microservices", "restful", "graphql",
        ]

        jd_lower = jd.lower()
        found_keywords = []

        for keyword in common_keywords:
            if keyword in jd_lower:
                found_keywords.append(keyword)

        logger.debug(f"Extracted {len(found_keywords)} keywords from JD")
        return found_keywords

    def _pre_screen_candidates(
        self,
        all_candidates: list[dict[str, Any]],
        keywords: list[str],
        max_candidates: int = 200,
    ) -> list[dict[str, Any]]:
        """Pre-screen candidates using keyword matching.

        Filters candidates based on skills and highlights matching JD keywords.

        :param all_candidates: All available candidates
        :param keywords: Keywords extracted from job description
        :param max_candidates: Maximum candidates to pass to AI phase
        :return: Pre-screened candidates
        """
        logger.info(
            f"Pre-screening {len(all_candidates)} candidates with {len(keywords)} keywords"
        )

        scored_candidates = []

        for candidate in all_candidates:
            # Calculate match score
            candidate_skills = [s.lower() for s in candidate.get("skills", [])]
            highlights = candidate.get("highlights", "")
            highlights_lower = highlights.lower() if highlights else ""

            # Count keyword matches
            skill_matches = sum(1 for kw in keywords if kw in candidate_skills)
            highlight_matches = sum(1 for kw in keywords if kw in highlights_lower)

            total_matches = skill_matches + highlight_matches

            # Only consider candidates with at least one match
            if total_matches > 0:
                scored_candidates.append({
                    "candidate": candidate,
                    "match_score": total_matches,
                })

        # Sort by match score (descending)
        scored_candidates.sort(key=lambda x: x["match_score"], reverse=True)

        # Take top N candidates
        top_candidates = [
            item["candidate"]
            for item in scored_candidates[:max_candidates]
        ]

        logger.info(
            f"Pre-screening complete: {len(top_candidates)}/{len(all_candidates)} candidates passed"
        )

        return top_candidates

    async def _score_candidate_for_position(
        self,
        candidate: dict[str, Any],
        position: dict[str, Any],
        model: str = "openrouter/openai/gpt-4o",
    ) -> dict[str, Any]:
        """Score a single candidate against a position using LLM.

        :param candidate: Candidate data
        :param position: Position data
        :param model: LLM model to use
        :return: Scoring result with relevance_score, fit_score, and additional info
        """
        candidate_info = format_candidate_info(candidate)

        prompt = CANDIDATE_MATCHING_PROMPT.format(
            candidate_info=candidate_info,
            position_title=position.get("title", ""),
            jd_content=position.get("jd", ""),
        )

        messages = [
            {
                "role": "system",
                "content": "你是一个专业的招聘顾问，擅长评估候选人与岗位的匹配度。",
            },
            {"role": "user", "content": prompt},
        ]

        try:
            response = await text_complete(
                model_name=model,
                messages=messages,
                temperature=0.3,
                response_format={"type": "json_object"},
            )

            result = json.loads(response.content)

            logger.debug(
                f"Scored candidate {candidate.get('name')}: "
                f"relevance={result.get('relevance_score')}, fit={result.get('fit_score')}"
            )

            return result

        except Exception as e:
            logger.error(f"Error scoring candidate {candidate.get('id')}: {e}")
            # Return default scores on error
            return {
                "relevance_score": 2,
                "fit_score": 2,
                "relevance_reason": "评分失败，使用默认分数",
                "fit_reason": "评分失败，使用默认分数",
                "strengths": [],
                "concerns": ["AI 评分失败"],
                "recommendation": "需要人工复核",
            }

    async def run_smart_screening(
        self,
        position_id: int,
        max_candidates: int = 100,
        pre_screen_limit: int = 200,
        min_score: int = 1,
        model: str = "openrouter/openai/gpt-4o",
    ) -> dict[str, Any]:
        """Run complete smart screening process for a position.

        Two-phase approach:
        1. Pre-screening: Keyword matching (select top 200)
        2. AI Ranking: LLM scoring (select top 100)

        Handles deduplication: skips existing associations.

        :param position_id: Position ID to screen for
        :param max_candidates: Maximum candidates to add (default: 100)
        :param pre_screen_limit: Maximum candidates to pass to AI phase (default: 200)
        :param min_score: Minimum overall score to accept (1-4, default: 1)
        :param model: LLM model to use for scoring
        :return: Screening result summary
        """
        import time
        start_time = time.time()
        logger.info(f"Starting smart screening for position: {position_id}")

        # Get position data
        position = self.position_service.get_by_id(position_id)
        if not position:
            raise ValueError(f"Position {position_id} not found")

        # Extract keywords from JD
        keywords = self._extract_keywords_from_jd(position.get("jd", ""))

        # Get all active candidates
        all_candidates = self.candidate_service.get_all(limit=1000)  # Get more candidates
        logger.info(f"Found {len(all_candidates)} total candidates")

        # Phase 1: Pre-screening (keyword matching)
        pre_screened = self._pre_screen_candidates(
            all_candidates,
            keywords,
            max_candidates=pre_screen_limit,
        )

        if not pre_screened:
            logger.warning("No candidates passed pre-screening")
            execution_time = time.time() - start_time
            return {
                "position_id": position_id,
                "total_candidates": len(all_candidates),
                "pre_screened": 0,
                "ai_scored": 0,
                "new_associations": 0,
                "skipped_existing": 0,
                "results": [],
                "execution_time": execution_time,
            }

        # Phase 2: AI Ranking
        logger.info(f"Starting AI scoring for {len(pre_screened)} candidates")

        scored_results = []
        skipped_count = 0

        for candidate in pre_screened:
            candidate_id = candidate.get("id")

            # Check if association already exists (deduplication)
            if self.position_candidate_service.check_association_exists(
                position_id, candidate_id
            ):
                logger.debug(
                    f"Skipping candidate {candidate_id}: association already exists"
                )
                skipped_count += 1
                continue

            # Score candidate with AI
            try:
                score_result = await self._score_candidate_for_position(
                    candidate, position, model
                )

                scored_results.append({
                    "candidate_id": candidate_id,
                    "candidate_name": candidate.get("name"),
                    "relevance_score": score_result.get("relevance_score", 2),
                    "fit_score": score_result.get("fit_score", 2),
                    "relevance_reason": score_result.get("relevance_reason", ""),
                    "fit_reason": score_result.get("fit_reason", ""),
                    "strengths": score_result.get("strengths", []),
                    "concerns": score_result.get("concerns", []),
                    "recommendation": score_result.get("recommendation", ""),
                })

            except Exception as e:
                logger.error(f"Error scoring candidate {candidate_id}: {e}")
                continue

        # Sort by overall score (relevance * 0.6 + fit * 0.4)
        scored_results.sort(
            key=lambda x: (x["relevance_score"] * 0.6 + x["fit_score"] * 0.4),
            reverse=True,
        )

        # Filter by minimum score (round down the weighted average to 1-4)
        filtered_results = [
            result for result in scored_results
            if int((result["relevance_score"] * 0.6 + result["fit_score"] * 0.4) + 0.5) >= min_score
        ]

        logger.info(
            f"Score filtering: {len(filtered_results)}/{len(scored_results)} candidates "
            f"passed min_score={min_score}"
        )

        # Take top N candidates from filtered results
        top_candidates = filtered_results[:max_candidates]

        # Phase 3: Create associations
        logger.info(f"Creating associations for top {len(top_candidates)} candidates")

        created_count = 0
        for result in top_candidates:
            try:
                self.position_candidate_service.create_association(
                    position_id=position_id,
                    candidate_id=result["candidate_id"],
                    relevance_score=result["relevance_score"],
                    fit_score=result["fit_score"],
                    current_status="screening",
                )
                created_count += 1
            except Exception as e:
                logger.error(
                    f"Error creating association for candidate {result['candidate_id']}: {e}"
                )

        execution_time = time.time() - start_time

        logger.info(
            f"Smart screening complete: {created_count} new associations created, "
            f"{skipped_count} skipped (already exists), time={execution_time:.2f}s"
        )

        # Fetch created associations with full candidate details
        created_associations = []
        if created_count > 0:
            associations_result = self.position_candidate_service.get_candidates_with_details_for_position(
                position_id=position_id,
                sort_by="overall_score_numeric",
                sort_order="desc",
                limit=created_count,
            )
            created_associations = associations_result.get("candidates", [])

        return {
            "position_id": position_id,
            "total_candidates": len(all_candidates),
            "pre_screened": len(pre_screened),
            "ai_scored": len(scored_results),
            "new_associations": created_count,
            "skipped_existing": skipped_count,
            "results": top_candidates[:10],  # Return top 10 for preview
            "created_associations": created_associations,
            "execution_time": execution_time,
        }

    async def recalculate_scores_for_position(
        self,
        position_id: int,
        model: str = "openrouter/openai/gpt-4o",
    ) -> dict[str, Any]:
        """Recalculate scores for all candidates associated with a position.

        Used when position JD is updated or when manually triggered.

        :param position_id: Position ID
        :param model: LLM model to use for scoring
        :return: Recalculation result summary
        """
        logger.info(f"Recalculating scores for position: {position_id}")

        # Get position data
        position = self.position_service.get_by_id(position_id)
        if not position:
            raise ValueError(f"Position {position_id} not found")

        # Get all associated candidates
        associations_result = self.position_candidate_service.get_candidates_for_position(
            position_id=position_id,
            limit=1000,  # Get all
        )

        associations = associations_result["associations"]
        logger.info(f"Found {len(associations)} existing associations")

        updated_count = 0
        error_count = 0

        for assoc in associations:
            candidate_id = assoc.get("candidate_id")

            # Get candidate data
            candidate = self.candidate_service.get_by_id(candidate_id)
            if not candidate:
                logger.warning(f"Candidate {candidate_id} not found, skipping")
                error_count += 1
                continue

            try:
                # Score candidate with AI
                score_result = await self._score_candidate_for_position(
                    candidate, position, model
                )

                # Update scores
                self.position_candidate_service.update_scores(
                    record_id=assoc["id"],
                    relevance_score=score_result.get("relevance_score", 2),
                    fit_score=score_result.get("fit_score", 2),
                )

                updated_count += 1

            except Exception as e:
                logger.error(
                    f"Error recalculating score for candidate {candidate_id}: {e}"
                )
                error_count += 1

        logger.info(
            f"Recalculation complete: {updated_count} updated, {error_count} errors"
        )

        return {
            "position_id": position_id,
            "total_associations": len(associations),
            "updated": updated_count,
            "errors": error_count,
        }
