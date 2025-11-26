# AI Resume Scanning System

> 🚀 **状态**: 100% 完成，已部署到生产环境
> 🌐 **在线访问**: [https://hireyi.vercel.app](https://hireyi.vercel.app)
> 📅 **最后更新**: 2025-11-25

AI-powered resume management and talent screening platform that helps recruiting teams efficiently manage candidates and intelligently match them with job positions.

## 🌟 Features

### Core Features
- 🔐 **Authentication & Authorization**: JWT-based auth with multi-tenant organization support
- 🤖 **AI Resume Parsing**: PyMuPDF + LLM for intelligent resume extraction
- 🎯 **Intelligent Matching**: AI-driven job-candidate scoring (relevance + fit dimensions)
- 📊 **Candidate Management**: Complete CRUD with search, filtering, and batch upload
- 💼 **Position Management**: Job posting management with smart screening
- 📝 **Interview Feedback**: Multi-round evaluations with status tracking
- 📁 **File Storage**: Aliyun OSS with timeout optimization for overseas deployment

### Deployment
- ✅ **Frontend**: Deployed on Vercel with global CDN
- ✅ **Backend**: Deployed on Railway with auto-scaling
- ✅ **Database**: Supabase PostgreSQL with Row Level Security
- ✅ **Storage**: Aliyun OSS with 120s timeout for cross-region stability

## 🛠️ Tech Stack

### Backend
- **Framework**: Python (FastAPI) + Uvicorn
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + JWT
- **AI/LLM**: LiteLLM (OpenAI, DeepSeek, OpenRouter)
- **PDF Parsing**: PyMuPDF (fitz)
- **Storage**: Aliyun OSS (with retry mechanism)
- **Testing**: pytest (135 tests, 78% coverage)

### Frontend
- **Framework**: TypeScript + React 18 + Vite
- **Styling**: TailwindCSS + Radix UI
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form
- **Testing**: Vitest + Playwright

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

> ⚠️ **MVP Configuration Notice**: For development convenience, Email Verification and Row Level Security (RLS) are **DISABLED** in Supabase. These MUST be re-enabled before production deployment. See [CLAUDE.md - MVP Development Configuration](CLAUDE.md#️-mvp-development-configuration-temporary) for details.

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

## 📊 Development Status

### Backend (100% Complete)
- ✅ 35 REST API Endpoints (Authentication, Organizations, Candidates, Positions, Interviews)
- ✅ JWT Authentication + Multi-tenant Architecture
- ✅ AI Resume Parsing with LLM Integration
- ✅ Smart Candidate Matching and Scoring
- ✅ 135 Tests (78% Coverage)
- ✅ Deployed to Railway

### Frontend (100% Complete)
- ✅ Authentication Flow (Login, Register, Email Verification)
- ✅ Organization Management
- ✅ Candidate Management (Upload, Search, View)
- ✅ Position Management (Create, Smart Screening)
- ✅ Interview Feedback System
- ✅ E2E Tests with Playwright
- ✅ Deployed to Vercel

### Infrastructure
- ✅ Database: Supabase PostgreSQL (Schema v2.0 with RLS disabled for MVP)
- ✅ Storage: Aliyun OSS with optimized timeout (120s for overseas deployment)
- ✅ CI/CD: Auto-deployment via Git push
- ✅ Monitoring: Health checks + Application logs

## 🔗 Links

- **Live Application**: https://hireyi.vercel.app
- **Backend API**: https://surprising-endurance-production.up.railway.app
- **API Documentation**: https://surprising-endurance-production.up.railway.app/docs
- **GitHub Repository**: https://github.com/eastdogzhou/hireyi

## 📝 License

MIT
