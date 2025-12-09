# Frontend - AI Resume Scanning System

> 📅 最后更新: 2025-11-25
> 📊 完成度: 100%
> 🎯 状态: 已部署到 Vercel 生产环境
> 🌐 在线访问: https://hireyi.vercel.app

Modern React application for AI-powered resume management and talent screening.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Development](#️-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### Implemented Features (100% Complete)

#### 🔐 Authentication & Authorization
- ✅ User registration with email verification
- ✅ Login with JWT authentication
- ✅ Automatic token refresh
- ✅ Protected routes with authentication guards
- ✅ Organization-based access control

#### 🏢 Organization Management
- ✅ Create and manage organizations
- ✅ Invite team members
- ✅ Role-based permissions (Creator, Admin, Interviewer)
- ✅ Multi-tenant data isolation

#### 📊 Candidate Management
- ✅ Upload resume files (PDF)
- ✅ AI-powered resume parsing
- ✅ Candidate search and filtering
- ✅ Batch upload with error handling
- ✅ View candidate details with AI-extracted information
- ✅ Global candidate scoring (0-10 scale)

#### 💼 Position Management
- ✅ Create and edit job positions
- ✅ Smart screening with AI matching
- ✅ View matched candidates with scores
- ✅ Position status management
- ✅ Job description management

#### 📝 Interview Feedback
- ✅ Multi-round interview evaluations
- ✅ Rating system (1-4 scale)
- ✅ Status change tracking
- ✅ Interview timeline view
- ✅ Feedback history

#### 🎨 UI/UX
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Loading states and error handling
- ✅ Toast notifications
- ✅ Modal dialogs
- ✅ Form validation
- ✅ Accessibility best practices

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite |
| **Styling** | TailwindCSS + Radix UI |
| **State Management** | React Query (TanStack Query) |
| **Routing** | React Router v6 |
| **Forms** | React Hook Form |
| **HTTP Client** | Axios |
| **Testing** | Vitest + Playwright |
| **Authentication** | Supabase Auth + JWT |
| **Code Quality** | ESLint + Prettier + TypeScript |

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Common UI components (Button, Input, Modal, etc.)
│   │   ├── auth/           # Authentication components
│   │   ├── organization/   # Organization components
│   │   ├── candidate/      # Candidate components
│   │   ├── position/       # Position components
│   │   └── interview/      # Interview feedback components
│   │
│   ├── pages/              # Page components
│   │   ├── auth/           # Auth pages (Login, Register, Verify)
│   │   ├── organization/   # Organization pages
│   │   ├── candidate/      # Candidate pages
│   │   ├── position/       # Position pages
│   │   └── interview/      # Interview pages
│   │
│   ├── services/           # API services
│   │   ├── api.ts          # Axios instance configuration
│   │   ├── auth.ts         # Authentication API
│   │   ├── organization.ts # Organization API
│   │   ├── candidate.ts    # Candidate API
│   │   ├── position.ts     # Position API
│   │   └── interview.ts    # Interview API
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts      # Authentication hook
│   │   └── useToast.ts     # Toast notification hook
│   │
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.tsx # Authentication context
│   │   └── OrganizationContext.tsx # Organization context
│   │
│   ├── types/              # TypeScript type definitions
│   │   ├── auth.ts
│   │   ├── candidate.ts
│   │   ├── position.ts
│   │   └── interview.ts
│   │
│   ├── utils/              # Utility functions
│   │   ├── format.ts       # Formatting helpers
│   │   └── constants.ts    # Constants
│   │
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
│
├── e2e/                    # E2E tests (Playwright)
│   ├── auth.spec.ts
│   ├── candidate.spec.ts
│   └── position.spec.ts
│
├── public/                 # Static assets
├── .env.example            # Environment variables template
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # TailwindCSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18.0 or higher
- **npm**: 9.0 or higher
- **Backend API**: Running locally or deployed

### Installation

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

Application will be available at http://localhost:5173

### Environment Variables

```bash
# Backend API (MUST include protocol)
VITE_API_BASE_URL=http://localhost:8000  # Local
# VITE_API_BASE_URL=https://your-backend.railway.app  # Production

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**⚠️ Important**:
- Environment variable names **must** start with `VITE_` to be accessible in the browser
- `VITE_API_BASE_URL` **must** include the full protocol (`http://` or `https://`)

---

## 🛠️ Development

### Development Server

```bash
# Start development server with hot reload
npm run dev

# Start on specific port
npm run dev -- --port 3000

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Fix lint errors
npm run lint:fix

# Format code
npm run format
```

---

## 🧪 Testing

### Unit Tests (Vitest)

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug
```

---

## 📦 Deployment

### Vercel (Production)

The frontend is deployed to Vercel with automatic CI/CD from GitHub.

**Configuration**:
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

**Environment Variables** (set in Vercel Dashboard):
```bash
# CRITICAL: Must include https:// protocol
VITE_API_BASE_URL=https://surprising-endurance-production.up.railway.app

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**⚠️ Common Deployment Issues**:

1. **404 errors when calling API**:
   - **Problem**: `VITE_API_BASE_URL` is missing `https://` protocol
   - **Solution**: Add `https://` prefix in Vercel environment variables
   - **Why**: Without protocol, axios treats it as relative path

2. **CORS errors**:
   - **Problem**: Backend doesn't allow frontend domain
   - **Solution**: Add frontend domain to backend `CORS_ORIGINS` in Railway

See [Deployment Guide](../docs/deployment.md) for detailed instructions.

---

## 🔧 Troubleshooting

### Common Issues

**Q1: Environment variables not working**

```bash
# ❌ Wrong - won't be accessible
API_BASE_URL=...

# ✅ Correct - must start with VITE_
VITE_API_BASE_URL=...
```

**Q2: API requests failing with 404**

```bash
# ❌ Wrong - missing protocol
VITE_API_BASE_URL=your-backend.railway.app

# ✅ Correct - includes https://
VITE_API_BASE_URL=https://your-backend.railway.app
```

**Q3: Changes to .env not applied**

```bash
# Restart dev server after .env changes
# Or rebuild for production
npm run build
```

**Q4: TypeScript errors**

```bash
# Check types
npm run type-check

# Restart TypeScript server in VSCode
# Cmd+Shift+P -> "TypeScript: Restart TS Server"
```

---

## 📊 Development Status

### Completed (100%)
- ✅ **Authentication**: Complete with JWT and email verification
- ✅ **Organization Management**: Complete with invite system
- ✅ **Candidate Management**: Complete with AI parsing and upload
- ✅ **Position Management**: Complete with smart screening
- ✅ **Interview System**: Complete with multi-round evaluations
- ✅ **UI/UX**: Complete with responsive design
- ✅ **Testing**: E2E tests for critical flows
- ✅ **Deployment**: Live on Vercel

### Production Deployment
- **Platform**: Vercel
- **URL**: https://hireyi.vercel.app
- **Backend**: https://surprising-endurance-production.up.railway.app
- **CI/CD**: Automatic deployment on git push

---

## 📖 Related Documentation

- **Deployment Guide**: [docs/deployment.md](../docs/deployment.md)
- **Backend API**: [backend/README.md](../backend/README.md)
- **Product Requirements**: [docs/ai_resume_prd.md](../docs/ai_resume_prd.md)
- **Development Guide**: [CLAUDE.md](../CLAUDE.md)

---

**Last Updated**: 2025-11-25
**Status**: Production Ready
**Maintainer**: AI Resume Scanning System Team
