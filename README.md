# AI Resume Scanning System

AI-powered resume management and talent screening platform that helps recruiting teams efficiently manage candidates and intelligently match them with job positions.

## Features

- **AI Resume Parsing**: Automated resume extraction with structured talent database
- **Intelligent Matching**: AI-driven job-candidate matching and scoring
- **Candidate Management**: Centralized interview feedback and candidate status tracking
- **Position Management**: Job posting management with smart screening capabilities

## Tech Stack

### Backend
- Python (FastAPI) + Supabase
- Database: PostgreSQL (via Supabase)
- AI: LiteLLM for multi-provider LLM access
- PDF Parsing: PyMuPDF (fitz)
- Storage: Aliyun OSS

### Frontend
- TypeScript + React 18 + Vite
- TailwindCSS for styling
- React Query (TanStack Query) for server state
- React Router for navigation

## Project Structure

```
hireyi/
├── backend/              # FastAPI backend application
│   ├── app/
│   │   ├── api/         # API endpoints (26 endpoints)
│   │   ├── services/    # Business logic layer
│   │   ├── models/      # Pydantic models
│   │   └── config/      # Configuration
│   ├── tests/           # Test suite (135 tests, 78% coverage)
│   └── README.md        # Backend documentation
│
├── frontend/            # React frontend application
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom hooks
│   │   └── services/    # API client
│   └── README.md        # Frontend documentation
│
├── database/            # Database schema and migrations
│   ├── schema.sql       # Table definitions
│   └── seed.sql         # Seed data
│
├── data/                # Sample data for testing
│   ├── jd/             # Job description files
│   │   └── senior_frontend.md
│   └── resume/         # Sample resume files (PDF)
│       └── *.pdf       # 13 sample resumes
│
├── docs/                # Project documentation
│   ├── ai_resume_prd.md        # Product requirements
│   ├── rule.md                 # Development rules
│   ├── backend_task_plan.md    # Backend development plan
│   └── frontend_task_plan.md   # Frontend development plan
│
├── CLAUDE.md            # Claude Code project guide
└── AGENTS.md            # Contributor workflow guide
```

## Quick Start

> 💡 **快速启动**: 使用一键启动脚本快速启动开发服务器
> ```bash
> ./scripts/start.sh
> ```
> 详见 [Scripts 使用指南](scripts/README.md) 和 [部署文档](docs/deployment.md)

### Prerequisites

- Python 3.11+
- Node.js 18+
- uv (Python package manager)
- Supabase account
- LLM API key (OpenAI, DeepSeek, etc.)

### Backend Setup

```bash
cd backend

# Install dependencies
uv sync

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Initialize database (via Supabase Studio)
# Execute ../database/schema.sql in Supabase SQL Editor

# Start server
uv run uvicorn app.main:app --reload --port 8000
```

Backend will be available at http://localhost:8000

API Documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with backend URL

# Start development server
npm run dev
```

Frontend will be available at http://localhost:5173

## Sample Data

The `data/` directory contains sample data for testing:

### Job Descriptions (`data/jd/`)

- **senior_frontend.md**: Senior Frontend Developer (AI Applications) job description
  - Includes requirements, qualifications, and bonus points
  - Used for testing position creation and candidate matching

### Resumes (`data/resume/`)

Contains 13 sample PDF resumes for testing:
- Frontend developers
- Algorithm engineers
- Java developers
- Technical managers
- AI/ML specialists

These files can be used to test:
- Resume upload and parsing
- Candidate creation
- Smart screening
- Job-candidate matching

## Development

### Backend

```bash
cd backend

# Run tests
uv run pytest

# Run with coverage
uv run pytest --cov

# Code quality checks
uv run ruff check .
uv run ruff format .
uv run basedpyright
```

### Frontend

```bash
cd frontend

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Type check
npm run type-check

# Build for production
npm run build
```

## Documentation

- **快速启动**: [一键启动脚本使用指南](scripts/README.md) - 最快捷的启动方式
- **部署运维**: [部署和运行文档](docs/deployment.md) - 完整的部署和配置指南
- **Backend**: See `backend/README.md` for complete API reference and service documentation
- **Frontend**: See `frontend/README.md` for component architecture and development guide
- **Product Requirements**: See `docs/ai_resume_prd.md` for detailed product specification
- **Development Rules**: See `docs/rule.md` for coding standards and conventions
- **Claude Code Guide**: See `CLAUDE.md` for comprehensive development guide

## Status

- Backend: 100% complete (26 API endpoints, all features implemented)
- Frontend: 100% complete (MVP features, backend integration tested)
- Integration Testing: ✅ Completed

## License

MIT
