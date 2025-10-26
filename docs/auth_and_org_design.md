# Authentication & Organization Management Design

**Version**: 2.0
**Date**: 2025-01-23
**Status**: Proposal (Updated with Simplified Design)

## 1. Overview

This document describes a **simplified** design for adding user authentication and multi-tenant organization management to the AI Resume Screening System using Supabase native solutions.

### 1.1 Design Principles

Following `docs/rule.md` **Minimal Design Principle**:
- Simple, straightforward solutions over complex architectures
- Avoid abstractions not immediately necessary
- Direct solutions over framework-heavy approaches
- Start with simplest working solution

### 1.2 Goals

- Enable user authentication with email/password
- Support organization creation and membership
- Simple admin/member role management (max 3 admins per org)
- Data isolation via Row Level Security (RLS)
- Zero migration complexity (clean slate approach)

### 1.3 Non-Goals

- Social login - not needed for MVP
- SAML/SSO - enterprise feature for later
- Complex permission system - just admin/member is enough
- Organization deletion/archival - manual process for now
- Invitation via email - use organization ID for now

## 2. Architecture Overview

### 2.1 Technology Stack

- **Authentication**: Supabase Auth (JWT-based)
- **Authorization**: PostgreSQL Row Level Security (RLS)
- **Multi-Tenancy**: Shared database with `org_id` column pattern
- **Frontend State**: React Context + Supabase client
- **Backend**: FastAPI with Supabase JWT validation

### 2.2 Simplified Multi-Tenancy

- Each table gets an `org_id` column
- RLS policies check `org_id` matches user's organization
- No complex hierarchy or nested permissions
- Simple and effective for our scale

## 3. Database Schema Changes

### 3.1 New Tables

#### 3.1.1 `organizations` Table (Simplified)

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,  -- e.g., "张三个人组织"
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organizations_created_by ON organizations(created_by);

COMMENT ON TABLE organizations IS 'Organizations for multi-tenant data isolation';
COMMENT ON COLUMN organizations.name IS 'Organization name, default format: {username}个人组织';
```

#### 3.1.2 `org_members` Table (with Approval Flow)

```sql
CREATE TABLE org_members (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),

    UNIQUE(org_id, user_id)  -- One membership per user per org
);

CREATE INDEX idx_org_members_user_id ON org_members(user_id);
CREATE INDEX idx_org_members_org_id_status ON org_members(org_id, status);

COMMENT ON TABLE org_members IS 'Organization membership with approval flow';
COMMENT ON COLUMN org_members.role IS 'admin: can approve/reject members (max 3), member: regular access';
COMMENT ON COLUMN org_members.status IS 'pending: awaiting approval, approved: active member, rejected: denied access';
```

#### 3.1.3 Simplified `users` Table

```sql
-- Drop old users table and create fresh one (no migration needed)
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    current_org_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_current_org_id ON users(current_org_id);

COMMENT ON TABLE users IS 'User profiles linked to Supabase Auth';
COMMENT ON COLUMN users.current_org_id IS 'Currently selected organization';
```

### 3.2 Clean Slate Approach (No Migration)

Since we can clear existing data, **recreate all tables with `org_id`**:

```sql
-- Drop all existing tables
DROP TABLE IF EXISTS interview_feedbacks CASCADE;
DROP TABLE IF EXISTS position_candidates CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;

-- Recreate with org_id (simplified example for candidates)
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    -- ... other existing fields ...
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_candidates_org_id ON candidates(org_id, created_at DESC);

-- Similar pattern for positions, position_candidates, interview_feedbacks
```

**Benefit**: Clean schema, no legacy fields, optimal indexes from the start.

## 4. Simplified RLS Policies

### 4.1 Core Principle

One simple rule: **Users can only access data from their current organization**.

### 4.2 Helper Function (Only One Needed)

```sql
-- Get current user's org_id from their profile
CREATE OR REPLACE FUNCTION auth.current_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT current_org_id FROM users WHERE id = auth.uid();
$$;
```

### 4.3 Simple RLS Pattern (Same for All Tables)

```sql
-- Enable RLS
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Universal policy pattern for all tables with org_id
CREATE POLICY "org_isolation" ON candidates
FOR ALL USING (org_id = auth.current_org_id());

