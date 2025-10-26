-- Migration: v1.4 - Update Candidate Global Score to 10-Point Scale
-- ============================================================================
-- Version: 1.4
-- Date: 2025-01-25
-- Description: Changes candidate global score from 4-point (1-4) to 10-point (0-10) scale
--
-- Changes:
-- 1. Update candidates.score CHECK constraint from (1-4) to (0-10)
-- 2. Update score column comment to reflect new LLM-based scoring system
-- 3. Reset existing scores to NULL (requires re-evaluation with new system)
--
-- IMPORTANT:
-- - This migration will set all existing candidate scores to NULL
-- - Scores will be automatically recalculated when:
--   a) New resumes are uploaded
--   b) Existing resumes are re-parsed
--   c) Manual score recalculation is triggered via API
-- ============================================================================

BEGIN;

-- Step 1: Drop existing CHECK constraint on score
ALTER TABLE candidates
DROP CONSTRAINT IF EXISTS candidates_score_check;

-- Step 2: Add new CHECK constraint for 10-point scale (0-10)
ALTER TABLE candidates
ADD CONSTRAINT candidates_score_check
CHECK (score >= 0 AND score <= 10);

-- Step 3: Reset existing scores to NULL
-- Old 4-point scores are not compatible with new 10-point system
UPDATE candidates
SET score = NULL
WHERE score IS NOT NULL;

-- Step 4: Update column comment
COMMENT ON COLUMN candidates.score IS 'Global comprehensive score (0-10 scale) based on resume content, evaluated by LLM across 6 dimensions: school, major, degree, GPA, AI experience, competition';

COMMIT;

-- ============================================================================
-- Verification Queries (Run after migration)
-- ============================================================================

-- Check constraint is updated
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'candidates_score_check';
-- Expected: (score >= 0) AND (score <= 10)

-- Check all scores are NULL
SELECT COUNT(*) as total_candidates,
       COUNT(score) as candidates_with_score,
       COUNT(*) - COUNT(score) as candidates_without_score
FROM candidates
WHERE is_deleted = false;
-- Expected: candidates_with_score = 0

-- Verify column comment
SELECT column_name, data_type, is_nullable,
       (SELECT description FROM pg_description
        WHERE objoid = 'candidates'::regclass
        AND objsubid = (SELECT ordinal_position FROM information_schema.columns
                       WHERE table_name = 'candidates' AND column_name = 'score')) as column_comment
FROM information_schema.columns
WHERE table_name = 'candidates' AND column_name = 'score';
-- Expected: New comment about 0-10 scale and 6 dimensions

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
