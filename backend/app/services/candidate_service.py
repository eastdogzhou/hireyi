"""Candidate management service.

This service handles all candidate-related operations including:
- CRUD operations with uniqueness validation
- Resume upload and parsing
- Batch upload with fault tolerance
- Advanced search and filtering
- Cascade soft delete for position_candidates
- Global candidate scoring (0-10 scale)
"""

import json
import logging
from typing import Any

from postgrest import APIResponse
from supabase import Client

from app.services.base import BaseService
from app.services.llm.client import text_complete
from app.services.llm.prompts import RESUME_GLOBAL_SCORING_PROMPT
from app.services.parser.resume_parser import ResumeParser
from app.services.storage.oss_service import OSSService

logger = logging.getLogger(__name__)


class CandidateService(BaseService[dict[str, Any]]):
    """Candidate management service.

    Provides comprehensive candidate management including:
    - Uniqueness validation (name+phone or resume_md5)
    - Resume upload and AI parsing
    - Batch upload with fault tolerance
    - Advanced search (name, skills, score, date range)
    - Cascade soft delete
    """

    def __init__(
        self,
        supabase: Client,
        oss_service: OSSService,
        resume_parser: ResumeParser,
    ):
        """Initialize candidate service.

        :param supabase: Supabase client instance
        :param oss_service: OSS file storage service
        :param resume_parser: Resume parsing service
        """
        super().__init__(supabase, "candidates")
        self.oss_service = oss_service
        self.resume_parser = resume_parser
        logger.info("CandidateService initialized")

    def find_by_unique_key(
        self,
        name: str,
        phone: str | None,
        resume_md5: str,
    ) -> dict[str, Any] | None:
        """Find candidate by unique key (name+phone or resume_md5).

        Priority 1: name + phone (if phone is not None)
        Priority 2: resume_md5

        :param name: Candidate name
        :param phone: Phone number (optional)
        :param resume_md5: Resume file MD5 hash
        :return: Candidate data or None if not found
        """
        logger.debug(
            f"Searching for candidate: name={name}, phone={phone}, md5={resume_md5[:8]}..."
        )

        # Priority 1: Check name + phone (if phone is provided)
        if phone:
            response: APIResponse | None = (
                self._get_active_query()
                .eq("name", name)
                .eq("phone", phone)
                .maybe_single()
                .execute()
            )

            if response and response.data:
                logger.info(
                    f"Candidate found by name+phone: {response.data.get('id')}"
                )
                return response.data

        # Priority 2: Check resume_md5
        response = (
            self._get_active_query()
            .eq("resume_md5", resume_md5)
            .maybe_single()
            .execute()
        )

        if response and response.data:
            logger.info(
                f"Candidate found by resume_md5: {response.data.get('id')}"
            )
            return response.data

        logger.debug("No existing candidate found")
        return None

    async def calculate_global_score(
        self,
        resume_text: str,
        model: str = "openrouter/openai/gpt-4o",
        temperature: float = 0.3,
    ) -> dict[str, Any]:
        """Calculate candidate global score (0-10) based on resume content.

        Uses LLM to evaluate resume across 6 dimensions:
        - School (0-3)
        - Major (0-2)
        - Degree (0-2)
        - GPA (0-1)
        - AI experience (0-1)
        - Competition (0-1)

        :param resume_text: Resume plain text content
        :param model: LLM model to use
        :param temperature: LLM temperature
        :return: Dictionary with total_score (0-10), category scores, and reason
        :raises ValueError: If resume_text is empty or LLM response is invalid
        """
        logger.info("Calculating global candidate score...")

        if not resume_text or len(resume_text) < 50:
            logger.warning("Resume text too short or empty")
            return {
                "total_score": 0,
                "school_score": 0,
                "major_score": 0,
                "degree_score": 0,
                "gpa_score": 0,
                "ai_experience_score": 0,
                "competition_score": 0,
                "reason": "简历内容过短或为空",
            }

        try:
            # Format prompt with resume text
            prompt = RESUME_GLOBAL_SCORING_PROMPT.format(resume_text=resume_text)

            messages = [
                {
                    "role": "system",
                    "content": "你是一个专业的简历评估专家，擅长根据简历内容进行客观评分。",
                },
                {"role": "user", "content": prompt},
            ]

            # Call LLM
            logger.debug(f"Calling LLM for scoring with model: {model}")
            response = await text_complete(
                model_name=model,
                messages=messages,
                temperature=temperature,
                response_format={"type": "json_object"},
            )

            # Parse JSON response
            score_data = json.loads(response.content)
            logger.debug(f"LLM returned score data: {score_data}")

            # Extract category scores
            school_score = float(score_data.get("school_score", 0))
            major_score = float(score_data.get("major_score", 0))
            degree_score = float(score_data.get("degree_score", 0))
            gpa_score = float(score_data.get("gpa_score", 0))
            ai_experience_score = float(score_data.get("ai_experience_score", 0))
            competition_score = float(score_data.get("competition_score", 0))
            reason = score_data.get("reason", "")

            # Calculate total score (sum of all categories)
            total_score = (
                school_score
                + major_score
                + degree_score
                + gpa_score
                + ai_experience_score
                + competition_score
            )

            # Round to 1 decimal place and cap at 10
            total_score = round(min(total_score, 10.0), 1)

            logger.info(f"Global score calculated: {total_score}/10")

            return {
                "total_score": total_score,
                "school_score": school_score,
                "major_score": major_score,
                "degree_score": degree_score,
                "gpa_score": gpa_score,
                "ai_experience_score": ai_experience_score,
                "competition_score": competition_score,
                "reason": reason,
            }

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON response: {e}")
            raise ValueError("Invalid JSON response from LLM") from e

        except Exception as e:
            logger.error(f"Error calculating global score: {e}")
            raise

    def search_candidates(
        self,
        name_query: str | None = None,
        skills: list[str] | None = None,
        min_score: int | None = None,
        max_score: int | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> dict[str, Any]:
        """Search candidates with multiple filters.

        :param name_query: Name fuzzy search (partial match)
        :param skills: Skills filter (contains any of the specified skills)
        :param min_score: Minimum score filter (inclusive)
        :param max_score: Maximum score filter (inclusive)
        :param limit: Maximum number of results
        :param offset: Number of records to skip
        :return: Dictionary with candidates list, total count, limit, and offset
        """
        logger.debug(
            f"Searching candidates: name={name_query}, skills={skills}, "
            f"score={min_score}-{max_score}, limit={limit}, offset={offset}"
        )

        # Start with base query
        query = self._get_active_query(count="exact")

        # Apply filters
        if name_query:
            # Fuzzy name search (case-insensitive partial match)
            query = query.ilike("name", f"%{name_query}%")

        if skills:
            # Skills filter: array overlaps (任意匹配)
            query = query.overlaps("skills", skills)

        if min_score is not None:
            query = query.gte("score", min_score)

        if max_score is not None:
            query = query.lte("score", max_score)

        # Execute query with pagination
        response: APIResponse = (
            query.order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        candidates = response.data
        total = response.count if response.count is not None else len(candidates)

        logger.debug(f"Found {total} candidates")

        return {
            "candidates": candidates,
            "total": total,
            "limit": limit,
            "offset": offset,
        }

    async def upload_and_create_from_resume(
        self,
        file_content: bytes,
        file_name: str,
        auto_parse: bool = True,
    ) -> dict[str, Any]:
        """Upload resume file and create candidate record.

        Workflow:
        1. Upload file to OSS
        2. Parse resume with AI (if auto_parse=True)
        3. Check for existing candidate (uniqueness)
        4. Create or update candidate record

        :param file_content: Resume file binary content
        :param file_name: Original filename
        :param auto_parse: Whether to automatically parse resume (default: True)
        :return: Dictionary with candidate data, file_url, and parse_status
        """
        logger.info(f"Processing resume upload: {file_name}")

        try:
            # Step 1: Upload file to OSS
            logger.info("Uploading file to OSS...")
            upload_result = self.oss_service.upload_file(
                file_content=file_content,
                file_name=file_name,
                subfolder="resumes/",
            )

            if not upload_result["success"]:
                logger.error("File upload failed")
                return {
                    "candidate": None,
                    "file_url": "",
                    "parse_status": "upload_failed",
                    "error": "Failed to upload file to OSS",
                }

            file_url = upload_result["file_url"]
            file_md5 = upload_result["file_md5"]
            logger.info(f"File uploaded successfully: {file_url}")

            # Step 2: Parse resume (if enabled)
            parsed_data = {}
            parse_status = "success"

            if auto_parse:
                try:
                    logger.info("Parsing resume with AI...")
                    parsed_data = await self.resume_parser.parse_resume(file_content)
                    logger.info("Resume parsed successfully")

                    # Step 2.1: Calculate global score based on resume text
                    resume_text = parsed_data.get("resume_text", "")
                    if resume_text:
                        try:
                            logger.info("Calculating global score...")
                            score_result = await self.calculate_global_score(resume_text)
                            # Store only the total score in candidate record
                            parsed_data["score"] = int(score_result["total_score"])
                            logger.info(
                                f"Global score calculated: {parsed_data['score']}/10"
                            )
                        except Exception as e:
                            logger.warning(f"Failed to calculate score: {e}")
                            # Don't fail the entire upload if scoring fails
                            parsed_data["score"] = None

                except Exception as e:
                    logger.error(f"Resume parsing failed: {e}")
                    parse_status = "parse_failed"
                    # Allow manual editing by returning partial data
                    parsed_data = {
                        "name": "解析失败 - 请手动编辑",
                        "skills": [],
                        "highlights": None,
                        "score": None,
                    }

            # Step 3: Prepare candidate data
            candidate_data = {
                "resume_file": file_url,
                "resume_md5": file_md5,
            }

            # Convert highlights from array to string if needed
            # AI returns highlights as array, but database stores as TEXT
            if parsed_data.get("highlights"):
                if isinstance(parsed_data["highlights"], list):
                    # Join array into newline-separated string
                    parsed_data["highlights"] = "\n".join(
                        str(h) for h in parsed_data["highlights"]
                    )
                    logger.debug("Converted highlights from array to string")

            # Normalize email to lowercase
            if parsed_data.get("email"):
                parsed_data["email"] = parsed_data["email"].lower().strip()
                logger.debug("Normalized email to lowercase")

            # Merge parsed data
            candidate_data.update(parsed_data)

            # Step 4: Check for existing candidate
            name = candidate_data.get("name", "")
            phone = candidate_data.get("phone")

            existing_candidate = self.find_by_unique_key(name, phone, file_md5)

            if existing_candidate:
                # Update existing candidate
                logger.info(
                    f"Updating existing candidate: {existing_candidate.get('id')}"
                )
                candidate = self.update(existing_candidate["id"], candidate_data)
                logger.info("Candidate updated successfully")
            else:
                # Create new candidate
                logger.info("Creating new candidate")
                candidate = self.create(candidate_data)
                logger.info(f"Candidate created successfully: {candidate.get('id')}")

            return {
                "candidate": candidate,
                "file_url": file_url,
                "parse_status": parse_status,
            }

        except Exception as e:
            logger.error(f"Error processing resume upload: {e}")
            return {
                "candidate": None,
                "file_url": "",
                "parse_status": "error",
                "error": str(e),
            }

    async def batch_upload_resumes(
        self,
        files: list[tuple[bytes, str]],
        auto_parse: bool = True,
    ) -> dict[str, Any]:
        """Batch upload resumes with fault tolerance.

        Continues processing other files even if one fails.

        :param files: List of (file_content, file_name) tuples
        :param auto_parse: Whether to automatically parse resumes
        :return: Dictionary with total, successful, failed counts and detailed results
        """
        logger.info(f"Starting batch upload of {len(files)} resumes")

        total = len(files)
        successful = 0
        failed = 0
        results = []

        for file_content, file_name in files:
            logger.info(f"Processing file: {file_name}")

            try:
                result = await self.upload_and_create_from_resume(
                    file_content=file_content,
                    file_name=file_name,
                    auto_parse=auto_parse,
                )

                if result["parse_status"] in ["success", "parse_failed"]:
                    # Consider partial success (file uploaded but parse failed)
                    successful += 1
                    results.append({
                        "file_name": file_name,
                        "status": "success",
                        "candidate": result["candidate"],
                        "parse_status": result["parse_status"],
                        "error": None,
                    })
                else:
                    failed += 1
                    results.append({
                        "file_name": file_name,
                        "status": "failed",
                        "candidate": None,
                        "parse_status": result["parse_status"],
                        "error": result.get("error"),
                    })

            except Exception as e:
                logger.error(f"Error processing {file_name}: {e}")
                failed += 1
                results.append({
                    "file_name": file_name,
                    "status": "failed",
                    "candidate": None,
                    "parse_status": "error",
                    "error": str(e),
                })

        logger.info(
            f"Batch upload completed: {successful}/{total} successful, {failed} failed"
        )

        return {
            "total": total,
            "successful": successful,
            "failed": failed,
            "results": results,
        }

    def soft_delete(self, record_id: int) -> bool:
        """Soft delete candidate and cascade to position_candidates.

        :param record_id: Candidate ID to delete
        :return: True if successful
        """
        logger.info(f"Soft deleting candidate: {record_id}")

        # Soft delete candidate
        result = super().soft_delete(record_id)

        # Cascade soft delete to position_candidates
        try:
            logger.info(f"Cascading soft delete to position_candidates")
            self.supabase.table("position_candidates").update({
                "is_deleted": True,
            }).eq("candidate_id", record_id).eq("is_deleted", False).execute()

            logger.info(f"Candidate and related records soft deleted: {record_id}")
        except Exception as e:
            logger.error(f"Error cascading soft delete: {e}")
            # Don't fail the entire operation if cascade fails
            # The candidate is already marked as deleted

        return result
