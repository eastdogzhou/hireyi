# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AI Resume Scanning System** - An AI-powered resume management and talent screening platform that helps recruiting teams efficiently manage candidates and intelligently match them with job positions.

### Core Features
- Automated resume parsing with structured talent database
- AI-driven job-candidate matching and scoring
- Centralized interview feedback and candidate status management

### Technology Stack
- **Backend**: Python (FastAPI) + Supabase
- **Frontend**: TypeScript + React + TailwindCSS
- **Database**: PostgreSQL (via Supabase)
- **AI**: LLM API for resume parsing and scoring

### Important Reference Documents
- **Development Rules**: All coding standards, tools, and conventions are defined in `docs/rule.md`
- **Repository Guidelines**: Contributor workflow summary lives in `AGENTS.md`
- **Product Requirements**: Complete product specification in `docs/ai_resume_prd.md`
- **Backend Task Plan**: Backend development tasks, progress, and status are tracked in `docs/backend_task_plan.md`
- **Frontend Task Plan**: Frontend development tasks, progress, and status are tracked in `docs/frontend_task_plan.md`
- **Backend README**: Comprehensive backend documentation including all 19 API endpoints, service layer details, and troubleshooting is in `backend/README.md`

**IMPORTANT - Documentation Maintenance**:
- When updating backend code (API endpoints, services, features), **ALWAYS update** `backend/README.md` to reflect changes
- The backend README serves as the single source of truth for all backend functionality
- Update the "API Reference" section when adding/modifying API endpoints
- Update the "Service Layer" section when adding/modifying services
- Update the "Development Progress" section when completing features

## Development Tools

This project is a Python backend project, it uses:

