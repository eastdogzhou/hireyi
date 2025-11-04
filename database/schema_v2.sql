-- AI Resume Scanning System - Database Schema with Authentication & Organizations
-- ============================================================================
-- Version: 2.0
-- Last Updated: 2025-01-27
-- Description: Complete database schema with Supabase Auth and multi-tenant organization support
-- Changelog:
--   v2.0 (2025-01-27): Added authentication and organization management
--     - Added organizations table with 6-digit org code
--     - Added org_members table with approval workflow
--     - Updated users table to link with auth.users
--     - Added org_id to all business tables
--     - Enabled RLS policies for data isolation
--   v1.4 (2025-01-25): Changed candidate global score from 4-point to 10-point scale
--   v1.3 (2025-01-25): Fixed rating constraint to 4-point scale
--   v1.2 (2025-10-22): Made position_id nullable in interview_feedbacks
--   v1.1 (2025-10-22): Added resume_text, work_experience, education_background
--   v1.0 (2025-10-16): Initial schema
-- ============================================================================

-- ============================================================================
-- 0. CLEANUP (for idempotency)
-- ============================================================================

-- Drop views first
DROP VIEW IF EXISTS position_candidates_active CASCADE;
DROP VIEW IF EXISTS positions_active CASCADE;
DROP VIEW IF EXISTS candidates_active CASCADE;

-- Drop tables (CASCADE will drop triggers and constraints)
DROP TABLE IF EXISTS interview_feedbacks CASCADE;
DROP TABLE IF EXISTS position_candidates CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS org_members CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS current_org_id() CASCADE;
DROP FUNCTION IF EXISTS generate_org_code() CASCADE;
DROP FUNCTION IF EXISTS update_position_candidates_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_positions_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_candidates_updated_at() CASCADE;


-- ============================================================================
-- 1. AUTHENTICATION & ORGANIZATION TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Organizations Table
-- Multi-tenant organization management
-- ----------------------------------------------------------------------------
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    org_code VARCHAR(6) UNIQUE NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE organizations IS 'Organizations for multi-tenant data isolation';
COMMENT ON COLUMN organizations.name IS 'Organization name, default format: {username}的组织';
COMMENT ON COLUMN organizations.org_code IS '6-digit unique organization code for joining';
COMMENT ON COLUMN organizations.created_by IS 'User ID who created this organization (becomes first admin)';

CREATE INDEX idx_organizations_created_by ON organizations(created_by);
CREATE INDEX idx_organizations_org_code ON organizations(org_code);


