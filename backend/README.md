# AI Resume Scanning System - Backend

> 📅 最后更新: 2025-01-27
> 📊 完成度: 100%
> 🎯 状态: 核心功能与认证系统已完成，可用于生产环境（数据库 Schema v2.0）

AI-powered resume management and talent screening platform backend.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [API Overview](#-api-overview)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Service Layer](#-service-layer)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Architecture](#-architecture)

---

## ✨ Features

### Core Features
- 🔐 **Authentication & Authorization**: JWT-based authentication with Supabase Auth integration
- 🏢 **Multi-tenant Architecture**: Organization-based data isolation with role-based access control (RBAC)
- 🤖 **AI-Powered Resume Parsing**: PyMuPDF for high-quality PDF extraction + LLM for semantic analysis
- 🎯 **Intelligent Job Matching**: LLM-based candidate scoring with relevance and fit dimensions
- 📊 **Candidate Management**: Complete CRUD with search, filtering, and batch operations
- 💼 **Position Management**: Job posting management with status tracking
- 📝 **Interview Feedback**: Multi-round interview evaluations and status change tracking
- 📁 **File Storage**: Aliyun OSS integration for resume file storage
- 🔄 **Unified LLM Integration**: LiteLLM wrapper supporting 100+ model providers
- ⚡ **Async First**: Built with FastAPI and async/await for high performance
- 🔒 **Type Safe**: Full type annotations with basedpyright checking

### API Features
- ✅ **35 REST API Endpoints**: Complete CRUD for all resources with authentication
- ✅ **Authentication Required**: All business APIs protected with JWT authentication
- ✅ **Organization Isolation**: Data automatically scoped to user's organization
- ✅ **Role-Based Access**: Creator, Admin, Interviewer, and Pending roles
- ✅ **Pagination**: All list endpoints support limit/offset pagination
- ✅ **Search & Filter**: Name fuzzy search, skills filtering, status filtering
- ✅ **Batch Upload**: Process multiple resumes with fault tolerance
- ✅ **Soft Delete**: Data preservation with cascade deletion
- ✅ **Auto Documentation**: Swagger UI and ReDoc built-in

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | FastAPI + Uvicorn |
| **Database** | Supabase (PostgreSQL) |
| **AI/LLM** | LiteLLM (OpenAI, DeepSeek, etc.) |
| **PDF Parsing** | PyMuPDF (fitz) |
| **Storage** | Aliyun OSS |
| **Testing** | pytest + pytest-asyncio (135 tests, 78% coverage) |
| **Code Quality** | ruff + basedpyright + pre-commit |
| **Dependency Management** | uv (Python 3.11+) |

---

## 📊 API Overview

The backend provides **35 REST API endpoints** organized into 7 modules:

| Module | Endpoints | Description |
|--------|-----------|-------------|
| **Authentication** | 6 endpoints | User registration, login, token refresh, profile management |
| **Organizations** | 5 endpoints | Organization CRUD, member management, invitations |
| **Candidates** | 7 endpoints | Candidate CRUD, search, upload, batch upload (auth required) |
| **Positions** | 9 endpoints | Position CRUD, search, status management, candidate list, smart screening, score recalculation (auth required) |
| **Interview Feedbacks** | 7 endpoints | Interview evaluations, status changes, candidate execution records (auth required) |
| **Users** | 3 endpoints | User management CRUD (basic, not auth users) |
| **System** | 2 endpoints | Health check, API info |

**API Base URL**: `http://localhost:8000`
**Documentation**:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+**
- **uv** (install: `curl -LsSf https://astral.sh/uv/install.sh | sh`)
- **PyMuPDF dependency** ([PyMuPDF documentation](https://pymupdf.readthedocs.io/))
- **Supabase account** (create at [supabase.com](https://supabase.com))
- **Aliyun OSS bucket** (optional, for file storage)

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd backend

# 2. Install dependencies
uv sync

# 3. Install pre-commit hooks (REQUIRED)
pre-commit install

# 4. Copy environment template
cp .env.example .env

# 5. Edit .env with your credentials
# - Supabase URL and keys
# - LLM API keys (OpenAI, DeepSeek, etc.)
# - Aliyun OSS credentials
```

### Configuration

Edit `.env` with your credentials:

```bash
# ============================================================================
# Supabase Configuration
# ============================================================================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ============================================================================
# LLM Configuration (choose one or more)
# ============================================================================
OPENAI_API_KEY=sk-...
# or
DEEPSEEK_API_KEY=...

# Default model for parsing and matching
DEFAULT_LLM_MODEL=gpt-4o
# or
# DEFAULT_LLM_MODEL=deepseek/deepseek-chat

# ============================================================================
# Aliyun OSS Configuration
# ============================================================================
ALIYUN_OSS_ACCESS_KEY_ID=your-access-key-id
ALIYUN_OSS_ACCESS_KEY_SECRET=your-access-key-secret
ALIYUN_OSS_BUCKET=your-bucket-name
ALIYUN_OSS_ENDPOINT=oss-cn-shanghai.aliyuncs.com

# ============================================================================
# Application Configuration
# ============================================================================
ENVIRONMENT=development
LOG_LEVEL=INFO

# CORS Configuration
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
CORS_ALLOW_CREDENTIALS=true
```

### ⚠️ Supabase Configuration for MVP (TEMPORARY)

**CRITICAL**: For development convenience, the following security features are **DISABLED** in Supabase. They MUST be **RE-ENABLED** before production deployment.

#### Disabled Features (Development Only)

1. **Email Verification - DISABLED**
   - Status: Email confirmation is disabled in Supabase Dashboard
   - Impact: Users can login immediately after registration
   - How to disable: Supabase Dashboard → Authentication → Providers → Email → Uncheck "Enable email confirmations"

2. **Row Level Security (RLS) - DISABLED**
   - Status: RLS is disabled for all database tables
   - Impact: No database access control (all operations allowed)
   - How to disable: Execute the following SQL in Supabase SQL Editor:
     ```sql
     ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
     ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
     ALTER TABLE public.org_members DISABLE ROW LEVEL SECURITY;
     ALTER TABLE public.candidates DISABLE ROW LEVEL SECURITY;
     ALTER TABLE public.positions DISABLE ROW LEVEL SECURITY;
     ALTER TABLE public.position_candidates DISABLE ROW LEVEL SECURITY;
     ALTER TABLE public.interview_feedbacks DISABLE ROW LEVEL SECURITY;
     ```

#### ⚡ Before Production Deployment - Re-enable Security

**Checklist**:
- [ ] Enable Email Verification (Supabase Dashboard → Authentication → Providers → Email)
- [ ] Enable RLS for all tables (see [CLAUDE.md](../CLAUDE.md#️-mvp-development-configuration-temporary) for details)
- [ ] Create RLS policies for organization-based access control
- [ ] Test security in staging environment

**Note**: The codebase already handles these security features correctly, so no code changes are needed when re-enabling.

### Database Initialization

#### Method 1: Using Supabase Studio (Recommended)

1. **Access Supabase Dashboard**
   - Open: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Find "SQL Editor" in left sidebar
   - Click "New Query"

3. **Execute Schema**
   ```bash
   # Copy schema.sql content
   cat ../database/schema.sql
   ```
   - Paste content into SQL Editor
   - Click "Run" to execute

4. **(Optional) Load Test Data**
   ```bash
   # Copy seed.sql content
   cat ../database/seed.sql
   ```
   - Execute in SQL Editor

5. **Verify Installation**
   ```bash
   uv run python scripts/init_database.py
   ```

#### Method 2: Using psql Command Line

If you have direct database access:

```bash
# Get connection string from Supabase Dashboard
# Settings -> Database -> Connection string

# Execute schema
psql "your-connection-string" < ../database/schema.sql

# Execute seed data (optional)
psql "your-connection-string" < ../database/seed.sql
```

### Start Development Server

```bash
# Start server with auto-reload
uv run uvicorn app.main:app --reload --port 8000

# Server will be available at:
# - API: http://localhost:8000
# - Swagger UI: http://localhost:8000/docs
# - ReDoc: http://localhost:8000/redoc
# - Health Check: http://localhost:8000/health
```

### Test API

```bash
# Health check
curl http://localhost:8000/health

# Get candidates
curl http://localhost:8000/api/candidates/

# Get positions
curl http://localhost:8000/api/positions/
```

---

## 📚 API Reference

### System Endpoints

#### `GET /` - Root
Returns API welcome message and links.

**Response**:
```json
{
  "message": "AI Resume Scanning System API",
  "version": "0.1.0",
  "docs": "/docs",
  "redoc": "/redoc",
  "health": "/health"
}
```

#### `GET /health` - Health Check
Returns system health status including database connectivity.

**Response**:
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "environment": "development",
  "timestamp": "2025-01-17T10:00:00Z",
  "database": "connected"
}
```

---

### Authentication API

Base path: `/api/auth`

**Important**: Most business APIs (candidates, positions, interview feedbacks) require authentication. Include the JWT token in the `Authorization` header:

```bash
Authorization: Bearer <your-jwt-token>
```

#### `POST /api/auth/register` - Register New User
Register a new user account with Supabase Auth. The user can either create a personal organization (default) or join an existing organization.

**Two Registration Paths**:
1. **Create Personal Organization** (Default): User automatically gets a personal organization with admin role
2. **Join Existing Organization**: User requests to join an organization (pending approval)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "org_id": "uuid-string"  // Optional: organization to join
}
```

**Response**:
```json
{
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "John Doe",
    "current_org_id": "uuid-string",  // Personal organization ID (if created)
    "created_at": "2025-10-30T10:00:00Z"
  },
  "token": {
    "access_token": "jwt-token-here",
    "token_type": "bearer",
    "expires_in": 86400,  // seconds (24 hours)
    "refresh_token": "refresh-token-here"
  }
}
```

**Organization Creation Details**:
- When `org_id` is **not provided** (default):
  - Creates a personal organization named "{Name}的组织"
  - Generates a unique 6-digit organization code
  - User is added as organization admin
  - `current_org_id` is set to the new organization
- When `org_id` is **provided**:
  - Verifies organization exists
  - Creates join request with `interviewer` role (pending approval)
  - `current_org_id` remains null until approved

**Status Codes**:
- `201`: Registration successful
- `400`: Validation error (email already exists, weak password, invalid org_id)
- `500`: Server error

**Example**:
```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "name": "New User"
  }'
```

#### `POST /api/auth/login` - Login
Authenticate user and get JWT tokens.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response**: Same as register (user object + session tokens)

**Status Codes**:
- `200`: Login successful
- `401`: Invalid credentials
- `500`: Server error

#### `POST /api/auth/refresh` - Refresh Access Token
Get a new access token using refresh token.

**Request Body**:
```json
{
  "refresh_token": "your-refresh-token"
}
```

**Response**:
```json
{
  "access_token": "new-jwt-token",
  "refresh_token": "new-refresh-token",
  "expires_at": "2025-10-30T11:00:00Z"
}
```

#### `GET /api/auth/me` - Get Current User Profile
Get authenticated user's profile information.

**Headers**:
```
Authorization: Bearer <access-token>
```

**Response**:
```json
{
  "user_id": "uuid-string",
  "email": "user@example.com",
  "name": "John Doe",
  "org_id": "org-uuid",
  "org_role": "admin",
  "is_admin": true
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized (no token or invalid token)

#### `PATCH /api/auth/me` - Update Profile
Update current user's profile.

**Headers**:
```
Authorization: Bearer <access-token>
```

**Request Body**:
```json
{
  "name": "Updated Name"
}
```

**Response**: Updated user object

#### `POST /api/auth/logout` - Logout
Invalidate current session.

**Headers**:
```
Authorization: Bearer <access-token>
```

**Response**:
```json
{
  "message": "Successfully logged out"
}
```

---

### Role-Based Access Control (RBAC)

The system implements hierarchical role-based access control with four distinct roles:

#### User Roles

| Role | Level | Description | Permissions |
|------|-------|-------------|-------------|
| **Creator** | 最高 | Organization founder | - All admin permissions<br>- Promote users to admin or interviewer<br>- Cannot be changed or removed |
| **Admin** | 高 | HR/People manager | - Manage organization members<br>- Promote users to interviewer only<br>- Cannot promote to admin |
| **Interviewer** | 中 | Interview panel member | - View candidates<br>- Create interview feedbacks<br>- No org management access |
| **Pending** | 无 | Awaiting approval | - No system access<br>- Waiting for admin approval |

#### Hierarchical Permission Model

**Approval Permissions**:
- **Creator** can approve pending users as:
  - ✅ Admin (max 3 per organization)
  - ✅ Interviewer
- **Admin** can approve pending users as:
  - ❌ Admin (restricted)
  - ✅ Interviewer

**Role Update Permissions**:
- **Creator** can promote/demote members to:
  - ✅ Admin ↔ Interviewer
- **Admin** can only demote to:
  - ❌ Admin (cannot modify other admins)
  - ✅ Interviewer

#### Registration & Onboarding Flow

1. **New User Registration**: User creates account without organization
2. **Organization Choice**:
   - **Option A**: Create new organization → Becomes creator (auto-approved)
   - **Option B**: Join existing organization → Status = pending
3. **Approval Process**:
   - Pending user waits for creator/admin approval
   - Approver selects target role (admin or interviewer)
   - Upon approval: user can access system
4. **Post-Approval**: Creator/admin can update member roles as needed

---

### Organizations API

Base path: `/api/organizations`

**Important**: All organization endpoints require authentication.

#### `POST /api/organizations/` - Create Organization
Create a new organization. The creator automatically becomes the organization owner.

**Headers**:
```
Authorization: Bearer <access-token>
```

**Request Body**:
```json
{
  "name": "My Company",
  "description": "Company description"
}
```

**Response**:
```json
{
  "id": "org-uuid",
  "name": "My Company",
  "description": "Company description",
  "created_by": "user-uuid",
  "created_at": "2025-10-30T10:00:00Z"
}
```

**Status Codes**:
- `201`: Organization created successfully
- `400`: Validation error (e.g., user already in an organization)
- `401`: Unauthorized
- `500`: Server error

#### `GET /api/organizations/my` - Get My Organization
Get the organization that the current user belongs to.

**Headers**:
```
Authorization: Bearer <access-token>
```

**Response**:
```json
{
  "id": "org-uuid",
  "name": "My Company",
  "description": "Company description",
  "member_count": 5,
  "created_by": "user-uuid",
  "created_at": "2025-10-30T10:00:00Z",
  "members": [
    {
      "user_id": "user-uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "creator",
      "joined_at": "2025-10-30T10:00:00Z"
    }
  ]
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `404`: User not in any organization

#### `GET /api/organizations/members` - List Organization Members
Get all members of the current user's organization.

**Headers**:
```
Authorization: Bearer <access-token>
```

**Response**:
```json
{
  "members": [
    {
      "user_id": "user-uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "creator",
      "joined_at": "2025-10-30T10:00:00Z"
    }
  ],
  "total": 5
}
```

#### `PATCH /api/organizations/members/{user_id}/role` - Update Member Role
Update a member's role in the organization (admin and creator only).

**Headers**:
```
Authorization: Bearer <access-token>
```

**Path Parameters**:
- `user_id` (string, required): User ID

**Request Body**:
```json
{
  "role": "admin"  // "admin" | "interviewer" | "pending"
}
```

**Response**: Updated member object

**Status Codes**:
- `200`: Role updated successfully
- `400`: Invalid role or cannot modify creator
- `401`: Unauthorized
- `403`: Forbidden (requires admin or creator role)
- `404`: Member not found

#### `DELETE /api/organizations/members/{user_id}` - Remove Member
Remove a member from the organization (admin and creator only).

**Headers**:
```
Authorization: Bearer <access-token>
```

**Path Parameters**:
- `user_id` (string, required): User ID

**Response**: No content (204)

**Status Codes**:
- `204`: Member removed successfully
- `400`: Cannot remove creator or last member
- `401`: Unauthorized
- `403`: Forbidden (requires admin or creator role)
- `404`: Member not found

---

### Candidates API

Base path: `/api/candidates`

**Authentication**: All endpoints require authentication with `Authorization: Bearer <token>` header. Data is automatically scoped to the user's organization.

#### `GET /api/candidates/` - List Candidates
Get paginated list of candidates with optional filters.

**Query Parameters**:
- `name` (string, optional): Name fuzzy search (case-insensitive partial match)
- `skills` (string[], optional): Skills filter (any match)
- `min_score` (int, optional): Minimum score (0-10) - Global candidate quality score
- `max_score` (int, optional): Maximum score (0-10) - Global candidate quality score
- `limit` (int, default=20): Results per page (1-100)
- `offset` (int, default=0): Page offset

**Note**: The `score` field represents the candidate's **global quality score (0-10 scale)** based purely on resume content, independent from position matching scores (1-4 scale).

**Response**:
```json
{
  "candidates": [
    {
      "id": 1,
      "name": "张三",
      "phone": "13800138000",
      "email": "zhang@example.com",
      "skills": ["Python", "FastAPI", "React"],
      "score": 3,
      "work_experience": [...],
      "education": [...],
      "resume_file": "https://...",
      "created_at": "2025-01-17T10:00:00Z"
    }
  ],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

**Example**:
```bash
# Search by name
curl "http://localhost:8000/api/candidates/?name=张三"

# Filter by skills
curl "http://localhost:8000/api/candidates/?skills=Python&skills=React"

# Score range (0-10 scale global score)
curl "http://localhost:8000/api/candidates/?min_score=7&max_score=10"
```

#### `GET /api/candidates/{candidate_id}` - Get Candidate
Get candidate details by ID.

**Path Parameters**:
- `candidate_id` (int, required): Candidate ID

**Response**: Single candidate object (see list response above)

**Status Codes**:
- `200`: Success
- `404`: Candidate not found

#### `POST /api/candidates/` - Create Candidate
Create a new candidate manually.

**Request Body**:
```json
{
  "name": "李四",
  "phone": "13900139000",
  "email": "li@example.com",
  "skills": ["Java", "Spring Boot"],
  "work_experience": [
    {
      "company": "某某公司",
      "title": "高级工程师",
      "start_date": "2020-01",
      "end_date": "2023-12",
      "description": "负责后端开发..."
    }
  ],
  "education": [...],
  "highlights": "5年开发经验，熟悉微服务架构",
  "score": 3
}
```

**Response**: Created candidate object

**Status Codes**:
- `201`: Created successfully
- `400`: Validation error
- `500`: Server error

#### `PATCH /api/candidates/{candidate_id}` - Update Candidate
Update candidate information (partial update).

**Path Parameters**:
- `candidate_id` (int, required): Candidate ID

**Request Body**: Same as create, but all fields are optional

**Example**:
```json
{
  "phone": "13900139001",
  "score": 4
}
```

**Status Codes**:
- `200`: Updated successfully
- `404`: Candidate not found
- `500`: Server error

#### `DELETE /api/candidates/{candidate_id}` - Delete Candidate
Soft delete a candidate (sets `is_deleted=true`).

Also cascade soft-deletes all associated `position_candidates` records.

**Path Parameters**:
- `candidate_id` (int, required): Candidate ID

**Response**: No content (204)

**Status Codes**:
- `204`: Deleted successfully
- `404`: Candidate not found

#### `POST /api/candidates/upload` - Upload Resume
Upload resume file and create candidate with AI parsing.

**Workflow**:
1. Upload file to Aliyun OSS
2. Parse resume with AI (PyMuPDF + LLM)
3. Create or update candidate (based on name+phone uniqueness)
4. Optionally link to position with auto-scoring

**Form Data**:
- `file` (file, required): Resume file (PDF only)
- `position_id` (int, optional): Position ID to link candidate

**Response**:
```json
{
  "status": "success",  // "success" | "parse_failed" | "error"
  "candidate": { ... },  // Candidate object if successful
  "file_url": "https://...",
  "parse_error": null  // Error message if parsing failed
}
```

**Status Codes**:
- `201`: Uploaded successfully
- `400`: Invalid file type or missing filename
- `500`: Server error

**Example**:
```bash
# Upload single resume
curl -X POST "http://localhost:8000/api/candidates/upload" \
  -F "file=@resume.pdf"

# Upload and link to position
curl -X POST "http://localhost:8000/api/candidates/upload?position_id=1" \
  -F "file=@resume.pdf"
```

#### `POST /api/candidates/batch-upload` - Batch Upload Resumes
Batch upload multiple resumes with fault tolerance.

Continues processing other files even if some fail.

**Form Data**:
- `files` (file[], required): Multiple resume files (PDFs only)
- `position_id` (int, optional): Position ID to link all candidates

**Response**:
```json
{
  "total": 10,
  "successful": 8,
  "failed": 2,
  "results": [
    {
      "file_name": "resume1.pdf",
      "status": "success",
      "candidate": { ... },
      "error": null
    },
    {
      "file_name": "resume2.pdf",
      "status": "failed",
      "candidate": null,
      "error": "Parsing failed: ..."
    }
  ]
}
```

**Status Codes**:
- `201`: Batch upload completed (check results for individual status)
- `400`: No valid PDF files provided
- `500`: Server error

**Example**:
```bash
curl -X POST "http://localhost:8000/api/candidates/batch-upload" \
  -F "files=@resume1.pdf" \
  -F "files=@resume2.pdf" \
  -F "files=@resume3.pdf"
```

---

### Positions API

Base path: `/api/positions`

#### `GET /api/positions/` - List Positions
Get paginated list of positions with optional filters.

**Query Parameters**:
- `title` (string, optional): Title fuzzy search
- `department` (string, optional): Department filter (exact match)
- `status` (string, optional): Status filter (`open` | `closed`)
- `limit` (int, default=20): Results per page (1-100)
- `offset` (int, default=0): Page offset

**Response**:
```json
{
  "positions": [
    {
      "id": 1,
      "title": "高级 Python 工程师",
      "department": "技术部",
      "location": "上海",
      "job_description": "负责后端系统开发...",
      "requirements": ["5年以上 Python 经验", "熟悉 FastAPI"],
      "status": "open",
      "created_by": 1,
      "created_at": "2025-01-17T10:00:00Z"
    }
  ],
  "total": 50,
  "limit": 20,
  "offset": 0
}
```

**Example**:
```bash
# Search by title
curl "http://localhost:8000/api/positions/?title=Python"

# Filter by department and status
curl "http://localhost:8000/api/positions/?department=技术部&status=open"
```

#### `GET /api/positions/{position_id}` - Get Position
Get position details by ID.

**Path Parameters**:
- `position_id` (int, required): Position ID

**Response**: Single position object

**Status Codes**:
- `200`: Success
- `404`: Position not found

#### `POST /api/positions/` - Create Position
Create a new position.

**Request Body**:
```json
{
  "title": "前端工程师",
  "department": "技术部",
  "location": "北京",
  "job_description": "负责前端开发，使用 React + TypeScript",
  "requirements": ["3年以上前端经验", "熟悉 React"],
  "status": "open",
  "created_by": 1
}
```

**Response**: Created position object

**Status Codes**:
- `201`: Created successfully
- `400`: Validation error
- `500`: Server error

#### `PATCH /api/positions/{position_id}` - Update Position
Update position information (partial update).

**Path Parameters**:
- `position_id` (int, required): Position ID

**Request Body**: Same as create, but all fields are optional

**Status Codes**:
- `200`: Updated successfully
- `404`: Position not found
- `500`: Server error

#### `PATCH /api/positions/{position_id}/status` - Update Position Status
Update position status (open/closed).

**Path Parameters**:
- `position_id` (int, required): Position ID

**Request Body**:
```json
{
  "status": "closed"  // "open" | "closed"
}
```

**Response**: Updated position object

**Status Codes**:
- `200`: Updated successfully
- `400`: Invalid status value
- `404`: Position not found
- `500`: Server error

#### `DELETE /api/positions/{position_id}` - Delete Position
Soft delete a position (sets `is_deleted=true`).

Also cascade soft-deletes all associated `position_candidates` records.

**Path Parameters**:
- `position_id` (int, required): Position ID

**Response**: No content (204)

**Status Codes**:
- `204`: Deleted successfully
- `404`: Position not found

---

### Interview Feedbacks API

Base path: `/api/interview-feedbacks`

**Important Note**: As of database schema v2.0 (2025-01-27), the table supports **three mutually exclusive record types**:
1. **Interview Evaluations**: `interview_rating` field (1-4 scale) for human interviews
2. **AI Evaluations**: `ai_rating` field (1-10 scale) for AI agent assessments
3. **Status/Log Records**: `new_status` field for status changes or system logs

**Key Changes from v1.x**:
- `interviewer`: Changed from INTEGER to UUID (no foreign key constraint)
- `interviewer_type`: New required field ('user', 'agent', 'system')
- `interview_rating`: Renamed from `rating`, now optional (mutually exclusive)
- `ai_rating`: New field for AI evaluations (mutually exclusive)
- `interview_date`, `comments`: Now required (auto-fill with created_at date for non-interview records)
- `is_status_change`: Removed (inferred from field values)

The `position_id` field remains optional, allowing candidate-level records independent of any specific position.

#### `POST /api/interview-feedbacks/` - Create Interview Feedback
Create a new interview/AI evaluation or status change record (generic endpoint).

**Important**: Must specify exactly one of: `interview_rating`, `ai_rating`, or `new_status`.

**Note**: For convenience, use specialized endpoints:
- POST `/api/interview-feedbacks/` for interview evaluations
- POST `/api/interview-feedbacks/status-change` for status changes

**Request Body (Interview Evaluation)**:
```json
{
  "candidate_id": 1,
  "position_id": 1,  // Optional: can be null for candidate-level records
  "interviewer": "12345678-1234-5678-1234-567812345678",  // UUID
  "interviewer_type": "user",  // "user" | "agent" | "system"
  "interview_rating": 3,  // 1-4 scale
  "comments": "技术能力扎实，沟通能力良好...",
  "interview_date": "2025-01-27"  // Optional, auto-filled with today if omitted
}
```

**Request Body (AI Evaluation)**:
```json
{
  "candidate_id": 1,
  "position_id": 1,
  "interviewer": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",  // AI agent UUID
  "interviewer_type": "agent",
  "ai_rating": 8,  // 1-10 scale
  "comments": "AI 面试评估：技术能力强，项目经验丰富"
}
```

**Response**: Created feedback object

**Status Codes**:
- `201`: Created successfully
- `400`: Validation error (e.g., multiple type fields specified, missing required fields)
- `500`: Server error

#### `POST /api/interview-feedbacks/status-change` - Create Status Change
Create a status change record (convenience endpoint).

**Request Body**:
```json
{
  "candidate_id": 1,
  "position_id": 1,  // Optional: can be null for candidate-level status changes
  "interviewer": "12345678-1234-5678-1234-567812345678",  // UUID
  "interviewer_type": "user",  // "user" | "agent" | "system"
  "new_status": "interview",  // "screening" | "interview" | "offer" | "hired" | "rejected" | "withdrawn"
  "comments": "通过初步筛选，安排一面"
}
```

**Response**: Created status change record

**Status Codes**:
- `201`: Created successfully
- `400`: Validation error
- `500`: Server error

**Example**:
```bash
curl -X POST "http://localhost:8000/api/interview-feedbacks/status-change" \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": 1,
    "position_id": 1,
    "interviewer": "12345678-1234-5678-1234-567812345678",
    "interviewer_type": "user",
    "new_status": "interview",
    "comments": "通过初步筛选"
  }'
```

#### `GET /api/interview-feedbacks/` - List Feedbacks
Get all feedback records for a candidate-position pair.

Returns interview evaluations, AI evaluations, and status changes in chronological order.

**Query Parameters**:
- `candidate_id` (int, required): Candidate ID
- `position_id` (int, required): Position ID
- `record_type` (string, optional): Filter by type: 'interview', 'ai', 'status', or null (all records)
- `limit` (int, default=100): Results per page (1-200)
- `offset` (int, default=0): Page offset

**Response**:
```json
{
  "feedbacks": [
    {
      "id": 1,
      "candidate_id": 1,
      "position_id": 1,
      "interviewer": "12345678-1234-5678-1234-567812345678",
      "interviewer_type": "user",
      "interview_date": "2025-01-27",
      "interview_rating": 3,
      "ai_rating": null,
      "new_status": null,
      "comments": "技术能力扎实...",
      "created_at": "2025-01-27T14:30:00Z"
    },
    {
      "id": 2,
      "candidate_id": 1,
      "position_id": 1,
      "interviewer": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "interviewer_type": "agent",
      "interview_date": "2025-01-27",
      "interview_rating": null,
      "ai_rating": 8,
      "new_status": null,
      "comments": "AI评估：技术能力强",
      "created_at": "2025-01-27T10:00:00Z"
    },
    {
      "id": 3,
      "candidate_id": 1,
      "position_id": 1,
      "interviewer": "12345678-1234-5678-1234-567812345678",
      "interviewer_type": "user",
      "interview_date": "2025-01-25",
      "interview_rating": null,
      "ai_rating": null,
      "new_status": "interview",
      "comments": "通过初步筛选",
      "created_at": "2025-01-25T10:00:00Z"
    }
  ],
  "total": 3,
  "limit": 100,
  "offset": 0
}
```

**Example**:
```bash
# Get all feedbacks
curl "http://localhost:8000/api/interview-feedbacks/?candidate_id=1&position_id=1"

# Get only interview evaluations
curl "http://localhost:8000/api/interview-feedbacks/?candidate_id=1&position_id=1&record_type=interview"

# Get only AI evaluations
curl "http://localhost:8000/api/interview-feedbacks/?candidate_id=1&position_id=1&record_type=ai"

# Get only status changes
curl "http://localhost:8000/api/interview-feedbacks/?candidate_id=1&position_id=1&record_type=status"
```

#### `GET /api/interview-feedbacks/candidate/{candidate_id}` - Get Candidate Execution Records
Get all execution records for a candidate across all positions.

Returns candidate-level records (including interview evaluations, AI evaluations, and status changes) in chronological order (newest first).

**Path Parameters**:
- `candidate_id` (int, required): Candidate ID

**Query Parameters**:
- `record_type` (string, optional): Filter by type: 'interview', 'ai', 'status', or null (all records)
- `limit` (int, default=100): Results per page (1-200)
- `offset` (int, default=0): Page offset

**Response**:
```json
{
  "feedbacks": [
    {
      "id": 5,
      "candidate_id": 1,
      "position_id": null,
      "interviewer": "12345678-1234-5678-1234-567812345678",
      "interviewer_type": "user",
      "interview_date": "2025-01-27",
      "interview_rating": 4,
      "ai_rating": null,
      "new_status": null,
      "comments": "候选人技术能力出色...",
      "created_at": "2025-01-27T15:30:00Z"
    },
    {
      "id": 4,
      "candidate_id": 1,
      "position_id": 2,
      "interviewer": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "interviewer_type": "agent",
      "interview_date": "2025-01-27",
      "interview_rating": null,
      "ai_rating": 7,
      "new_status": null,
      "comments": "AI 面试评估：候选人综合能力良好",
      "created_at": "2025-01-27T10:00:00Z"
    },
    {
      "id": 3,
      "candidate_id": 1,
      "position_id": 1,
      "interviewer": "12345678-1234-5678-1234-567812345678",
      "interviewer_type": "user",
      "interview_date": "2025-01-25",
      "interview_rating": null,
      "ai_rating": null,
      "new_status": "interview",
      "comments": "通过初步筛选",
      "created_at": "2025-01-25T14:00:00Z"
    }
  ],
  "total": 3,
  "limit": 100,
  "offset": 0
}
```

**Status Codes**:
- `200`: Success
- `500`: Server error

**Example**:
```bash
# Get all execution records for candidate
curl "http://localhost:8000/api/interview-feedbacks/candidate/1"

# Get only interview evaluations
curl "http://localhost:8000/api/interview-feedbacks/candidate/1?record_type=interview"

# Get only AI evaluations
curl "http://localhost:8000/api/interview-feedbacks/candidate/1?record_type=ai"
```

#### `GET /api/interview-feedbacks/interviewer/{interviewer_id}` - List by Interviewer
Get all feedbacks created by a specific interviewer/agent.

**Path Parameters**:
- `interviewer_id` (UUID, required): Interviewer/agent UUID

**Query Parameters**:
- `limit` (int, default=100): Results per page (1-200)
- `offset` (int, default=0): Page offset

**Response**: List of feedback objects

**Example**:
```bash
curl "http://localhost:8000/api/interview-feedbacks/interviewer/12345678-1234-5678-1234-567812345678"
```

#### `GET /api/interview-feedbacks/{feedback_id}` - Get Feedback
Get feedback details by ID.

**Path Parameters**:
- `feedback_id` (int, required): Feedback record ID

**Response**: Single feedback object

**Status Codes**:
- `200`: Success
- `404`: Feedback not found

#### `PATCH /api/interview-feedbacks/{feedback_id}` - Update Feedback
Update interview/AI feedback (partial update).

**Note**: Only interview and AI evaluation records can be edited. Status change records are immutable. Cannot change record type (e.g., from interview to AI).

**Path Parameters**:
- `feedback_id` (int, required): Feedback record ID

**Request Body (Interview Evaluation)**:
```json
{
  "interview_rating": 4,
  "comments": "Updated evaluation...",
  "interview_date": "2025-01-28"
}
```

**Request Body (AI Evaluation)**:
```json
{
  "ai_rating": 9,
  "comments": "Updated AI assessment..."
}
```

**Response**: Updated feedback object

**Status Codes**:
- `200`: Updated successfully
- `400`: Trying to edit status change record, attempting to change record type, or validation error
- `404`: Feedback not found
- `500`: Server error

#### `GET /api/positions/{position_id}/candidates` - Get Position Candidates
Get all candidates associated with a position (with full candidate details via JOIN).

Returns position-candidate associations with complete candidate information. Supports filtering by status, searching by candidate name, sorting, and pagination.

**Path Parameters**:
- `position_id` (int, required): Position ID

**Query Parameters**:
- `status` (string, optional): Filter by candidate status (screening, interview, offer, hired, rejected, withdrawn)
- `candidate_name` (string, optional): Search by candidate name (fuzzy match, case-insensitive)
- `sort_by` (string, default="overall_score_numeric"): Sort field
- `sort_order` (string, default="desc"): Sort order (asc | desc)
- `limit` (int, default=20): Results per page (1-100)
- `offset` (int, default=0): Page offset

**Response**:
```json
{
  "candidates": [
    {
      "id": 1,
      "position_id": 1,
      "candidate_id": 5,
      "relevance_score": 3,
      "fit_score": 4,
      "overall_score": 3,
      "overall_score_numeric": 85,
      "current_status": "interview",
      "created_at": "2025-01-17T10:00:00Z",
      "updated_at": "2025-01-18T14:30:00Z",
      "candidate": {
        "id": 5,
        "name": "张三",
        "email": "zhang@example.com",
        "phone": "13800138000",
        "skills": ["Python", "FastAPI", "React"],
        "score": 3,
        "resume_file": "https://...",
        "created_at": "2025-01-15T10:00:00Z"
      }
    }
  ],
  "total": 50,
  "limit": 20,
  "offset": 0
}
```

**Status Codes**:
- `200`: Success
- `404`: Position not found
- `500`: Server error

**Example**:
```bash
# Get all candidates for a position
curl "http://localhost:8000/api/positions/1/candidates"

# Filter by status
curl "http://localhost:8000/api/positions/1/candidates?status=interview"

# Search by candidate name
curl "http://localhost:8000/api/positions/1/candidates?candidate_name=张三"

# Sort by overall score (highest first)
curl "http://localhost:8000/api/positions/1/candidates?sort_by=overall_score_numeric&sort_order=desc"

# Pagination
curl "http://localhost:8000/api/positions/1/candidates?limit=10&offset=20"
```

---

### Advanced APIs

The following advanced APIs are available for intelligent candidate screening and score management:

#### `POST /api/positions/{position_id}/smart-screening` - Smart Screening ✅

Trigger intelligent candidate screening for a position using two-phase approach.

**Query Parameters**:
- `max_candidates` (int, default=100): Maximum candidates to screen (1-200)
- `recalculate_existing` (bool, default=true): Recalculate existing scores

**Response Example**:
```json
{
  "status": "success",
  "position_id": 1,
  "total_candidates_screened": 150,
  "new_linked": 50,
  "scores_updated": 30,
  "message": "Smart screening completed successfully"
}
```

#### `POST /api/positions/{position_id}/recalculate-scores` - Recalculate Scores ✅

Recalculate scores for all candidates associated with a position.

**Response Example**:
```json
{
  "status": "success",
  "position_id": 1,
  "scores_updated": 80,
  "message": "Recalculated scores for 80 candidates"
}
```

### Users API

Base path: `/api/users`

Complete CRUD operations for user management:

- `GET /api/users/` - List users with pagination and role filtering
- `GET /api/users/{user_id}` - Get user details
- `POST /api/users/` - Create new user (checks email uniqueness)
- `PATCH /api/users/{user_id}` - Update user information
- `DELETE /api/users/{user_id}` - Soft delete user

**Example - Create User**:
```bash
curl -X POST "http://localhost:8000/api/users/" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "recruiter@company.com",
    "name": "John Doe",
    "role": "recruiter"
  }'
```

---

## 🔧 Service Layer

The backend uses a service-oriented architecture with the following services:

### Core Services

#### `CandidateService` (`app/services/candidate_service.py`)
Handles all candidate-related business logic.

**Key Methods**:
- `create(data)` - Create new candidate
- `get_by_id(id)` - Get candidate by ID
- `update(id, data)` - Update candidate
- `soft_delete(id)` - Soft delete candidate (cascade to position_candidates)
- `search_candidates(name_query, skills, min_score, max_score, limit, offset)` - Search with filters
- `upload_and_create_from_resume(file_content, file_name, auto_parse)` - Upload and parse resume
- `batch_upload_resumes(files, auto_parse)` - Batch upload with fault tolerance

#### `PositionService` (`app/services/position_service.py`)
Manages position/job postings.

**Key Methods**:
- `create(data)` - Create new position
- `get_by_id(id)` - Get position by ID
- `update(id, data)` - Update position
- `update_status(id, status)` - Update position status (open/closed)
- `soft_delete(id)` - Soft delete position (cascade to position_candidates)
- `search_positions(title_query, department, status, limit, offset)` - Search with filters

#### `PositionCandidateService` (`app/services/position_candidate_service.py`)
Manages candidate-position associations and scoring.

**Key Methods**:
- `create_association(position_id, candidate_id, relevance_score, fit_score, current_status)` - Link candidate to position
- `get_candidates_for_position(position_id, status, limit, offset)` - Get all candidates for a position
- `get_positions_for_candidate(candidate_id)` - Get all positions for a candidate
- `update_scores(position_id, candidate_id, relevance_score, fit_score)` - Update scores
- `update_status(position_id, candidate_id, new_status)` - Update candidate status for position
- `remove_association(position_id, candidate_id)` - Soft delete association

#### `InterviewFeedbackService` (`app/services/interview_feedback_service.py`)
Handles interview evaluations, AI evaluations, and status changes (execution records).

**Important**: As of schema v2.0, supports **three mutually exclusive record types**:
1. Interview evaluations (interview_rating: 1-4)
2. AI evaluations (ai_rating: 1-10)
3. Status/log records (new_status: status enum)

**Key Changes from v1.x**:
- `interviewer`: Now accepts UUID instead of INT
- `interviewer_type`: New required parameter ('user', 'agent', 'system')
- `record_type`: Parameter replaces `include_status_changes` for filtering

**Key Methods**:
- `create(data)` - Create feedback record (interview/AI evaluation or status change)
- `create_interview_feedback(candidate_id, interviewer: UUID, interview_rating, comments, ...)` - Create interview evaluation
- `create_ai_evaluation(candidate_id, ai_agent_id: UUID, ai_rating, comments, ...)` - Create AI evaluation
- `create_status_change_record(candidate_id, operator: UUID, new_status, comments, ...)` - Create status change
- `create_system_log(candidate_id, operator: UUID, comments, ...)` - Create system log
- `get_by_id(id)` - Get feedback by ID
- `update(id, data)` - Update feedback (only interview/AI records, not status changes)
- `get_feedbacks_for_candidate_position(candidate_id, position_id, record_type, limit, offset)` - Get feedbacks for pair
- `get_feedbacks_for_candidate(candidate_id, record_type, limit, offset)` - Get all execution records for a candidate
- `get_feedbacks_by_interviewer(interviewer: UUID, limit, offset)` - Get feedbacks by interviewer UUID
- `get_interview_evaluations_only(...)` - Get only interview evaluation records
- `get_ai_evaluations_only(...)` - Get only AI evaluation records

#### `SmartScreeningService` (`app/services/smart_screening_service.py`)
Intelligent candidate screening and matching.

**Key Methods**:
- `screen_candidates(position_id, max_candidates)` - Two-phase screening (pre-filter + AI ranking)
- `score_candidate_for_position(candidate, position)` - LLM-based scoring

#### `UserService` (`app/services/user_service.py`)
User management (MVP phase - no authentication).

**Key Methods**:
- Basic CRUD operations for users table

### AI/LLM Services

#### `LLMClient` (`app/services/llm/client.py`)
Unified LLM access via LiteLLM.

**Key Methods**:
- `text_complete(model, messages, temperature, max_tokens)` - Complete text with LLM
- `stream_text_complete(model, messages, temperature, max_tokens)` - Streaming completion
- `count_tokens(model, text)` - Count tokens for a model

**Supported Providers**: OpenAI, DeepSeek, Anthropic, Google Gemini, and 100+ more via LiteLLM

**Example**:
```python
from app.services.llm import text_complete

response = await text_complete(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"}
    ]
)
```

#### `ResumeParser` (`app/services/parser/resume_parser.py`)
Resume parsing with PyMuPDF + LLM.

**Key Methods**:
- `parse_resume(file_path)` - Parse single resume file
- `parse_resume_batch(file_paths)` - Batch parse resumes

**Parsing Pipeline**:
1. **PyMuPDF**: Extract structured content from PDF (text, tables, images)
2. **LLM**: Semantic extraction of candidate data (name, skills, experience, education)
3. **Validation**: Ensure data quality and completeness
4. **Structuring**: Convert to candidate data model

### Storage Services

#### `OSSService` (`app/services/storage/oss_service.py`)
Aliyun OSS file storage.

**Key Methods**:
- `upload_file(file_content, file_name, folder)` - Upload file to OSS
- `delete_file(file_path)` - Delete file from OSS
- `generate_url(file_path, expires)` - Generate signed URL

---

## 📂 Project Structure

```
backend/
├── app/
│   ├── api/                      # FastAPI route handlers
│   │   ├── __init__.py
│   │   ├── candidates.py         # Candidate API (7 endpoints)
│   │   ├── positions.py          # Position API (8 endpoints)
│   │   ├── interview_feedbacks.py # Interview API (6 endpoints)
│   │   ├── users.py              # User API (5 endpoints)
│   │   └── dependencies.py       # Dependency injection
│   │
│   ├── services/                 # Business logic layer
│   │   ├── base.py               # Base service class
│   │   ├── candidate_service.py  # Candidate business logic
│   │   ├── position_service.py   # Position business logic
│   │   ├── position_candidate_service.py  # Association logic
│   │   ├── interview_feedback_service.py  # Feedback logic
│   │   ├── smart_screening_service.py     # AI screening
│   │   ├── user_service.py       # User management
│   │   ├── llm/                  # LLM integration
│   │   │   ├── __init__.py
│   │   │   ├── client.py         # LiteLLM wrapper
│   │   │   └── prompts.py        # LLM prompts
│   │   ├── parser/               # Resume parsing
│   │   │   ├── __init__.py
│   │   │   ├── pymupdf_parser.py  # PyMuPDF integration
│   │   │   └── resume_parser.py  # Resume parsing logic
│   │   └── storage/              # File storage
│   │       ├── __init__.py
│   │       └── oss_service.py    # Aliyun OSS
│   │
│   ├── models/                   # Pydantic models
│   │   ├── candidate.py          # Candidate models
│   │   ├── position.py           # Position models
│   │   ├── interview_feedback.py # Feedback models
│   │   └── user.py               # User models
│   │
│   ├── config/                   # Configuration
│   │   ├── settings.py           # Application settings
│   │   └── database.py           # Supabase client
│   │
│   ├── utils/                    # Utilities
│   │   ├── validators.py         # Data validation
│   │   └── helpers.py            # Helper functions
│   │
│   └── main.py                   # FastAPI application entry point
│
├── tests/                        # Test suite (135 tests, 78% coverage)
│   ├── conftest.py               # pytest fixtures
│   ├── test_candidates.py        # Candidate tests
│   ├── test_positions.py         # Position tests
│   ├── test_feedbacks.py         # Feedback tests
│   ├── test_services/            # Service tests
│   └── test_integration/         # Integration tests
│
├── scripts/                      # Utility scripts
│   └── init_database.py          # Database initialization
│
├── pyproject.toml                # Dependencies and config
├── .env.example                  # Environment template
├── .pre-commit-config.yaml       # Pre-commit hooks
├── README.md                     # This file
└── QUICKSTART.md                 # Quick start guide (deprecated, merged into README)
```

---

## 💻 Development

### Development Workflow

```bash
# 1. Start development server
uv run uvicorn app.main:app --reload --port 8000

# 2. Make code changes

# 3. Run tests
uv run pytest

# 4. Check code quality
uv run ruff check .       # Lint
uv run ruff format .      # Format
uv run basedpyright       # Type check

# 5. Commit (pre-commit hooks will run automatically)
git add .
git commit -m "feat: add new feature"
```

### Common Commands

```bash
# ============================================================================
# Development Server
# ============================================================================
uv run uvicorn app.main:app --reload --port 8000

# ============================================================================
# Testing
# ============================================================================
uv run pytest                          # Run all tests
uv run pytest tests/test_parser.py     # Run specific test file
uv run pytest -k test_function         # Run specific test
uv run pytest --cov                    # Run with coverage
uv run pytest --cov=app --cov-report=html  # Generate HTML coverage report
uv run pytest -m unit                  # Run only unit tests
uv run pytest -m integration           # Run only integration tests
uv run pytest -v                       # Verbose output

# ============================================================================
# Code Quality
# ============================================================================
uv run ruff check .                    # Lint code
uv run ruff format .                   # Format code
uv run basedpyright                    # Type checking
pre-commit run --all-files             # Run all pre-commit hooks

# ============================================================================
# Dependency Management
# ============================================================================
uv add <package>                       # Add production dependency
uv add --dev <package>                 # Add development dependency
uv remove <package>                    # Remove dependency
uv sync                                # Sync dependencies
uv lock                                # Update lock file

# ============================================================================
# Build and Publish
# ============================================================================
uv build                               # Build the project
uv publish                             # Publish to PyPI
```

### Environment Variables

See `.env.example` for all available configuration options.

**Key Variables**:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: Database access
- `OPENAI_API_KEY` or `DEEPSEEK_API_KEY`: LLM API access
- `DEFAULT_LLM_MODEL`: Model for parsing/matching (e.g., `gpt-4o`, `deepseek/deepseek-chat`)
- `ALIYUN_OSS_*`: File storage credentials
- `ENVIRONMENT`: `development` | `production`
- `LOG_LEVEL`: `DEBUG` | `INFO` | `WARNING` | `ERROR`
- `CORS_ORIGINS`: List of allowed origins for CORS

---

## 🧪 Testing

### Test Suite

The project has **135 tests** with **78% coverage**.

**Test Structure**:
```
tests/
├── conftest.py              # Shared fixtures
├── test_candidates.py       # Candidate API tests
├── test_positions.py        # Position API tests
├── test_feedbacks.py        # Feedback API tests
├── test_services/           # Service layer tests
│   ├── test_candidate_service.py
│   ├── test_position_service.py
│   ├── test_screening_service.py
│   └── test_parser.py
└── test_integration/        # Integration tests
    ├── test_upload_flow.py
    └── test_screening_flow.py
```

### Running Tests

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov

# Generate HTML coverage report
uv run pytest --cov=app --cov-report=html
# Open htmlcov/index.html in browser

# Run specific test file
uv run pytest tests/test_candidates.py

# Run specific test function
uv run pytest tests/test_candidates.py::test_create_candidate

# Run with verbose output
uv run pytest -v

# Run only unit tests (fast)
uv run pytest -m unit

# Run only integration tests (slow)
uv run pytest -m integration

# Run tests matching keyword
uv run pytest -k "upload"

# Stop on first failure
uv run pytest -x
```

### Writing Tests

**Example Test**:
```python
import pytest
from app.services.candidate_service import CandidateService


@pytest.mark.asyncio
async def test_create_candidate(candidate_service: CandidateService):
    """Test creating a new candidate."""
    candidate_data = {
        "name": "Test User",
        "email": "test@example.com",
        "phone": "13800138000",
        "skills": ["Python", "FastAPI"],
    }

    candidate = candidate_service.create(candidate_data)

    assert candidate["name"] == "Test User"
    assert candidate["email"] == "test@example.com"
    assert "id" in candidate
```

---

## 🔧 Troubleshooting

### Common Issues

#### Q: Startup shows "Connection to database failed"?

**A:** Check the following:
1. `.env` file has correct Supabase configuration
2. Network can access Supabase (check firewall/proxy)
3. Database tables are created (execute `schema.sql`)
4. Supabase project is active (not paused)

**Solution**:
```bash
# Test database connection
uv run python -c "from app.config.database import get_supabase; print(get_supabase().table('users').select('count').limit(1).execute())"

# Re-run schema if tables are missing
# (See Database Initialization section)
```

#### Q: API returns 500 errors?

**A:** Possible causes:
1. Database tables not created
2. Supabase configuration error
3. Check terminal logs for detailed error

**Solution**:
```bash
# Check logs for error details
tail -f logs/app.log  # If logging to file

# Or check terminal output when running server
uv run uvicorn app.main:app --reload --port 8000
```

#### Q: Resume upload doesn't work?

**A:** Ensure:
1. Aliyun OSS configuration is correct (`.env` file: `ALIYUN_OSS_*`)
2. LLM API key is configured (for resume parsing)
3. PyMuPDF dependency is installed

**Solution**:
```bash
# Test OSS upload
uv run python -c "from app.services.storage.oss_service import OSSService; print(OSSService().upload_file(b'test', 'test.txt', 'test/'))"

# Test LLM connection
uv run python -c "from app.services.llm import text_complete; import asyncio; print(asyncio.run(text_complete('gpt-4o', [{'role': 'user', 'content': 'hello'}])))"
```

#### Q: ImportError: Using SOCKS proxy?

**A:** Install SOCKS support for httpx:
```bash
uv add "httpx[socks]"
```

#### Q: How to disable proxy?

**A:** Unset proxy environment variables:
```bash
# Temporarily disable proxy
unset HTTP_PROXY HTTPS_PROXY ALL_PROXY http_proxy https_proxy all_proxy

# Then start server
uv run uvicorn app.main:app --reload --port 8000
```

#### Q: Pre-commit hooks fail?

**A:** Common solutions:
```bash
# Install pre-commit hooks
pre-commit install

# Run all hooks manually
pre-commit run --all-files

# Update hooks to latest versions
pre-commit autoupdate

# Skip hooks for a commit (NOT recommended)
git commit --no-verify
```

#### Q: Tests fail with database errors?

**A:** Ensure test database is configured:
```bash
# Set test environment
export ENVIRONMENT=test

# Run tests
uv run pytest
```

---

## 🏗️ Architecture

### Minimal Design Philosophy

This project follows a **strict minimal design** approach:

- ✅ **Simple, direct solutions** over complex patterns
- ✅ **Hardcode when appropriate** (don't over-abstract)
- ✅ **Add complexity only when explicitly needed**
- ❌ **No unnecessary abstractions**
- ❌ **No features not in requirements**
- ❌ **No over-engineering**

**Example - Prefer Simple over Complex**:
```python
# ✅ GOOD: Simple and sufficient
def create_admin(name: str, email: str) -> User:
    return User(name=name, email=email, role="admin")

# ❌ BAD: Over-engineered factory pattern
class UserFactory:
    @staticmethod
    def create_user(user_type: str, **kwargs) -> BaseUser:
        # Complex type resolution logic...
```

### LLM Integration

All LLM calls use **LiteLLM** for unified access to 100+ providers:

```python
# Supports OpenAI, Anthropic, DeepSeek, Google, etc.
await text_complete("gpt-4o", messages)                  # OpenAI
await text_complete("deepseek/deepseek-chat", messages)  # DeepSeek
await text_complete("gemini-pro", messages)              # Google
await text_complete("claude-3-opus", messages)           # Anthropic
```

### Resume Parsing Pipeline

1. **PyMuPDF**: Extract structured PDF content (text, tables, images)
2. **LLM**: Semantic extraction of candidate data (name, skills, experience)
3. **Validation**: Ensure data quality and completeness
4. **Storage**: Save to Supabase + OSS

### Smart Screening Strategy

**Two-phase approach** to optimize LLM costs:

1. **Pre-screening**: Keyword/rule-based filtering (filter to top 100-200)
2. **AI Ranking**: LLM-based scoring of pre-screened candidates

**Benefits**:
- Reduces LLM API calls (don't score entire talent pool)
- Maintains high matching quality
- Cost-effective at scale

### Database Schema

**Current Version**: v2.0 (2025-01-27)

Key tables:

- **candidates**: Candidate/talent pool with AI-extracted structured data
- **positions**: Job positions with requirements
- **position_candidates**: M2M relationship with scoring (relevance_score, fit_score, overall_score)
- **interview_feedbacks**: Execution records with three mutually exclusive types:
  - **v2.0 Major Changes**:
    - Supports three record types: interview evaluations (interview_rating: 1-4), AI evaluations (ai_rating: 1-10), status/log records (new_status)
    - `interviewer`: Changed from INTEGER to UUID (no FK constraint)
    - `interviewer_type`: New required field ('user', 'agent', 'system')
    - `interview_rating`: Renamed from `rating`, mutually exclusive with ai_rating and new_status
    - `ai_rating`: New field for AI evaluations
    - `interview_date`, `comments`: Now required (auto-fill for non-interview records)
    - `is_status_change`: Removed (inferred from field values)
    - `position_id`: Remains nullable for candidate-level records
- **users**: System users (future expansion)

See `../database/schema_v2.sql` for complete schema.

### Supabase Integration

This project uses **Supabase** as the primary backend:

- **Database**: PostgreSQL managed by Supabase
- **API**: Auto-generated REST API via PostgREST (minimal custom endpoints)
- **Storage**: Resume files stored in Aliyun OSS (not Supabase Storage)
- **Authentication**: Supabase Auth (future phase)

**Python SDK Usage Pattern**:
```python
from app.config.database import get_supabase

supabase = get_supabase()

# CRUD operations
response = supabase.table("candidates").select("*").execute()
response = supabase.table("candidates").insert(data).execute()
```

---

## 📊 Development Progress

### Completion Status: 100% 🎉

| Module | Status | Completion |
|--------|--------|-----------|
| Database Schema | ✅ Complete | 100% |
| Service Layer | ✅ Complete | 100% |
| API Layer | ✅ Complete | 100% |
| Testing | ✅ Complete | 95% |
| Documentation | ✅ Complete | 100% |

### All Features Completed ✅

- ✅ **Candidate CRUD** with search, filtering, pagination
- ✅ **Position CRUD** with search, filtering, status management
- ✅ **Interview Feedback** CRUD with timeline tracking
  - ✅ **Schema v2.0 Refactor** (2025-01-27): Three mutually exclusive record types (interview, AI, status/log)
  - ✅ **Interview Evaluations**: Human interviews with interview_rating (1-4)
  - ✅ **AI Evaluations**: AI agent assessments with ai_rating (1-10)
  - ✅ **Status/Log Records**: Status changes and system logs with new_status
- ✅ **Candidate Execution Records** - Candidate-level records independent of positions
- ✅ **Resume Upload** with AI parsing (single and batch)
- ✅ **File Storage** via Aliyun OSS
- ✅ **LLM Integration** via LiteLLM (100+ providers)
- ✅ **Resume Parsing** with PyMuPDF + LLM
- ✅ **Smart Screening** API (added 2025-01-17)
- ✅ **Score Recalculation** API (added 2025-01-17)
- ✅ **User Management** API (added 2025-01-17)
- ✅ **Comprehensive Testing** (135 tests, 78% coverage)
- ✅ **API Documentation** (Swagger UI + ReDoc)

### Ready for Production

All 28 API endpoints are implemented and tested. The backend is ready for production deployment.

---

## 📚 Related Documentation

- [Frontend Task Plan](../docs/frontend_task_plan.md) - Frontend development tasks
- [Backend Task Plan](../docs/backend_task_plan.md) - Backend development tasks and progress
- [Product Requirements](../docs/ai_resume_prd.md) - Complete product specification
- [Development Rules](../docs/rule.md) - Coding standards and conventions
- [Project Guide](../CLAUDE.md) - Project guide for Claude Code

---

## 📝 Usage Examples

### Resume Parsing

```python
from app.services.parser import parse_resume

# Parse single resume
candidate_data = await parse_resume("path/to/resume.pdf")
print(f"Candidate: {candidate_data['name']}")
print(f"Skills: {candidate_data['skills']}")

# Batch parsing
from app.services.parser import parse_resume_batch

results = await parse_resume_batch([
    "resume1.pdf",
    "resume2.pdf",
    "resume3.pdf"
])
print(f"Parsed {len(results)} resumes")
```

### LLM Integration

```python
from app.services.llm import text_complete

# Use any LLM provider
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
]

# OpenAI
response = await text_complete("gpt-4o", messages)

# DeepSeek
response = await text_complete("deepseek/deepseek-chat", messages)

# Streaming
from app.services.llm import stream_text_complete

async for chunk in stream_text_complete("gpt-4o", messages):
    if isinstance(chunk, str):
        print(chunk, end="", flush=True)
```

### Smart Screening

```python
from app.services.smart_screening_service import SmartScreeningService

service = SmartScreeningService()

# Screen candidates for a position
results = await service.screen_candidates(
    position_id=1,
    max_candidates=50
)

print(f"Found {len(results)} matching candidates")
for candidate in results:
    print(f"- {candidate['name']}: {candidate['overall_score']}/4")
```

---

## 🤝 Contributing

### Development Rules

See [CLAUDE.md](../CLAUDE.md) for:
- Development rules and standards
- Code conventions
- Git workflow
- Business logic rules
- Testing requirements

### Code Quality Standards

This project enforces strict code quality standards:

- **Type Checking**: 100% type annotated (basedpyright)
- **Linting**: ruff with strict rules
- **Formatting**: ruff format (Black-compatible)
- **Testing**: pytest with >80% coverage target
- **Pre-commit**: All checks run automatically before commit

### Git Conventions

**Branch Naming**:
- Feature: `feat/short-description`
- Bug Fix: `fix/issue-number-description`
- Documentation: `docs/short-description`

**Commit Messages** (Conventional Commits):
```
feat(parser): add PDF resume parsing with AI
fix(api): handle null email in candidate creation
docs: update API documentation
test(services): add unit tests for scoring algorithm
```

---

## 📄 License

MIT

---

**Last Updated**: 2025-01-18
**Version**: 0.1.0
**Status**: 100% Complete - All features ready for production
