-- AI Resume Scanning System - Database Schema
-- ============================================================================
-- Version: 1.4
-- Last Updated: 2025-01-25
-- Description: Complete database schema for the AI-powered resume screening platform
-- Changelog:
--   v1.4 (2025-01-25): Changed candidate global score from 4-point (1-4) to 10-point (0-10) scale
--   v1.3 (2025-01-25): Fixed rating constraint to 4-point scale (1-4), updated to match PRD
--   v1.2 (2025-10-22): Made position_id nullable in interview_feedbacks table
--   v1.1 (2025-10-22): Added resume_text, work_experience, education_background fields
--   v1.0 (2025-10-16): Initial schema
-- ============================================================================

-- ============================================================================
-- 0. CLEANUP (for idempotency)
-- ============================================================================
-- This section ensures the script can be run multiple times safely

-- Drop views first (depend on tables)
DROP VIEW IF EXISTS position_candidates_active CASCADE;
DROP VIEW IF EXISTS positions_active CASCADE;
DROP VIEW IF EXISTS candidates_active CASCADE;

-- Drop tables first (CASCADE will automatically drop triggers and constraints)
-- Order: drop tables with foreign keys first
DROP TABLE IF EXISTS interview_feedbacks CASCADE;
DROP TABLE IF EXISTS position_candidates CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions (after tables are dropped)
DROP FUNCTION IF EXISTS update_position_candidates_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_positions_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_candidates_updated_at() CASCADE;


-- ============================================================================
-- 1. CORE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Users Table
-- Basic user CRUD (no authentication in MVP phase)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'recruiter',
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'System users (MVP: basic CRUD only, no auth)';
COMMENT ON COLUMN users.role IS 'User role: recruiter, admin, etc.';
COMMENT ON COLUMN users.is_deleted IS 'Soft delete flag';


-- ----------------------------------------------------------------------------
-- Candidates Table
-- Stores all candidate information with AI-extracted data
-- ----------------------------------------------------------------------------
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    skills TEXT[] DEFAULT '{}',
    highlights TEXT,
    years_of_experience INTEGER,
    education_level VARCHAR(50),
    recent_company VARCHAR(200),
    recent_position VARCHAR(200),
    resume_text TEXT,
    work_experience TEXT,
    education_background TEXT,
    score INTEGER CHECK (score >= 0 AND score <= 10),
    resume_file VARCHAR(500) NOT NULL,
    resume_md5 VARCHAR(32) NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE candidates IS 'Candidate/talent pool with AI-extracted structured data';
COMMENT ON COLUMN candidates.phone IS 'Phone number (optional, used for uniqueness)';
COMMENT ON COLUMN candidates.email IS 'Email address (optional)';
COMMENT ON COLUMN candidates.years_of_experience IS 'Total years of work experience';
COMMENT ON COLUMN candidates.education_level IS 'Highest education level (本科/硕士/博士/大专)';
COMMENT ON COLUMN candidates.recent_company IS 'Most recent company name';
COMMENT ON COLUMN candidates.recent_position IS 'Most recent position title';
COMMENT ON COLUMN candidates.resume_text IS 'Full resume text content extracted by PyMuPDF (for search and matching)';
COMMENT ON COLUMN candidates.work_experience IS 'Work experience formatted as text (2 lines per entry: time+company+position, then summary)';
COMMENT ON COLUMN candidates.education_background IS 'Education background formatted as text (2 lines per entry: time+school+degree, then key learnings)';
COMMENT ON COLUMN candidates.score IS 'Global comprehensive score (0-10 scale) based on resume content, evaluated by LLM across 6 dimensions: school, major, degree, GPA, AI experience, competition';
COMMENT ON COLUMN candidates.resume_file IS 'Aliyun OSS file path';
COMMENT ON COLUMN candidates.resume_md5 IS 'MD5 hash of resume file for uniqueness checking';
COMMENT ON COLUMN candidates.is_deleted IS 'Soft delete flag';