-- ----------------------------------------------------------------------------
-- Organization Members Table
-- Manages organization membership with role-based access control
-- ----------------------------------------------------------------------------
CREATE TABLE org_members (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'pending' CHECK (role IN ('creator', 'admin', 'interviewer', 'pending')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    UNIQUE(org_id, user_id)
);

COMMENT ON TABLE org_members IS 'Organization membership with role-based access control';
COMMENT ON COLUMN org_members.role IS 'creator: organization creator (only 1), admin: HR manager, interviewer: limited access to positions, pending: awaiting approval';
COMMENT ON COLUMN org_members.requested_at IS 'When the user requested to join';
COMMENT ON COLUMN org_members.approved_at IS 'When the request was approved (for creator/admin/interviewer roles)';
COMMENT ON COLUMN org_members.approved_by IS 'Admin/creator who approved the request';

CREATE INDEX idx_org_members_user_id ON org_members(user_id);
CREATE INDEX idx_org_members_org_id_role ON org_members(org_id, role);
CREATE INDEX idx_org_members_role ON org_members(role);


-- ----------------------------------------------------------------------------
-- Users Table (Profile)
-- Links Supabase Auth users with application profile and current organization
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    current_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'User profiles linked to Supabase Auth';
COMMENT ON COLUMN users.id IS 'References auth.users(id) for Supabase Auth integration';
COMMENT ON COLUMN users.current_org_id IS 'Currently selected organization (user can be member of multiple)';

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_current_org_id ON users(current_org_id);


-- ============================================================================
-- 2. BUSINESS TABLES (with org_id for multi-tenancy)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Candidates Table
-- Stores all candidate information with AI-extracted data
-- ----------------------------------------------------------------------------
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE candidates IS 'Candidate/talent pool with AI-extracted structured data (multi-tenant)';
COMMENT ON COLUMN candidates.org_id IS 'Organization this candidate belongs to (for data isolation)';
COMMENT ON COLUMN candidates.score IS 'Global comprehensive score (0-10 scale)';

-- Candidates indexes
CREATE INDEX idx_candidates_org_id ON candidates(org_id);
CREATE INDEX idx_candidates_name ON candidates(name);
CREATE INDEX idx_candidates_phone ON candidates(phone);
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_skills ON candidates USING GIN(skills);
CREATE INDEX idx_candidates_resume_text ON candidates USING GIN(to_tsvector('english', resume_text));
CREATE INDEX idx_candidates_score ON candidates(score);
CREATE INDEX idx_candidates_is_deleted ON candidates(is_deleted);
CREATE INDEX idx_candidates_created_at ON candidates(created_at DESC);
CREATE INDEX idx_candidates_org_created ON candidates(org_id, created_at DESC);


-- ----------------------------------------------------------------------------
-- Positions Table
-- Job positions with requirements
-- ----------------------------------------------------------------------------
CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    department VARCHAR(100),
    jd TEXT NOT NULL,
    requirements JSONB,
    status VARCHAR(20) DEFAULT 'open',
    created_by UUID REFERENCES users(id),
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE positions IS 'Job positions with requirements and JD (multi-tenant)';
COMMENT ON COLUMN positions.org_id IS 'Organization this position belongs to';
COMMENT ON COLUMN positions.created_by IS 'User UUID who created this position';

-- Positions indexes
CREATE INDEX idx_positions_org_id ON positions(org_id);
CREATE INDEX idx_positions_title ON positions(title);
CREATE INDEX idx_positions_status ON positions(status);
CREATE INDEX idx_positions_created_by ON positions(created_by);
CREATE INDEX idx_positions_is_deleted ON positions(is_deleted);
CREATE INDEX idx_positions_created_at ON positions(created_at DESC);
CREATE INDEX idx_positions_org_created ON positions(org_id, created_at DESC);


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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(position_id, candidate_id)
);

COMMENT ON TABLE position_candidates IS 'M2M relationship between positions and candidates with scoring';
COMMENT ON COLUMN position_candidates.current_status IS 'Status: screening, interview, offer, hired, rejected, withdrawn';

-- Position Candidates indexes
CREATE INDEX idx_position_candidates_position ON position_candidates(position_id);
CREATE INDEX idx_position_candidates_candidate ON position_candidates(candidate_id);
CREATE INDEX idx_position_candidates_status ON position_candidates(current_status);
CREATE INDEX idx_position_candidates_score_numeric ON position_candidates(overall_score_numeric DESC);
CREATE INDEX idx_position_candidates_is_deleted ON position_candidates(is_deleted);
CREATE INDEX idx_position_candidates_updated_at ON position_candidates(updated_at DESC);


-- ----------------------------------------------------------------------------
-- Interview Feedbacks Table
-- Unified table for interview evaluations, AI evaluations, and status/log records
-- v2.0: Refactored to support three mutually exclusive record types
-- ----------------------------------------------------------------------------
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

-- Interview Feedbacks indexes
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
-- 3. UNIQUE CONSTRAINTS
-- ============================================================================

-- Ensure only one creator per organization
CREATE UNIQUE INDEX idx_org_members_unique_creator
ON org_members(org_id)
WHERE role = 'creator';

COMMENT ON INDEX idx_org_members_unique_creator IS 'Ensures each organization has exactly one creator';

-- Candidate uniqueness per organization
CREATE UNIQUE INDEX idx_candidates_unique_name_phone_org
ON candidates(org_id, name, phone)
WHERE is_deleted = false AND phone IS NOT NULL;