-- Apply same pattern to: positions, position_candidates, interview_feedbacks
```

**That's it!** One policy per table. Simple and effective.

### 4.4 Special Cases

```sql
-- Organizations: Users can see their orgs
CREATE POLICY "view_member_orgs" ON organizations
FOR SELECT USING (
  id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

-- Org members: Admins can manage
CREATE POLICY "admin_manage_members" ON org_members
FOR ALL USING (
  org_id = auth.current_org_id()
  AND EXISTS (
    SELECT 1 FROM org_members
    WHERE user_id = auth.uid()
      AND org_id = org_members.org_id
      AND role = 'admin'
      AND status = 'approved'
  )
);
```

## 5. Authentication Flow

### 5.1 User Registration (Two Options)

**Option A: Create Personal Organization**
1. User signs up with email, password, name
2. System creates organization named "{name}个人组织"
3. User becomes admin of their organization
4. Can start using the system immediately

**Option B: Join Existing Organization**
1. User signs up with email, password, name
2. User enters organization ID (provided by org admin)
3. System creates pending membership request
4. Waits for admin approval before accessing data

**Registration API**:
```python
@router.post("/register")
async def register(request: RegisterRequest):
    # 1. Create Supabase auth user
    auth_user = supabase.auth.sign_up(email, password)

    # 2. Create user profile
    user = create_user_profile(auth_user.id, name, email)

    # 3. Handle organization
    if request.org_id:
        # Option B: Request to join
        create_membership_request(request.org_id, auth_user.id)
        return {"status": "pending_approval"}
    else:
        # Option A: Create personal org
        org = create_organization(f"{name}个人组织", auth_user.id)
        create_membership(org.id, auth_user.id, role="admin", status="approved")
        update_user_current_org(auth_user.id, org.id)
        return {"status": "active", "org_id": org.id}
```

### 5.2 User Login (Simplified)

1. User submits email + password
2. Check if user has approved organization membership
3. If yes: Login successful, load org context
4. If pending: Show "waiting for approval" message
5. If no org: Prompt to create or join organization

### 5.3 Admin Management

**Admin Limits**:
- Maximum 3 admins per organization (including creator)
- Organization creator is automatically first admin
- Admins can promote members to admin (if under limit)
- Admins can approve/reject membership requests

**Admin Capabilities**:
```python
@router.post("/org/approve-member")
async def approve_member(member_id: int, current_user: User):
    # 1. Verify current user is admin
    if not is_admin(current_user.id, org_id):
        raise HTTPException(403, "Not an admin")

    # 2. Approve membership
    update_membership_status(member_id, "approved")

@router.post("/org/promote-admin")
async def promote_to_admin(user_id: UUID, current_user: User):
    # 1. Check admin count
    admin_count = count_admins(org_id)
    if admin_count >= 3:
        raise HTTPException(400, "Maximum 3 admins allowed")

    # 2. Promote member
    update_member_role(user_id, "admin")
```

## 6. Frontend Changes (Minimal)

### 6.1 Essential Pages

```
frontend/src/pages/
├── Login.tsx              # Email + password login
├── Register.tsx           # Registration with org choice
└── PendingApproval.tsx    # "Waiting for approval" page
```

### 6.2 Simple Components

```
frontend/src/components/
├── OrgInfo.tsx           # Display current org name
├── AdminPanel.tsx        # Approve members, manage admins
└── ProtectedRoute.tsx    # Redirect if not logged in
```

### 6.3 Simple Auth Context

```typescript
// Basic auth context to manage user state and org context
const AuthContext = createContext<{
  user: User | null
  orgId: string | null
  isAdmin: boolean
}>()

// Use Supabase client for auth operations
// Store current_org_id in users table, not JWT metadata (simpler)
```

## 7. Backend Changes (Simplified)

### 7.1 Simple Auth Middleware

```python
from fastapi import Depends, HTTPException
from jose import jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Validate JWT and get user ID."""
    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
        return payload["sub"]  # user_id
    except:
        raise HTTPException(401, "Invalid token")

async def get_current_org(user_id: str = Depends(get_current_user)):
    """Get user's current org from database."""
    user = supabase.table("users").select("current_org_id").eq("id", user_id).single()
    return user.data["current_org_id"]
```

### 7.2 Service Layer Pattern

```python
# Simple pattern: inject org_id into all queries
class CandidateService:
    def __init__(self, org_id: str):
        self.org_id = org_id

    def list_candidates(self):
        return supabase.table("candidates").select("*").eq("org_id", self.org_id).execute()

# Usage in API routes
@router.get("/candidates")
async def list_candidates(org_id: str = Depends(get_current_org)):
    service = CandidateService(org_id)
    return service.list_candidates()
```

## 8. Implementation Approach (No Migration Needed)

### 8.1 Clean Slate

Since existing data can be cleared:

```sql
-- 1. Drop all existing tables
DROP TABLE IF EXISTS interview_feedbacks CASCADE;
DROP TABLE IF EXISTS position_candidates CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Create new schema with org support from the start
-- Run the SQL from sections 3.1 and 3.2 above
```

### 8.2 Development Order

1. **Week 1**: Database schema + RLS policies
2. **Week 2**: Backend auth middleware + service updates
3. **Week 3**: Frontend auth pages + protected routes
4. **Week 4**: Admin panel + member management
5. **Week 5**: Testing + polish

## 9. Key Decisions Summary

### 9.1 Design Choices

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Registration** | Two options: Create org OR join existing | Flexible for different user types |
| **Organization ID** | User enters ID, not email invite | Simpler, no email infrastructure needed |
| **Admin Limit** | Max 3 admins per org | Prevents permission sprawl |
| **Data Storage** | `current_org_id` in users table, not JWT | Simpler, easier to update |
| **RLS Pattern** | One simple policy per table | Maintainable, understandable |
| **Migration** | Clean slate, drop existing data | No complex migration logic |

### 9.2 What We're NOT Doing (Intentionally)

- ❌ Email invitations - use org ID instead
- ❌ Complex permission system - just admin/member
- ❌ Organization hierarchy - flat structure only
- ❌ Social login - email/password only for MVP
- ❌ Soft delete with timestamps - boolean flag is enough
- ❌ JWT metadata complexity - store org_id in database

### 9.3 Security Checklist

- ✅ RLS on all tables with org_id
- ✅ JWT validation in backend
- ✅ Admin approval for new members
- ✅ Service role key only for backend
- ✅ Parameterized queries (via Supabase client)

## 10. Questions to Clarify

### 10.1 Organization Management

1. **Can organization creator remove themselves?**
   - Suggestion: No, must transfer ownership first

2. **Can admins demote other admins?**
   - Suggestion: Only org creator can manage admin roles

3. **What happens if all admins leave?**
   - Suggestion: Last admin cannot leave, must delete org

### 10.2 Member Approval

4. **How long do pending requests stay valid?**
   - Suggestion: 30 days, then auto-expire

5. **Can users request to join multiple orgs?**
   - Suggestion: Yes, but only one active membership

6. **Should we notify admins of pending requests?**
   - Suggestion: Show count in UI, no email for MVP

### 10.3 Technical

7. **Use Supabase Edge Functions for triggers?**
   - Suggestion: No, keep logic in backend for simplicity

8. **Store org name in every record for performance?**
   - Suggestion: No, JOIN when needed, avoid denormalization

9. **Add org slug for pretty URLs?**
   - Suggestion: Not needed for MVP, org ID is fine

## 11. Next Steps

1. **Review this simplified design** - confirm it meets requirements
2. **Answer open questions** - make final decisions
3. **Start implementation** - begin with database schema
4. **Test incrementally** - verify each component works before moving on

---

**Note**: This design prioritizes simplicity and quick implementation over feature completeness. We can always add complexity later as needs arise.