-- ----------------------------------------------------------------------------
-- Positions Table
-- Job positions with requirements
-- ----------------------------------------------------------------------------
CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    department VARCHAR(100),
    jd TEXT NOT NULL,
    requirements JSONB,
    status VARCHAR(20) DEFAULT 'open',
    created_by INTEGER REFERENCES users(id),
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE positions IS 'Job positions with requirements and JD';
COMMENT ON COLUMN positions.jd IS 'Job Description';
COMMENT ON COLUMN positions.requirements IS 'Structured requirements (skills, experience, etc.)';
COMMENT ON COLUMN positions.status IS 'Position status: open, closed';
COMMENT ON COLUMN positions.created_by IS 'User ID who created this position';
COMMENT ON COLUMN positions.is_deleted IS 'Soft delete flag';


-- ----------------------------------------------------------------------------
-- Position Candidates (M2M Relationship with Scoring)
-- Links candidates to positions with AI-generated match scores
-- ----------------------------------------------------------------------------
CREATE TABLE position_candidates (
    id SERIAL PRIMARY KEY,
    position_id INTEGER REFERENCES positions(id) ON DELETE CASCADE,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    relevance_score INTEGER CHECK (relevance_score >= 1 AND relevance_score <= 4),
    fit_score INTEGER CHECK (fit_score >= 1 AND fit_score <= 4),
    overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 4),
    overall_score_numeric INTEGER CHECK (overall_score_numeric >= 0 AND overall_score_numeric <= 100),
    current_status VARCHAR(20) DEFAULT 'screening',
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(position_id, candidate_id)
);

COMMENT ON TABLE position_candidates IS 'M2M relationship between positions and candidates with scoring';
COMMENT ON COLUMN position_candidates.relevance_score IS 'Skills relevance score (1-4 scale, for display)';
COMMENT ON COLUMN position_candidates.fit_score IS 'Experience fit score (1-4 scale, for display)';
COMMENT ON COLUMN position_candidates.overall_score IS 'Overall match score (1-4 scale, for display)';
COMMENT ON COLUMN position_candidates.overall_score_numeric IS 'Overall score numeric (0-100, for sorting)';
COMMENT ON COLUMN position_candidates.current_status IS 'Status: screening, interview, offer, hired, rejected, withdrawn';
COMMENT ON COLUMN position_candidates.is_deleted IS 'Soft delete flag';