CREATE UNIQUE INDEX idx_candidates_unique_resume_md5_org
ON candidates(org_id, resume_md5)
WHERE is_deleted = false;


-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Generate 6-digit alphanumeric organization code
CREATE OR REPLACE FUNCTION generate_org_code()
RETURNS VARCHAR(6) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude confusing: 0,O,1,I
    result VARCHAR(6) := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_org_code IS 'Generates a 6-digit alphanumeric code for organization joining';


-- Get current user's organization ID from their profile
CREATE OR REPLACE FUNCTION current_org_id()
RETURNS UUID AS $$
  SELECT current_org_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION current_org_id IS 'Returns the current user''s selected organization ID';


-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Auto-generate org_code on organization creation
CREATE OR REPLACE FUNCTION set_org_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.org_code IS NULL OR NEW.org_code = '' THEN
        NEW.org_code := generate_org_code();

        -- Ensure uniqueness (retry if collision)
        WHILE EXISTS (SELECT 1 FROM organizations WHERE org_code = NEW.org_code) LOOP
            NEW.org_code := generate_org_code();
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_org_code
    BEFORE INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION set_org_code();


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


-- Auto-update updated_at timestamp for organizations
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_organizations_updated_at();


-- Auto-update updated_at timestamp for users
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();


-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables with org_id
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 7. RLS POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Users Policies
-- ----------------------------------------------------------------------------
-- Users can view their own profile
CREATE POLICY "users_view_own" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
    FOR UPDATE
    USING (auth.uid() = id);


-- ----------------------------------------------------------------------------
-- Organizations Policies
-- ----------------------------------------------------------------------------
-- Users can view organizations they are approved members of (not pending)
CREATE POLICY "org_view_member" ON organizations
    FOR SELECT
    USING (
        id IN (
            SELECT org_id FROM org_members
            WHERE user_id = auth.uid() AND role != 'pending'
        )
    );

-- Users can create new organizations
CREATE POLICY "org_create" ON organizations
    FOR INSERT
    WITH CHECK (created_by = auth.uid());


-- ----------------------------------------------------------------------------
-- Org Members Policies
-- ----------------------------------------------------------------------------
-- Users can view memberships of their organizations (only approved members)
CREATE POLICY "members_view_org" ON org_members
    FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM org_members
            WHERE user_id = auth.uid() AND role != 'pending'
        )
    );

-- Users can request to join organizations
CREATE POLICY "members_request" ON org_members
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Admins and creators can manage members
CREATE POLICY "members_admin_manage" ON org_members
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM org_members
            WHERE org_id = org_members.org_id
              AND user_id = auth.uid()
              AND role IN ('creator', 'admin')
        )
    );


-- ----------------------------------------------------------------------------
-- Business Tables Policies (Org Isolation)
-- ----------------------------------------------------------------------------

-- Candidates: org isolation
CREATE POLICY "candidates_org_isolation" ON candidates
    FOR ALL
    USING (org_id = current_org_id())
    WITH CHECK (org_id = current_org_id());

-- Positions: org isolation
CREATE POLICY "positions_org_isolation" ON positions
    FOR ALL
    USING (org_id = current_org_id())
    WITH CHECK (org_id = current_org_id());

-- Position Candidates: via parent tables
CREATE POLICY "position_candidates_org_isolation" ON position_candidates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM positions p
            WHERE p.id = position_candidates.position_id
              AND p.org_id = current_org_id()
        )
    );

-- Interview Feedbacks: via parent tables
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
-- 8. VIEWS (Optional - for easier querying)
-- ============================================================================

-- Active candidates view
CREATE VIEW candidates_active AS
SELECT * FROM candidates WHERE is_deleted = false;

-- Active positions view
CREATE VIEW positions_active AS
SELECT * FROM positions WHERE is_deleted = false;

-- Active position_candidates view
CREATE VIEW position_candidates_active AS
SELECT * FROM position_candidates WHERE is_deleted = false;


-- ============================================================================
-- END OF SCHEMA v2.0
-- ============================================================================
