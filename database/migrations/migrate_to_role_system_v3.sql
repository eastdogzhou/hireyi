-- ============================================================================
-- Migration Script: Role System v3.0
-- ============================================================================
-- Description: Migrate from status-based approval workflow to role-based access control
-- From: role IN ('admin', 'member') + status IN ('pending', 'approved', 'rejected')
-- To: role IN ('creator', 'admin', 'interviewer', 'pending')
--
-- Date: 2025-01-29
-- ============================================================================

BEGIN;

-- ============================================================================
-- Step 1: Add new role values temporarily (for transition)
-- ============================================================================
ALTER TABLE org_members DROP CONSTRAINT IF EXISTS org_members_role_check;
ALTER TABLE org_members ADD CONSTRAINT org_members_role_check_temp
    CHECK (role IN ('admin', 'member', 'creator', 'interviewer', 'pending'));

-- ============================================================================
-- Step 2: Migrate existing data
-- ============================================================================

-- 2.1: Set creators (organization creator with admin role and approved status)
UPDATE org_members om
SET role = 'creator',
    approved_at = COALESCE(approved_at, requested_at),
    approved_by = COALESCE(approved_by, om.user_id)
FROM organizations o
WHERE om.org_id = o.id
  AND om.user_id = o.created_by
  AND om.role = 'admin'
  AND om.status = 'approved';

-- 2.2: Convert approved admins (not creators) to admin role
UPDATE org_members
SET role = 'admin',
    approved_at = COALESCE(approved_at, requested_at)
WHERE role = 'admin'
  AND status = 'approved'
  AND role != 'creator';  -- Skip already-set creators

-- 2.3: Convert approved members to interviewer role
UPDATE org_members
SET role = 'interviewer',
    approved_at = COALESCE(approved_at, requested_at)
WHERE role = 'member'
  AND status = 'approved';

-- 2.4: Convert pending members to pending role
UPDATE org_members
SET role = 'pending'
WHERE status = 'pending';

-- 2.5: Handle rejected members (convert to pending for re-review)
UPDATE org_members
SET role = 'pending'
WHERE status = 'rejected';

-- ============================================================================
-- Step 3: Drop old RLS policies BEFORE dropping status column
-- ============================================================================
-- These policies depend on the status column, so drop them first
DROP POLICY IF EXISTS "org_view_member" ON organizations;
DROP POLICY IF EXISTS "members_view_org" ON org_members;
DROP POLICY IF EXISTS "members_admin_manage" ON org_members;

-- ============================================================================
-- Step 4: Drop status column (now safe to drop)
-- ============================================================================
ALTER TABLE org_members DROP COLUMN IF EXISTS status;

-- ============================================================================
-- Step 5: Update role constraint to final values
-- ============================================================================
ALTER TABLE org_members DROP CONSTRAINT IF EXISTS org_members_role_check_temp;
ALTER TABLE org_members ADD CONSTRAINT org_members_role_check
    CHECK (role IN ('creator', 'admin', 'interviewer', 'pending'));

-- ============================================================================
-- Step 6: Update indexes
-- ============================================================================
DROP INDEX IF EXISTS idx_org_members_org_id_status;
CREATE INDEX IF NOT EXISTS idx_org_members_org_id_role ON org_members(org_id, role);

-- ============================================================================
-- Step 7: Add unique creator constraint
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_members_unique_creator
ON org_members(org_id)
WHERE role = 'creator';

-- ============================================================================
-- Step 8: Recreate RLS policies with new role-based logic
-- ============================================================================

-- Recreate with new role-based logic
CREATE POLICY "org_view_member" ON organizations
    FOR SELECT
    USING (
        id IN (
            SELECT org_id FROM org_members
            WHERE user_id = auth.uid() AND role != 'pending'
        )
    );

CREATE POLICY "members_view_org" ON org_members
    FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM org_members
            WHERE user_id = auth.uid() AND role != 'pending'
        )
    );

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

-- ============================================================================
-- Step 9: Verification
-- ============================================================================

-- Count creators per organization (should all be 1)
DO $$
DECLARE
    invalid_org_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT org_id) INTO invalid_org_count
    FROM org_members
    WHERE role = 'creator'
    GROUP BY org_id
    HAVING COUNT(*) != 1;

    IF invalid_org_count > 0 THEN
        RAISE EXCEPTION 'Migration validation failed: % organizations have != 1 creator', invalid_org_count;
    ELSE
        RAISE NOTICE 'Migration validation passed: All organizations have exactly 1 creator';
    END IF;
END $$;

-- Report migration statistics
DO $$
DECLARE
    creator_count INTEGER;
    admin_count INTEGER;
    interviewer_count INTEGER;
    pending_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO creator_count FROM org_members WHERE role = 'creator';
    SELECT COUNT(*) INTO admin_count FROM org_members WHERE role = 'admin';
    SELECT COUNT(*) INTO interviewer_count FROM org_members WHERE role = 'interviewer';
    SELECT COUNT(*) INTO pending_count FROM org_members WHERE role = 'pending';

    RAISE NOTICE '=== Migration Statistics ===';
    RAISE NOTICE 'Creators: %', creator_count;
    RAISE NOTICE 'Admins: %', admin_count;
    RAISE NOTICE 'Interviewers: %', interviewer_count;
    RAISE NOTICE 'Pending: %', pending_count;
    RAISE NOTICE 'Total members: %', creator_count + admin_count + interviewer_count + pending_count;
END $$;

COMMIT;

-- ============================================================================
-- Migration Complete
-- ============================================================================