-- ----------------------------------------------------------------------------
-- Interview Feedbacks Table
-- Execution records: interview evaluations, status changes, and system events
-- ----------------------------------------------------------------------------
CREATE TABLE interview_feedbacks (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    position_id INTEGER REFERENCES positions(id) ON DELETE CASCADE,  -- Nullable: allows candidate-level records
    interviewer INTEGER REFERENCES users(id),  -- Nullable: NULL for system events
    rating INTEGER CHECK (rating >= 1 AND rating <= 4),
    comments TEXT,
    interview_date DATE,
    new_status VARCHAR(20),
    is_status_change BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE interview_feedbacks IS 'Execution records: interview evaluations, status changes, position associations, and system events';
COMMENT ON COLUMN interview_feedbacks.candidate_id IS 'Candidate ID (required for all records)';
COMMENT ON COLUMN interview_feedbacks.position_id IS 'Position ID (optional, NULL for candidate-level records)';
COMMENT ON COLUMN interview_feedbacks.interviewer IS 'Interviewer/operator user ID (NULL for system events)';
COMMENT ON COLUMN interview_feedbacks.rating IS 'Interview rating (1-4, 4-point scale), NULL for non-interview records';
COMMENT ON COLUMN interview_feedbacks.comments IS 'Record description: feedback, status reason, or event description';
COMMENT ON COLUMN interview_feedbacks.interview_date IS 'Interview date, NULL for non-interview records';
COMMENT ON COLUMN interview_feedbacks.new_status IS 'New status for status change records';
COMMENT ON COLUMN interview_feedbacks.is_status_change IS 'True if this is a status change record';
COMMENT ON COLUMN interview_feedbacks.is_deleted IS 'Soft delete flag';


-- ============================================================================
-- 2. INDEXES
-- ============================================================================

-- Candidates indexes
CREATE INDEX idx_candidates_name ON candidates(name);
CREATE INDEX idx_candidates_phone ON candidates(phone);
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_skills ON candidates USING GIN(skills);
CREATE INDEX idx_candidates_resume_text ON candidates USING GIN(to_tsvector('english', resume_text));
CREATE INDEX idx_candidates_score ON candidates(score);
CREATE INDEX idx_candidates_is_deleted ON candidates(is_deleted);
CREATE INDEX idx_candidates_created_at ON candidates(created_at DESC);

-- Positions indexes
CREATE INDEX idx_positions_title ON positions(title);
CREATE INDEX idx_positions_status ON positions(status);
CREATE INDEX idx_positions_created_by ON positions(created_by);
CREATE INDEX idx_positions_is_deleted ON positions(is_deleted);
CREATE INDEX idx_positions_created_at ON positions(created_at DESC);

-- Position Candidates indexes
CREATE INDEX idx_position_candidates_position ON position_candidates(position_id);
CREATE INDEX idx_position_candidates_candidate ON position_candidates(candidate_id);
CREATE INDEX idx_position_candidates_status ON position_candidates(current_status);
CREATE INDEX idx_position_candidates_score_numeric ON position_candidates(overall_score_numeric DESC);
CREATE INDEX idx_position_candidates_is_deleted ON position_candidates(is_deleted);
CREATE INDEX idx_position_candidates_updated_at ON position_candidates(updated_at DESC);

-- Interview Feedbacks indexes
CREATE INDEX idx_interview_feedbacks_candidate ON interview_feedbacks(candidate_id);
CREATE INDEX idx_interview_feedbacks_position ON interview_feedbacks(position_id);
CREATE INDEX idx_interview_feedbacks_interviewer ON interview_feedbacks(interviewer);
CREATE INDEX idx_interview_feedbacks_status_change ON interview_feedbacks(is_status_change);
CREATE INDEX idx_interview_feedbacks_is_deleted ON interview_feedbacks(is_deleted);
CREATE INDEX idx_interview_feedbacks_created_at ON interview_feedbacks(created_at);

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_deleted ON users(is_deleted);


-- ============================================================================
-- 3. UNIQUE CONSTRAINTS
-- ============================================================================

-- Candidate uniqueness constraints (two-level strategy)
-- Priority 1: name + phone (if phone is not null)
CREATE UNIQUE INDEX idx_candidates_unique_name_phone
ON candidates(name, phone)
WHERE is_deleted = false AND phone IS NOT NULL;

-- Priority 2: resume_md5 (always checked)
CREATE UNIQUE INDEX idx_candidates_unique_resume_md5
ON candidates(resume_md5)
WHERE is_deleted = false;


-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp for candidates
CREATE OR REPLACE FUNCTION update_candidates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_candidates_updated_at();


-- Auto-update updated_at timestamp for positions
CREATE OR REPLACE FUNCTION update_positions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_positions_updated_at
    BEFORE UPDATE ON positions
    FOR EACH ROW
    EXECUTE FUNCTION update_positions_updated_at();


-- Auto-update updated_at timestamp for position_candidates
CREATE OR REPLACE FUNCTION update_position_candidates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_position_candidates_updated_at
    BEFORE UPDATE ON position_candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_position_candidates_updated_at();


-- ============================================================================
-- 5. VIEWS (Optional - for easier querying)
-- ============================================================================

-- Active candidates view (auto-filter soft deleted)
CREATE VIEW candidates_active AS
SELECT * FROM candidates WHERE is_deleted = false;

-- Active positions view
CREATE VIEW positions_active AS
SELECT * FROM positions WHERE is_deleted = false;

-- Active position_candidates view
CREATE VIEW position_candidates_active AS
SELECT * FROM position_candidates WHERE is_deleted = false;


-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Note: RLS is DISABLED for MVP phase as per product decision
-- Enable in future phases for proper access control

-- Disable RLS for all tables
ALTER TABLE candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE position_candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE interview_feedbacks DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;


-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
