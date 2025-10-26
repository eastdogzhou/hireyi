"""Validation script for real resume processing.

This script:
1. Cleans up old test data from Supabase
2. Batch uploads real resumes from data/ directory
3. Validates candidate data quality
4. Generates a validation report
"""

from __future__ import annotations

import asyncio
import logging
import os
import sys
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.config.database import get_supabase

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configuration
API_BASE_URL = "http://localhost:8000"
DATA_DIR = Path(__file__).parent.parent.parent / "data"


def cleanup_old_data() -> dict[str, int]:
    """Clean up all old test data from Supabase.

    :return: Dictionary with counts of deleted records
    """
    logger.info("Starting cleanup of old test data...")
    supabase = get_supabase()

    deleted_counts = {
        "candidates": 0,
        "positions": 0,
        "position_candidates": 0,
        "interview_feedbacks": 0,
        "users": 0,
    }

    try:
        # Soft delete all candidates (cascades to position_candidates)
        result = (
            supabase.table("candidates")
            .update({"is_deleted": True})
            .eq("is_deleted", False)
            .execute()
        )
        deleted_counts["candidates"] = len(result.data) if result.data else 0
        logger.info(f"Soft deleted {deleted_counts['candidates']} candidates")

        # Soft delete all positions (cascades to position_candidates)
        result = (
            supabase.table("positions")
            .update({"is_deleted": True})
            .eq("is_deleted", False)
            .execute()
        )
        deleted_counts["positions"] = len(result.data) if result.data else 0
        logger.info(f"Soft deleted {deleted_counts['positions']} positions")

        # Soft delete all interview feedbacks
        result = (
            supabase.table("interview_feedbacks")
            .update({"is_deleted": True})
            .eq("is_deleted", False)
            .execute()
        )
        deleted_counts["interview_feedbacks"] = len(result.data) if result.data else 0
        logger.info(
            f"Soft deleted {deleted_counts['interview_feedbacks']} interview feedbacks"
        )

        # Soft delete all users (except system admin)
        result = (
            supabase.table("users")
            .update({"is_deleted": True})
            .eq("is_deleted", False)
            .neq("email", "admin@system.com")  # Keep system admin
            .execute()
        )
        deleted_counts["users"] = len(result.data) if result.data else 0
        logger.info(f"Soft deleted {deleted_counts['users']} users")

        logger.info("Cleanup completed successfully")
        return deleted_counts

    except Exception as e:
        logger.error(f"Error during cleanup: {e}", exc_info=True)
        raise


async def batch_upload_resumes(resume_files: list[Path]) -> dict[str, Any]:
    """Batch upload resume files via API.

    :param resume_files: List of resume file paths
    :return: API response with upload results
    """
    logger.info(f"Starting batch upload of {len(resume_files)} resumes...")

    # Prepare multipart form data
    files = []
    for resume_path in resume_files:
        try:
            with open(resume_path, "rb") as f:
                file_content = f.read()
                files.append(
                    ("files", (resume_path.name, file_content, "application/pdf"))
                )
        except Exception as e:
            logger.error(f"Error reading file {resume_path}: {e}")

    if not files:
        raise ValueError("No files to upload")

    # Make API request
    async with httpx.AsyncClient(timeout=600.0) as client:
        try:
            response = await client.post(
                f"{API_BASE_URL}/api/candidates/batch-upload",
                files=files,
            )
            response.raise_for_status()
            result = response.json()

            logger.info(
                f"Batch upload completed: {result['successful']}/{result['total']} successful"
            )
            return result

        except httpx.HTTPError as e:
            logger.error(f"HTTP error during upload: {e}")
            raise
        except Exception as e:
            logger.error(f"Error during upload: {e}", exc_info=True)
            raise


def validate_candidate_quality(candidate: dict[str, Any]) -> dict[str, Any]:
    """Validate quality of a single candidate's data.

    :param candidate: Candidate data dictionary
    :return: Validation result with quality metrics
    """
    issues = []

    # Check required fields
    if not candidate.get("name"):
        issues.append("Missing name")

    if not candidate.get("resume_text"):
        issues.append("Missing resume text")

    if not candidate.get("resume_file"):
        issues.append("Missing resume file URL")

    # Check data completeness
    if not candidate.get("skills") or len(candidate.get("skills", [])) == 0:
        issues.append("No skills extracted")

    if not candidate.get("experience_years"):
        issues.append("Missing experience years")

    if not candidate.get("summary"):
        issues.append("Missing summary")

    # Check contact info
    has_contact = candidate.get("phone") or candidate.get("email")
    if not has_contact:
        issues.append("Missing contact information")

    # Calculate quality score (0-100)
    max_score = 100
    deductions = {
        "Missing name": 30,
        "Missing resume text": 25,
        "Missing resume file URL": 10,
        "No skills extracted": 15,
        "Missing experience years": 10,
        "Missing summary": 5,
        "Missing contact information": 5,
    }

    quality_score = max_score
    for issue in issues:
        quality_score -= deductions.get(issue, 5)

    quality_score = max(0, quality_score)

    return {
        "candidate_id": candidate.get("id"),
        "name": candidate.get("name", "UNKNOWN"),
        "quality_score": quality_score,
        "issues": issues,
        "has_skills": len(candidate.get("skills", [])) > 0,
        "skills_count": len(candidate.get("skills", [])),
        "has_contact": has_contact,
        "experience_years": candidate.get("experience_years"),
    }


