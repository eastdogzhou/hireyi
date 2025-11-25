-- Migration: Refactor interview_feedbacks table
-- Version: 2.0
-- Date: 2025-01-27
-- Description: Refactor interview_feedbacks to support three types of records:
--   1. Interview evaluations (interview_rating: 1-4)
--   2. AI evaluations (ai_rating: 1-10)
--   3. Status/log records (new_status: status enum)

-- ============================================================================
-- STEP 1: Backup existing data
-- ============================================================================

-- Create backup table
CREATE TABLE interview_feedbacks_backup AS
SELECT * FROM interview_feedbacks;

COMMENT ON TABLE interview_feedbacks_backup IS 'Backup of interview_feedbacks before v2.0 refactor';


-- ============================================================================
-- STEP 2: Drop and recreate interview_feedbacks table
-- ============================================================================

DROP TABLE IF EXISTS interview_feedbacks CASCADE;

CREATE TABLE interview_feedbacks (
    -- Primary key
    id SERIAL PRIMARY KEY,

    -- Relations (candidate_id required, position_id optional)
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    position_id INTEGER REFERENCES positions(id) ON DELETE CASCADE,

    -- Interviewer information (required, no FK constraint for flexibility)
    interviewer UUID NOT NULL,
    interviewer_type VARCHAR(20) NOT NULL CHECK (interviewer_type IN ('user', 'agent', 'system')),

    -- Core fields (all required)
    interview_date DATE NOT NULL,
    comments TEXT NOT NULL,

    -- Three mutually exclusive record types (only one should be non-NULL)
    interview_rating INTEGER CHECK (interview_rating >= 1 AND interview_rating <= 4),
    ai_rating INTEGER CHECK (ai_rating >= 1 AND ai_rating <= 10),
    new_status VARCHAR(20) CHECK (new_status IN ('screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn')),

    -- Metadata
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE interview_feedbacks IS 'Unified table for interview evaluations, AI evaluations, and status/log records (v2.0)';
COMMENT ON COLUMN interview_feedbacks.candidate_id IS 'Candidate ID (required)';
COMMENT ON COLUMN interview_feedbacks.position_id IS 'Position ID (optional for candidate-level records)';
COMMENT ON COLUMN interview_feedbacks.interviewer IS 'Interviewer UUID (user/agent/system, no FK constraint)';
COMMENT ON COLUMN interview_feedbacks.interviewer_type IS 'Type: user (human), agent (AI), system (automated)';
COMMENT ON COLUMN interview_feedbacks.interview_date IS 'Interview date for evaluations, or created_at date for logs';
COMMENT ON COLUMN interview_feedbacks.comments IS 'Feedback content or log description (required)';
COMMENT ON COLUMN interview_feedbacks.interview_rating IS 'Human interview rating (1-4 scale, mutually exclusive)';
COMMENT ON COLUMN interview_feedbacks.ai_rating IS 'AI evaluation rating (1-10 scale, mutually exclusive)';
COMMENT ON COLUMN interview_feedbacks.new_status IS 'Status for status change records (mutually exclusive)';


-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

CREATE INDEX idx_interview_feedbacks_candidate ON interview_feedbacks(candidate_id);
CREATE INDEX idx_interview_feedbacks_position ON interview_feedbacks(position_id);
CREATE INDEX idx_interview_feedbacks_interviewer ON interview_feedbacks(interviewer);
CREATE INDEX idx_interview_feedbacks_interviewer_type ON interview_feedbacks(interviewer_type);
CREATE INDEX idx_interview_feedbacks_is_deleted ON interview_feedbacks(is_deleted);
CREATE INDEX idx_interview_feedbacks_created_at ON interview_feedbacks(created_at DESC);
CREATE INDEX idx_interview_feedbacks_interview_date ON interview_feedbacks(interview_date DESC);

-- Composite index for common query: get feedbacks by candidate and position
CREATE INDEX idx_interview_feedbacks_candidate_position ON interview_feedbacks(candidate_id, position_id);


-- ============================================================================
-- STEP 4: Migrate existing data
-- ============================================================================

-- Migrate existing records from backup
-- Note: We need to determine the record type based on existing fields

INSERT INTO interview_feedbacks (
    candidate_id,
    position_id,
    interviewer,
    interviewer_type,
    interview_date,
    comments,
    interview_rating,
    ai_rating,
    new_status,
    is_deleted,
    created_at
)
SELECT
    candidate_id,
    position_id,
    COALESCE(interviewer, '00000000-0000-0000-0000-000000000000'::UUID) as interviewer,
    CASE
        WHEN interviewer IS NULL THEN 'system'
        ELSE 'user'
    END as interviewer_type,
    COALESCE(interview_date, created_at::date) as interview_date,
    COALESCE(comments, '') as comments,
    CASE
        WHEN is_status_change = false AND rating IS NOT NULL THEN rating
        ELSE NULL
    END as interview_rating,
    NULL as ai_rating,  -- No existing AI ratings to migrate
    CASE
        WHEN is_status_change = true THEN new_status
        ELSE NULL
    END as new_status,
    is_deleted,
    created_at
FROM interview_feedbacks_backup;

COMMENT ON TABLE interview_feedbacks_backup IS 'Backup completed. Data migrated to new schema.';


-- ============================================================================
-- STEP 5: Re-enable RLS
-- ============================================================================

ALTER TABLE interview_feedbacks ENABLE ROW LEVEL SECURITY;

-- Interview Feedbacks: org isolation via parent candidate table
CREATE POLICY "interview_feedbacks_org_isolation" ON interview_feedbacks
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM candidates c
            WHERE c.id = interview_feedbacks.candidate_id
              AND c.org_id = current_org_id()
        )
    );


-- ============================================================================
-- STEP 6: Create helper function for record type validation
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_interview_feedback_type()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure exactly one of the three type fields is non-NULL
    IF (
        (NEW.interview_rating IS NOT NULL AND NEW.ai_rating IS NULL AND NEW.new_status IS NULL) OR
        (NEW.interview_rating IS NULL AND NEW.ai_rating IS NOT NULL AND NEW.new_status IS NULL) OR
        (NEW.interview_rating IS NULL AND NEW.ai_rating IS NULL AND NEW.new_status IS NOT NULL)
    ) THEN
        RETURN NEW;
    ELSE
        RAISE EXCEPTION 'Exactly one of interview_rating, ai_rating, or new_status must be non-NULL';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Optional: Add trigger to enforce mutual exclusivity at database level
-- Uncomment if you want database-level validation (recommended for data integrity)
-- CREATE TRIGGER trigger_validate_interview_feedback_type
--     BEFORE INSERT OR UPDATE ON interview_feedbacks
--     FOR EACH ROW
--     EXECUTE FUNCTION validate_interview_feedback_type();


-- ============================================================================
-- STEP 7: Update schema_v2.sql for consistency
-- ============================================================================

-- This migration should be reflected in schema_v2.sql
-- Run this migration, then update schema_v2.sql to match


-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Verification queries
-- SELECT COUNT(*) FROM interview_feedbacks_backup;
-- SELECT COUNT(*) FROM interview_feedbacks;
-- SELECT interviewer_type, COUNT(*) FROM interview_feedbacks GROUP BY interviewer_type;
-- SELECT
--     COUNT(*) FILTER (WHERE interview_rating IS NOT NULL) as interview_count,
--     COUNT(*) FILTER (WHERE ai_rating IS NOT NULL) as ai_count,
--     COUNT(*) FILTER (WHERE new_status IS NOT NULL) as status_count
-- FROM interview_feedbacks;