- **[`uv`](https://github.com/astral-sh/uv)** For dependency resolution, virtual environments, packaging and publishing.
- **[`pytest`](https://pytest.org/)** For unit testing.
- **[`ruff`](https://github.com/astral-sh/ruff)** For linting and code formatting.
- **[`basedpyright`](https://github.com/DetachHead/basedpyright)** For static type checking.
- **[`pre-commit`](https://pre-commit.com/)** For running commit hooks, typically formatting and linting.


The front end of this project is a modern Web applications, it uses following rules as consititution:

- 采用 Domain-Driven Design
- 技术栈:TypeScript + React + TailwindCSS
- 遵循 TDD 原则
- 必须符合 WCAG 2.1 AA 无障碍标准
- API 优先设计
- 所有组件必须有 Storybook 文档


## Development Environment Setup

### Prerequisites
- **Python**: This is a Python backend project using `uv` for dependency management
- **Git**: Version control
- **uv**: Python dependency resolver, virtual environment manager (install via `curl -LsSf https://astral.sh/uv/install.sh | sh`)

### Initial Setup
```bash
# Install dependencies and create virtual environment
uv sync

# Install pre-commit hooks (MUST be done before any commits)
pre-commit install
```

### Common Commands

#### Python Development
```bash
# ALWAYS use uv for Python execution
uv run python script.py           # Run Python scripts
uv run pytest                     # Run all tests
uv run pytest tests/test_file.py  # Run specific test file
uv run pytest -k test_function    # Run specific test

# Dependency management
uv add <package>                  # Add production dependency
uv add --dev <package>            # Add development dependency
uv remove <package>               # Remove dependency
```

#### Code Quality
```bash
# Linting and formatting (pre-commit runs these automatically)
uv run ruff check .               # Run linter
uv run ruff format .              # Format code
uv run basedpyright               # Type checking

# Pre-commit (runs before every commit)
pre-commit run --all-files        # Manually run all hooks
```

#### Build and Publish
```bash
uv build                          # Build the project
uv publish                        # Publish to PyPI
```

## Architecture and Design Philosophy

### Minimal Design Principle (最小化设计原则)

**CRITICAL**: This project follows a strict minimal design philosophy. Before implementing ANY feature:

1. **Question necessity**: Is each component truly necessary?
2. **Simplest approach**: What's the simplest solution that fulfills requirements?
3. **Maintenance cost**: What's the long-term maintenance burden?
4. **Avoid over-engineering**:
   - NO unnecessary abstractions or patterns
   - NO features not explicitly required
   - NO overly generic solutions for specific problems
   - NO extensive configuration systems when simple hardcoding suffices
   - NO unnecessary layers of indirection

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

### Progressive Complexity
- Start with the simplest working solution
- Add complexity ONLY when requirements explicitly demand it
- Refactor for generalization only after patterns emerge from actual usage
- Fewer lines of clear code > more lines of generic code

### Database Schema

Refer to `docs/ai_resume_prd.md` Section 3 for complete schema. Key tables:

- **candidates**: Candidate/talent pool with AI-extracted structured data
- **positions**: Job positions with requirements
- **position_candidates**: M2M relationship with scoring (relevance_score, fit_score, overall_score)
- **interview_feedbacks**: Interview evaluations timeline
- **users**: System users (future expansion)

### Supabase Integration

This project uses **Supabase** as the primary backend:

- **Database**: PostgreSQL managed by Supabase
- **API**: Auto-generated REST API via PostgREST (minimal custom endpoints)
- **Storage**: Resume files stored in Supabase Storage buckets
- **Authentication**: Supabase Auth (future phase)

**Python SDK Usage Pattern**:
```python
from supabase import create_client, Client

# Initialize client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# CRUD operations
response = supabase.table("candidates").select("*").execute()
response = supabase.table("candidates").insert(data).execute()
```

### AI Integration

**Two core AI functions**:

1. **Resume Parsing**: Extract structured data from PDF/DOC files
2. **Candidate Matching**: Score candidates against job requirements

**Critical AI Service Requirements**:
- MUST include retry mechanisms (use `backoff` library)
- MUST handle API failures gracefully with fallback defaults
- MUST monitor performance (execution time logging)
- See `docs/ai_resume_prd.md` Section 7 for prompt examples

### File Storage

**IMPORTANT**: Resume files are stored in **Aliyun OSS** (not Supabase Storage).

- Use Aliyun OSS SDK for file uploads
- Public URL access for MVP (authentication to be added later)
- Store file path in `candidates.resume_file` field

## Business Rules & Product Decisions

This section documents critical product decisions and business logic rules that MUST be followed during implementation.

### Candidate Management

**Candidate Uniqueness**:
- Candidates are identified using **two-level uniqueness rules**:
  - **Priority 1**: `name` + `phone` combination (if phone is not empty)
  - **Priority 2**: `resume_md5` (if phone is empty)
- When uploading a new resume:
  - Check if candidate exists using the priority rules above
  - If exists: **overwrite** existing data with new resume information and update `resume_md5`
  - If new: create new candidate record
- Contact information stored in separate fields: `phone` (VARCHAR) and `email` (VARCHAR), not JSONB

**Candidate Scoring System**:
- Score is **4-tier rating**: 1, 2, 3, or 4 (NOT 0-100 scale)
- Score is generated by LLM based on comprehensive candidate evaluation
- Score MUST be recalculated when:
  - Candidate information is updated
  - Resume is replaced
  - Skills are modified
- Score calculation references `position_candidates` scores (relevance_score, fit_score)

**Resume Parsing Error Handling**:
- If parsing returns **incomplete data**: allow user to trigger retry
- Support **manual editing** of parsed data before saving
- Allow **manual supplementation** of missing information
- Save manually edited data without re-triggering AI parsing

### Position-Candidate Relationship

**Candidate Deduplication**:
- One candidate can only be linked to one position **once**
- `position_candidates` table has UNIQUE constraint on (position_id, candidate_id)
- When smart screening encounters existing link: **skip silently**
- No duplicate associations allowed

**Smart Screening Strategy**:
- **Two-phase approach**:
  1. **Pre-screening**: Use keyword matching to filter candidates
  2. **AI Ranking**: Use LLM to score and rank pre-screened candidates
- Limit: Select top **100 candidates** maximum
- Can execute multiple times:
  - Skip existing associations
  - Add only new candidates
  - **Recalculate scores** for all associated candidates

**Batch Upload Error Handling**:
- When batch uploading resumes, if one fails: **continue processing others**
- Display simple success/failure report to user
- Do not rollback entire batch on partial failure

**Scoring Weights**:
- All scores use **4-tier rating** (1-4) for display
- Internal calculation: overall_score_numeric = (relevance_score × 0.6 + fit_score × 0.4) × 25 (converts to 0-100 scale)
- Weights are **hardcoded** (not configurable per position)

**Score Fields**:
- `position_candidates.relevance_score`: INTEGER (1-4) - Skill relevance
- `position_candidates.fit_score`: INTEGER (1-4) - Experience fit
- `position_candidates.overall_score`: INTEGER (1-4) - Overall match (for display)
- `position_candidates.overall_score_numeric`: INTEGER (0-100) - Precise score (for sorting)

**Score Recalculation Triggers**:
- When candidate info is updated: recalculate all associated position scores
- When position JD is updated: recalculate scores for all linked candidates
- Scores are cached in `position_candidates` table

**Sorting Rules**:
- Candidate library list: sort by `candidates.score` (4-tier) and creation time
- Position candidate list: sort by `position_candidates.overall_score_numeric` (0-100) for precise ranking

### Status Management

**Global Candidate Status**:
- Status is stored in `position_candidates.current_status`
- Candidate's **global status** = most recently updated non-screening status across all positions
- Status values: `screening`, `interview`, `offer`, `hired`, `rejected`, `withdrawn`

**Status Transition Rules**:
- **No strict workflow**: can transition from any status to any status
- Status changes are recorded in `interview_feedbacks` table
- `interview_feedbacks` serves dual purpose:
  - Interview evaluation records
  - Status change logs

**Status Change Recording**:
- When status changes, create entry in `interview_feedbacks` with:
  - New status
  - Change reason (in `comments` field)
  - Timestamp (auto-generated)

### Interview Feedback

**Multiple Evaluations**:
- **Allow** multiple interviewers to evaluate same candidate for same position/round
- Display all evaluations sorted by `created_at` (chronological order)
- No restrictions on duplicate round evaluations

**Edit Permissions**:
- **Support editing** existing feedback
- **Do NOT support deletion** of feedback records
- Maintain audit trail by keeping all records

### User Management (MVP Phase)

**Basic User System**:
- Implement basic user CRUD operations
- **No authentication/authorization** in first phase
- Store user info in `users` table
- `positions.created_by` and `interview_feedbacks.interviewer` reference `users.id`
- Disable Supabase Row Level Security (RLS) for MVP

### Data Deletion

**Soft Delete Pattern**:
- Use `is_deleted` boolean field (NOT `deleted_at` timestamp)
- When deleting:
  - Set `is_deleted = true` on the record
  - Cascade soft delete to related records
- **Note**: Due to status workflow, actual deletions should be rare
- All queries must filter `WHERE is_deleted = false` (handled in Service layer base class)

**Cascade Soft Delete**:
- Deleting candidate: mark all `position_candidates` and `interview_feedbacks` with `is_deleted = true`
- Deleting position: mark all `position_candidates` with `is_deleted = true`

### Search & Filtering

**Candidate Library Search**:
- **Name**: fuzzy search (partial match)
- **Skills**: array query (contains any specified skill)
- **Score**: range filter (e.g., score >= 3)
- **Date**: created_at range filter
- Do NOT filter by "associated with position" in MVP

**Position Candidate List Filtering**:
- Filter by **status** (e.g., only show "interview" status)
- Sort by **score** (overall_score DESC)
- Sort by **update time** (updated_at DESC)
- Search by **candidate name**

### AI Cost Optimization

**Long Resume Handling**:
- Primary: Use long-context models (e.g., Kimi-K2 with 128K context)
- Fallback: If still exceeds limit, split resume into sections and parse separately, then merge

**Smart Screening Optimization**:
- Pre-screening phase: Simple keyword/rule-based filtering
- AI ranking phase: Only run LLM on pre-screened candidates (max 100-200)
- Avoid calling LLM for entire talent pool (cost prohibitive)

## Code Standards

### Type Annotations (MANDATORY)
This is a `py.typed` project. ALL code MUST have type annotations:
```python
# ✅ REQUIRED
def fetch_candidate(candidate_id: int) -> dict[str, Any]:
    """Fetch candidate by ID."""
    ...

# ❌ FORBIDDEN
def fetch_candidate(candidate_id):
    ...
```

### Docstrings (Sphinx Style)
All public modules, classes, and functions MUST have docstrings:
```python
def parse_resume(file_url: str) -> dict[str, Any]:
    """Parse resume and extract structured data.

    :param file_url: URL of the resume file in Supabase Storage.
    :return: Parsed candidate data with name, skills, highlights, etc.
    :raises ValueError: If file_url is invalid or file cannot be accessed.
    :raises AIServiceError: If LLM API fails after retries.
    """
```

**Note**: Omit `:type` and `:rtype` (type hints provide this). DO include `:raises`.

### Import Organization
```python
# 1. Standard library
import os
from typing import Any

# 2. Third-party
from fastapi import FastAPI
from supabase import Client

# 3. Local application
from app.services import CandidateService
```

### Error Handling
- Use specific exception types, NEVER bare `except:`
- Create custom exceptions for domain-specific errors
- Use `logging` module instead of `print()` statements

### Code Organization
- Max line length: 88 characters (ruff default)
- Functions SHOULD be under 50 lines; MUST refactor if over 100 lines
- Classes follow Single Responsibility Principle
- Constants in UPPER_SNAKE_CASE

## Critical Development Rules

### Mandatory uv Usage for Python Execution

**CRITICAL**: Throughout all testing and development activities, you MUST use `uv` for ANY Python execution.

- **NEVER** invoke Python directly with `python` or `python3` commands
- **ALWAYS** prefix Python commands with `uv run`
- This applies to ALL scenarios including:
  - Running scripts: `uv run python script.py`
  - Running tests: `uv run pytest`
  - Debugging: `uv run python -m pdb script.py`
  - Interactive Python: `uv run python`
  - Any other Python invocation

**Why**: Using `uv run` ensures consistent dependency resolution, correct virtual environment activation, and reproducible builds across all development environments.

**Examples**:
```bash
# ✅ CORRECT
uv run python manage.py migrate
uv run pytest tests/
uv run python -m app.main

# ❌ WRONG - Never use these
python manage.py migrate
pytest tests/
python3 -m app.main
```

### Context7 MCP for Third-Party Libraries

When using ANY third-party library (Supabase, FastAPI, OpenAI, etc.), you MUST:

1. **Use Context7 MCP** to obtain official documentation for the EXACT version
2. **NEVER** assume API patterns from memory or other versions
3. **ALWAYS** verify method signatures, parameter names, and return types
4. **Check version** in `pyproject.toml` before querying documentation

**Example Workflow**:
```bash
# 1. Check installed version
cat pyproject.toml | grep supabase

# 2. Use Context7 MCP to get docs for that specific version
# 3. Read relevant documentation sections
# 4. Write code that strictly follows documented API
```

### Version Consistency
- All dependencies MUST have pinned versions in `pyproject.toml`
- Before implementing features, verify exact package version
- Check changelog when updating dependencies

### Testing Requirements
- All tests use `pytest`
- Test files: `test_*.py` or `*_test.py`
- Test functions: prefix with `test_`
- New features MUST include comprehensive unit tests
- Bug fixes MUST include regression tests
- Target test coverage: >80%

### Pre-commit Hooks
The following MUST pass before any commit:
- `ruff` formatting
- `ruff` linting
- `basedpyright` type checking
- Basic tests (if configured)

### Frontend Development (Future)

When implementing the React frontend:
- Domain-Driven Design
- Tech stack: TypeScript + React + TailwindCSS
- Follow TDD principles
- MUST meet WCAG 2.1 AA accessibility standards
- API-first design
- All components MUST have Storybook documentation

## Git Conventions

### Branch Naming
- Feature: `feat/short-description` (e.g., `feat/resume-parser`)
- Bug Fix: `fix/issue-number-description` (e.g., `fix/123-null-email`)
- Documentation: `docs/short-description`
- Refactor: `refactor/short-description`
- Chore: `chore/short-description`
- Test: `test/short-description`

All branch names MUST be kebab-case (lowercase with hyphens).

### Commit Messages (Conventional Commits)

Format: `<type>(<scope>): <subject>`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting changes (no code logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tools
- `ci`: CI/CD changes
- `build`: Build system changes

**Examples**:
```
feat(parser): add PDF resume parsing with AI
fix(api): handle null email in candidate creation
docs: update setup instructions in README
test(services): add unit tests for scoring algorithm
chore(deps): upgrade supabase to v2.5.0
```

**Subject line**:
- Imperative tense, present tense
- Sentence case
- NO period at end
- Under 50 characters

### Pull Requests
- Title follows commit message convention
- Description MUST include:
  - Clear explanation of changes
  - Related issue links
  - Testing instructions
  - Screenshots (if UI changes)
- Keep PRs small and focused
- All CI checks MUST pass before merging

## Project Structure Reference

Based on `docs/ai_resume_prd.md` Section 8.1:

```
resume-matcher/
├── backend/
│   ├── app/
│   │   ├── api/              # FastAPI route handlers
│   │   ├── services/         # Business logic layer
│   │   ├── models/           # Pydantic models
│   │   ├── config/           # Configuration (Supabase, settings)
│   │   └── utils/            # Utility functions
│   ├── tests/                # pytest test suite
│   ├── pyproject.toml        # uv dependencies and config
│   └── .env.example          # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Supabase client, utilities
│   │   └── types/            # TypeScript type definitions
│   ├── package.json
│   └── tsconfig.json
├── database/
│   ├── schema.sql            # Database table definitions
│   ├── seed.sql              # Initial seed data
│   └── migrations/           # Database migration files
├── data/                     # Sample data for testing
│   ├── jd/                   # Job description files
│   │   └── senior_frontend.md  # Sample JD for frontend position
│   └── resume/               # Sample resume files (PDF)
│       └── *.pdf             # 13 sample resumes for testing
├── docs/
│   ├── rule.md               # Development guidelines (THIS IS LAW)
│   ├── ai_resume_prd.md      # Product requirements
│   ├── backend_task_plan.md  # Backend development tasks
│   └── frontend_task_plan.md # Frontend development tasks
├── CLAUDE.md                 # Claude Code project guide
├── AGENTS.md                 # Contributor workflow guide
└── README.md                 # Project overview and quick start
```

## Documentation Maintenance Protocol

### CRITICAL: Always Update Documentation After Completing Features

**When completing and testing ANY new development feature, you MUST update the corresponding documentation immediately**. This ensures all progress is tracked and future development has a clear reference.

**Documentation Update Requirements**:

1. **Backend Features**:
   - Update `docs/backend_task_plan.md` to reflect completion status
   - Mark tasks as completed with ✅
   - Update completion percentages
   - Add any new insights or implementation notes

2. **Frontend Features**:
   - Update `docs/frontend_task_plan.md` to reflect completion status
   - Mark tasks as completed with ✅
   - Update completion percentages
   - Document any architectural decisions or component patterns

3. **High-Level Changes**:
   - Update `CLAUDE.md` for significant architectural changes
   - Add new business rules or design principles
   - Document any new development conventions

**Documentation Update Workflow**:
```bash
# 1. Complete and test your feature
# 2. Update the relevant task plan document
# 3. Update backend/README.md if applicable
# 4. Update CLAUDE.md for significant changes
# 5. Commit all documentation updates with your feature
git add <feature-files> docs/backend_task_plan.md docs/frontend_task_plan.md CLAUDE.md
git commit -m "feat: implement X feature and update documentation"
```

**Why This Matters**:
- Creates a clear development trail for future contributors
- Ensures project status is always up-to-date
- Prevents knowledge loss between development sessions
- Facilitates handoffs and collaboration

## Backend Documentation Maintenance

### CRITICAL: Always Update backend/README.md

**When making ANY changes to backend code, you MUST update `backend/README.md`**. This is the comprehensive documentation of all backend functionality and serves as the single source of truth.

**Update Checklist**:

1. **Adding/Modifying API Endpoints**:
   - Update the "API Reference" section with the new/modified endpoint
   - Include: method, path, parameters, request body, response format, examples
   - Update the "API Overview" table with endpoint count

2. **Adding/Modifying Services**:
   - Update the "Service Layer" section
   - Document key methods and their purposes
   - Note if service is implemented but not exposed as API yet

3. **Completing Features**:
   - Update "Development Progress" → "Completed Features" section
   - Update "Development Progress" → "Completion Status" table
   - Remove from "Pending Features" if applicable
   - Update the completion percentage at the top of the README

4. **Troubleshooting**:
   - Add new Q&A entries for common issues you encounter
   - Include solutions and debugging commands

5. **Configuration Changes**:
   - Update "Configuration" section if new environment variables are added
   - Update `.env.example` file as well

**Example Workflow**:
```bash
# 1. Implement new feature (e.g., smart screening API endpoint)
# 2. Write tests
# 3. Update backend/README.md:
#    - Add endpoint to "API Reference" section
#    - Update endpoint count (19 → 20)
#    - Move from "Pending Features" to "Completed Features"
#    - Update completion percentage
# 4. Commit changes together
git add backend/app/api/positions.py backend/README.md
git commit -m "feat(api): add smart screening endpoint"
```

## Development Workflow

### Feature Development Process
1. Create feature branch from latest `main`
2. Implement with minimal design principle in mind
3. Write comprehensive tests (>80% coverage)
4. **Update backend/README.md** if backend changes were made
5. Ensure pre-commit hooks pass
6. Create pull request with detailed description
7. Address code review feedback
8. Merge after approval and passing CI

### AI Feature Implementation
When implementing AI-powered features:
1. Read the relevant prompt examples in PRD Section 7
2. Implement retry logic with exponential backoff
3. Add performance monitoring decorators
4. Handle failures gracefully with sensible defaults
5. Log all AI interactions for debugging

### Supabase Development
1. Define schema changes in `database/schema.sql`
2. Test queries in Supabase SQL Editor first
3. Implement Python service layer using Supabase client
4. Add FastAPI wrapper only for complex business logic
5. Use PostgREST auto-generated APIs where possible

## Key Guiding Principles

1. **Simplicity over cleverness** - The simplest solution is usually the best
2. **Documentation accuracy** - Always verify against official docs using Context7 MCP
3. **Type safety** - Comprehensive type annotations everywhere
4. **Test coverage** - High-quality tests prevent regressions
5. **Minimal abstraction** - Add complexity only when truly needed
6. **Progressive enhancement** - Start simple, add features incrementally

## Common Pitfalls to Avoid

1. **DO NOT** use `grep`, `find`, `cat` via Bash - use dedicated Read/Grep/Glob tools
2. **DO NOT** assume library APIs - always verify with Context7 MCP
3. **DO NOT** over-engineer solutions - keep it simple
4. **DO NOT** skip type annotations - this is a typed project
5. **DO NOT** use `print()` - use `logging` module
6. **DO NOT** commit without pre-commit hooks passing
7. **DO NOT** create features not in the PRD without explicit approval

## Environment Variables

Required environment variables (see `docs/ai_resume_prd.md` Section 4.1.1):

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Service
OPENAI_API_KEY=your-openai-api-key

# Application
ENVIRONMENT=development
LOG_LEVEL=INFO
```

## Quick Reference

### Run Tests
```bash
uv run pytest                     # All tests
uv run pytest tests/test_ai.py    # Specific file
uv run pytest -v                  # Verbose output
uv run pytest --cov              # With coverage
```

### Code Quality Checks
```bash
uv run ruff check .              # Lint
uv run ruff format .             # Format
uv run basedpyright              # Type check
pre-commit run --all-files       # All pre-commit hooks
```

### Development Server
```bash
# Backend
cd backend
uv run uvicorn app.main:app --reload --port 8000

# Frontend (future)
cd frontend
npm run dev
```

---

**Remember**: When in doubt, refer to `docs/rule.md` for detailed coding standards and `docs/ai_resume_prd.md` for product requirements. These documents are the source of truth for this project.