def generate_report(
    cleanup_result: dict[str, int],
    upload_result: dict[str, Any],
    quality_results: list[dict[str, Any]],
) -> None:
    """Generate and print validation report.

    :param cleanup_result: Cleanup statistics
    :param upload_result: Upload results from API
    :param quality_results: Quality validation results
    """
    print("\n" + "=" * 80)
    print("RESUME VALIDATION REPORT")
    print("=" * 80)

    # Cleanup summary
    print("\n📋 Data Cleanup Summary:")
    print(f"  - Candidates deleted: {cleanup_result['candidates']}")
    print(f"  - Positions deleted: {cleanup_result['positions']}")
    print(f"  - Interview feedbacks deleted: {cleanup_result['interview_feedbacks']}")
    print(f"  - Users deleted: {cleanup_result['users']}")

    # Upload summary
    print("\n📤 Batch Upload Summary:")
    print(f"  - Total files: {upload_result['total']}")
    print(f"  - Successful: {upload_result['successful']}")
    print(f"  - Failed: {upload_result['failed']}")
    print(
        f"  - Success rate: {upload_result['successful'] / upload_result['total'] * 100:.1f}%"
    )

    # Failed uploads
    if upload_result["failed"] > 0:
        print("\n❌ Failed Uploads:")
        for result in upload_result["results"]:
            if result["status"] == "failed":
                print(f"  - {result['file_name']}: {result.get('error', 'Unknown error')}")

    # Quality analysis
    print("\n🔍 Data Quality Analysis:")
    avg_quality = (
        sum(r["quality_score"] for r in quality_results) / len(quality_results)
        if quality_results
        else 0
    )
    print(f"  - Average quality score: {avg_quality:.1f}/100")

    high_quality = [r for r in quality_results if r["quality_score"] >= 80]
    medium_quality = [
        r for r in quality_results if 50 <= r["quality_score"] < 80
    ]
    low_quality = [r for r in quality_results if r["quality_score"] < 50]

    print(f"  - High quality (≥80): {len(high_quality)}")
    print(f"  - Medium quality (50-79): {len(medium_quality)}")
    print(f"  - Low quality (<50): {len(low_quality)}")

    # Skills extraction
    with_skills = [r for r in quality_results if r["has_skills"]]
    print(f"\n  - Candidates with skills extracted: {len(with_skills)}/{len(quality_results)}")
    if with_skills:
        avg_skills = sum(r["skills_count"] for r in with_skills) / len(with_skills)
        print(f"  - Average skills per candidate: {avg_skills:.1f}")

    # Contact info
    with_contact = [r for r in quality_results if r["has_contact"]]
    print(f"  - Candidates with contact info: {len(with_contact)}/{len(quality_results)}")

    # Low quality candidates
    if low_quality:
        print("\n⚠️  Low Quality Candidates:")
        for result in low_quality:
            print(f"\n  {result['name']} (ID: {result['candidate_id']})")
            print(f"    Quality Score: {result['quality_score']}/100")
            print(f"    Issues:")
            for issue in result["issues"]:
                print(f"      - {issue}")

    # Overall status
    print("\n" + "=" * 80)
    if avg_quality >= 80 and upload_result["failed"] == 0:
        print("✅ VALIDATION PASSED - All resumes processed successfully with high quality")
    elif avg_quality >= 60:
        print("⚠️  VALIDATION WARNING - Some quality issues detected")
    else:
        print("❌ VALIDATION FAILED - Significant quality issues detected")
    print("=" * 80 + "\n")


async def main() -> None:
    """Main validation workflow."""
    try:
        # Step 1: Cleanup old data
        print("\n🧹 Step 1: Cleaning up old test data...")
        cleanup_result = cleanup_old_data()

        # Step 2: Get all resume files
        print(f"\n📂 Step 2: Scanning {DATA_DIR} for resume files...")
        resume_files = sorted(DATA_DIR.glob("*.pdf"))
        logger.info(f"Found {len(resume_files)} PDF files")

        if not resume_files:
            logger.error("No PDF files found in data/ directory")
            return

        for f in resume_files:
            logger.info(f"  - {f.name}")

        # Step 3: Batch upload
        print(f"\n📤 Step 3: Batch uploading {len(resume_files)} resumes...")
        upload_result = await batch_upload_resumes(resume_files)

        # Step 4: Validate quality
        print("\n🔍 Step 4: Validating data quality...")
        quality_results = []

        for result in upload_result["results"]:
            if result["status"] == "success" and result["candidate"]:
                validation = validate_candidate_quality(result["candidate"])
                quality_results.append(validation)
                logger.info(
                    f"Validated {validation['name']}: "
                    f"quality={validation['quality_score']}/100"
                )

        # Step 5: Generate report
        print("\n📊 Step 5: Generating validation report...")
        generate_report(cleanup_result, upload_result, quality_results)

        logger.info("Validation workflow completed successfully")

    except Exception as e:
        logger.error(f"Validation workflow failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
