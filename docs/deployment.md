# AI Resume Scanning System - 部署指南

> 📅 最后更新: 2025-11-25
> 🎯 适用版本: v1.0.0
> 📖 完整的开发和生产环境部署指南

本文档提供完整的系统部署指南，包括本地开发环境配置和生产环境部署（Vercel + Railway）。

---

## 📋 目录

- [系统要求](#系统要求)
- [本地开发环境](#本地开发环境)
  - [快速启动](#快速启动一键启动)
  - [手动启动](#手动启动)
  - [环境变量配置](#环境变量配置)
  - [数据库初始化](#数据库初始化)
- [生产环境部署](#生产环境部署)
  - [架构概览](#架构概览)
  - [前端部署（Vercel）](#前端部署vercel)
  - [后端部署（Railway）](#后端部署railway)
- [常见问题](#常见问题)
- [监控和维护](#监控和维护)

---

## 系统要求

### 开发环境

#### 必需软件
- **Python**: 3.11 或更高版本
- **Node.js**: 18.0 或更高版本
- **npm**: 9.0 或更高版本
- **uv**: Python 包管理器 ([安装指南](https://github.com/astral-sh/uv))

#### 推荐软件
- **Git**: 版本控制
- **VS Code**: 推荐的代码编辑器

### 云服务账号

#### 必需服务
- **Supabase**: 数据库托管 ([免费注册](https://supabase.com))
- **LLM API**: OpenAI、OpenRouter 或其他兼容服务
- **Aliyun OSS**: 文件存储

#### 部署平台（生产环境）
- **Vercel**: 前端部署 ([免费注册](https://vercel.com))
- **Railway**: 后端部署 ([免费注册](https://railway.app))

### 系统资源

#### 最低配置
- CPU: 2 核
- 内存: 4GB
- 磁盘: 10GB

#### 推荐配置
- CPU: 4 核
- 内存: 8GB
- 磁盘: 20GB SSD

---

## 本地开发环境

### 快速启动（一键启动）

我们提供了一键启动脚本，可以自动启动后端和前端服务。

```bash
# 1. 确保已配置环境变量（首次使用需要配置）
cd /path/to/hireyi

# 2. 运行一键启动脚本
./scripts/start.sh

# 脚本会自动：
# - 检查环境依赖
# - 启动后端服务（端口 8000）
# - 启动前端服务（端口 5173）
# - 在浏览器中打开应用
```

#### 脚本选项

```bash
# 仅启动后端
./scripts/start.sh --backend-only

# 仅启动前端
./scripts/start.sh --frontend-only

# 不自动打开浏览器
./scripts/start.sh --no-browser

# 指定后端端口
./scripts/start.sh --backend-port 8080

# 指定前端端口
./scripts/start.sh --frontend-port 3000
```

#### 停止服务

```bash
# 按 Ctrl+C 停止所有服务
# 或使用 kill 命令
pkill -f "uvicorn app.main:app"
pkill -f "vite"
```

---

### 手动启动

如果需要更多控制或调试，可以手动启动各个服务。

#### 第一步：环境配置

##### 1.1 后端环境配置

```bash
cd backend

# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的配置
# 必填项：
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - SUPABASE_JWT_SECRET
# - OPENROUTER_API_KEY (或其他 LLM API key)
# - ALIYUN_OSS 相关配置
```

**后端 .env 配置示例**：
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_JWT_SECRET=your-jwt-secret

# LLM API
OPENROUTER_API_KEY=sk-or-v1-...
DEFAULT_LLM_MODEL=openrouter/openai/gpt-4o

# Aliyun OSS
ALIYUN_OSS_ACCESS_KEY_ID=your-key-id
ALIYUN_OSS_ACCESS_KEY_SECRET=your-secret
ALIYUN_OSS_BUCKET=your-bucket
ALIYUN_OSS_ENDPOINT=https://oss-cn-shanghai.aliyuncs.com
ALIYUN_OSS_CONNECT_TIMEOUT=120

# Application
ENVIRONMENT=development
LOG_LEVEL=INFO
CORS_ORIGINS=["http://localhost:5173"]
```

##### 1.2 前端环境配置

```bash
cd frontend

# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件
```

**前端 .env 配置示例**：
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Backend API
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_BATCH_UPLOAD=true
```

#### 第二步：安装依赖

##### 2.1 后端依赖

```bash
cd backend

# 安装 uv（如果尚未安装）
curl -LsSf https://astral.sh/uv/install.sh | sh

# 安装 Python 依赖
uv sync

# 安装 pre-commit hooks
pre-commit install
```

##### 2.2 前端依赖

```bash
cd frontend

# 安装 Node.js 依赖
npm install
```

#### 第三步：数据库初始化

```bash
# 在 Supabase Dashboard 中执行数据库 schema
# 1. 打开 Supabase Dashboard: https://supabase.com/dashboard
# 2. 选择你的项目
# 3. 进入 SQL Editor
# 4. 执行 database/schema.sql 中的内容

# 可选：加载测试数据
# 执行 database/seed.sql（如果需要）
```

#### 第四步：启动服务

##### 4.1 启动后端

```bash
cd backend

# 开发模式（自动重载）
uv run uvicorn app.main:app --reload --port 8000

# 生产模式
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**验证后端**：
```bash
# 健康检查
curl http://localhost:8000/health

# 查看 API 文档
# 浏览器打开: http://localhost:8000/docs
```

##### 4.2 启动前端

```bash
cd frontend

# 开发模式
npm run dev

# 生产构建
npm run build
npm run preview
```

**访问应用**：
- 前端: http://localhost:5173
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

---

### 环境变量配置

#### 后端环境变量

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `SUPABASE_URL` | ✅ | Supabase 项目 URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | ✅ | Supabase 匿名密钥 | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase 服务密钥 | `eyJhbGc...` |
| `SUPABASE_JWT_SECRET` | ✅ | Supabase JWT 密钥 | `your-jwt-secret` |
| `OPENROUTER_API_KEY` | ✅ | OpenRouter API 密钥 | `sk-or-v1-...` |
| `DEFAULT_LLM_MODEL` | ⚠️ | 默认 LLM 模型 | `openrouter/openai/gpt-4o` |
| `ALIYUN_OSS_ACCESS_KEY_ID` | ✅ | 阿里云 OSS Key | - |
| `ALIYUN_OSS_ACCESS_KEY_SECRET` | ✅ | 阿里云 OSS Secret | - |
| `ALIYUN_OSS_BUCKET` | ✅ | OSS 存储桶名称 | `my-bucket` |
| `ALIYUN_OSS_ENDPOINT` | ✅ | OSS 端点 | `https://oss-cn-shanghai.aliyuncs.com` |
| `ALIYUN_OSS_CONNECT_TIMEOUT` | ⚠️ | OSS 连接超时（秒） | `120` |
| `ENVIRONMENT` | ⚠️ | 运行环境 | `development` / `production` |
| `LOG_LEVEL` | ⚠️ | 日志级别 | `INFO` / `DEBUG` |
| `CORS_ORIGINS` | ⚠️ | CORS 允许的源 | `["http://localhost:5173"]` |

#### 前端环境变量

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `VITE_SUPABASE_URL` | ✅ | Supabase URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase 匿名密钥 | `eyJhbGc...` |
| `VITE_API_BASE_URL` | ✅ | 后端 API 地址 | `http://localhost:8000` |
| `VITE_API_TIMEOUT` | ⚠️ | API 超时时间（ms） | `30000` |

---

### 数据库初始化

#### 方法 1: Supabase Dashboard（推荐）

1. **登录 Supabase**
   - 访问: https://supabase.com/dashboard
   - 选择你的项目

2. **打开 SQL Editor**
   - 左侧菜单找到 "SQL Editor"
   - 点击 "New Query"

3. **执行 Schema**
   ```bash
   # 复制 schema.sql 内容
   cat database/schema.sql

   # 粘贴到 SQL Editor 并点击 "Run"
   ```

4. **加载测试数据（可选）**
   ```bash
   # 复制 seed.sql 内容
   cat database/seed.sql

   # 执行
   ```

#### 方法 2: 命令行

```bash
# 获取数据库连接字符串
# Supabase Dashboard -> Settings -> Database -> Connection string

# 执行 schema
psql "your-connection-string" < database/schema.sql

# 执行 seed data（可选）
psql "your-connection-string" < database/seed.sql
```

#### 验证数据库

```bash
# 测试数据库连接
cd backend
uv run python -c "from app.config.database import get_supabase; print(get_supabase().table('users').select('count').execute())"
```

---

## 生产环境部署

### 架构概览

#### 推荐部署架构

```
┌─────────────┐      HTTPS      ┌─────────────┐
│   前端      │ ────────────────> │   后端      │
│  (Vercel)   │                   │ (Railway)   │
└─────────────┘                   └─────────────┘
                                         │
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
            ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
            │   Supabase   │    │  Aliyun OSS  │    │  OpenRouter  │
            │ (PostgreSQL) │    │ (文件存储)    │    │  (LLM API)   │
            └──────────────┘    └──────────────┘    └──────────────┘
```

#### 技术栈

- **前端**: Vite + React + TypeScript → Vercel
- **后端**: Python FastAPI + Uvicorn → Railway
- **数据库**: Supabase (PostgreSQL)
- **文件存储**: Aliyun OSS
- **AI服务**: OpenRouter API

---

### 前端部署（Vercel）

#### ✅ 为什么选择 Vercel

- 原生支持 Vite/React 项目
- 自动 CI/CD（Git 推送即部署）
- 全球 CDN 加速
- 免费 HTTPS 证书
- 慷慨的免费额度（100GB 带宽/月）

#### 部署步骤

##### 1. 准备工作

确保项目可以本地构建成功：

```bash
cd frontend
npm install
npm run build
```

检查 `dist/` 目录是否生成。

##### 2. 连接 Vercel

1. 访问 [Vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 **"New Project"**
4. 选择你的 GitHub 仓库

##### 3. 配置项目设置

在 Vercel 项目配置界面：

- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

##### 4. 配置环境变量

在 Vercel 项目设置 → Environment Variables 添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VITE_API_BASE_URL` | `https://your-backend.railway.app` | 后端 API 地址 |
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` | Supabase 匿名密钥 |

⚠️ **关键注意事项**:
- **必须包含完整的协议前缀** (`https://` 或 `http://`)
  - ✅ 正确: `https://surprising-endurance-production.up.railway.app`
  - ❌ 错误: `surprising-endurance-production.up.railway.app`
  - **原因**: 如果缺少协议，axios 会将其当作相对路径，导致请求拼接到前端域名后面
- 必须以 `VITE_` 开头才能在浏览器端访问
- 部署后需要重新构建才能生效
- 环境选择建议：Production, Preview, Development 全选

##### 5. 部署

点击 **"Deploy"** 按钮，等待构建完成（约 1-2 分钟）。

部署成功后，Vercel 会提供：
- 生产环境 URL: `https://hireyi.vercel.app`
- 预览 URL: `https://your-project-git-branch.vercel.app`

---

### 后端部署（Railway）

#### ✅ 为什么选择 Railway

- 自动部署，支持 Python
- 免费 $5/月额度
- 简单的环境变量管理
- 自动健康检查和重启

#### 部署步骤

##### 1. 准备 Railway 配置文件

⚠️ **重要**: 本项目使用 **uv** 作为 Python 依赖管理工具（而非传统的 pip + requirements.txt）。

在项目根目录确认存在以下配置文件：

**nixpacks.toml** (配置构建环境):

```toml
[phases.setup]
nixPkgs = ["python311", "gcc"]

[phases.install]
cmds = [
    "curl -LsSf https://astral.sh/uv/install.sh | sh",
    "cd backend && $HOME/.cargo/bin/uv sync"
]

[start]
cmd = "cd backend && $HOME/.cargo/bin/uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT"

[variables]
PATH = "$HOME/.cargo/bin:$PATH"
```

**railway.toml** (配置部署):

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "cd backend && $HOME/.cargo/bin/uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
```

**backend/Procfile** (备用启动配置):

```
web: $HOME/.cargo/bin/uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**关键点**：
- 使用 `nixpacks.toml` 安装 uv 工具并同步依赖
- 启动命令必须使用 `uv run` 来执行 uvicorn
- uv 安装在 `$HOME/.cargo/bin/` 路径下

##### 2. 创建 Railway 项目

1. 访问 [Railway.app](https://railway.app)
2. 使用 GitHub 登录
3. 点击 **"New Project"**
4. 选择 **"Deploy from GitHub repo"**
5. 选择你的仓库

##### 3. ⚠️ 配置项目根目录（重要！）

由于这是一个 monorepo 项目（包含 backend 和 frontend），必须设置 Root Directory：

1. 进入 Railway 项目 → Service Settings
2. 找到 **"Root Directory"** 设置
3. 设置为：**`backend`**
4. 保存设置

**为什么需要设置**：
- 这样所有构建和部署命令都会在 `backend` 目录中运行
- Railway 会自动检测 `backend/Procfile` 文件
- 避免在命令中重复使用 `cd backend`

##### 4. 配置环境变量

在 Railway 项目 → Variables 添加所有 `backend/.env` 中的变量：

**必需变量**：

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret

# LLM
OPENROUTER_API_KEY=sk-or-v1-...
DEFAULT_LLM_MODEL=openrouter/openai/gpt-4o

# Aliyun OSS
ALIYUN_OSS_ACCESS_KEY_ID=your-access-key
ALIYUN_OSS_ACCESS_KEY_SECRET=your-secret-key
ALIYUN_OSS_ENDPOINT=https://oss-cn-shanghai.aliyuncs.com
ALIYUN_OSS_BUCKET=your-bucket-name
ALIYUN_OSS_CONNECT_TIMEOUT=120

# Application
ENVIRONMENT=production
LOG_LEVEL=INFO
CORS_ORIGINS=["https://hireyi.vercel.app"]
```

**⚠️ 重要配置说明**：

- `ALIYUN_OSS_CONNECT_TIMEOUT`: 设置为 120 秒或更高，以应对海外服务器连接阿里云 OSS 的网络延迟
- `CORS_ORIGINS`: 必须包含前端 Vercel 域名，否则会出现 CORS 错误

##### 5. 部署

Railway 会自动检测配置文件并开始部署。

部署成功后，Railway 会提供：
- 公网地址: `https://your-app.up.railway.app`

##### 6. 配置健康检查

在 Railway 项目设置中启用健康检查：

- **Healthcheck Path**: `/health`

确保后端有健康检查端点（已在 `app/main.py` 实现）：

```python
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

---

## 常见问题

### 本地开发问题

#### Q1: 后端启动失败，提示数据库连接错误？

**A**: 检查以下几点：
1. `.env` 文件中的 Supabase 配置是否正确
2. 网络能否访问 Supabase（检查防火墙/代理）
3. 数据库表是否已创建（执行 `schema.sql`）
4. Supabase 项目是否处于活跃状态（未暂停）

```bash
# 测试连接
cd backend
uv run python -c "from app.config.database import get_supabase; get_supabase().table('candidates').select('*').limit(1).execute()"
```

#### Q2: 前端无法连接后端 API？

**A**: 检查：
1. 后端是否正在运行（`http://localhost:8000/health`）
2. 前端 `.env` 中的 `VITE_API_BASE_URL` 是否正确
3. CORS 配置是否正确（后端 `.env` 中的 `CORS_ORIGINS`）

```bash
# 测试后端健康检查
curl http://localhost:8000/health

# 检查 CORS
curl -H "Origin: http://localhost:5173" -I http://localhost:8000/api/candidates/
```

#### Q3: 端口被占用？

**A**: 更换端口或停止占用端口的进程

```bash
# 查看端口占用
lsof -i :8000  # 后端
lsof -i :5173  # 前端

# 杀死进程
kill -9 <PID>

# 或使用不同端口启动
# 后端
uv run uvicorn app.main:app --reload --port 8080

# 前端
npm run dev -- --port 3000
```

---

### 生产部署问题

#### Q4: 前端 API 请求返回 404 错误（关键问题）

**症状**:
- 前端页面正常加载，但注册/登录失败
- 浏览器开发者工具中看到请求 URL 类似：`https://hireyi.vercel.app/your-backend.railway.app/api/auth/register` (404 错误)
- 后端健康检查正常，但前端无法访问

**根本原因**:

Vercel 环境变量 `VITE_API_BASE_URL` **缺少协议前缀** (`https://`)，导致 axios 将其当作相对路径处理。

**错误配置示例**:
```bash
# ❌ 错误 - 缺少协议
VITE_API_BASE_URL=surprising-endurance-production.up.railway.app

# 导致请求被拼接为：
# https://hireyi.vercel.app/surprising-endurance-production.up.railway.app/api/auth/register
```

**正确配置**:
```bash
# ✅ 正确 - 包含完整协议
VITE_API_BASE_URL=https://surprising-endurance-production.up.railway.app

# 请求会正确发往：
# https://surprising-endurance-production.up.railway.app/api/auth/register
```

**解决步骤**:

1. 登录 Vercel 项目设置 → Environment Variables
2. 找到 `VITE_API_BASE_URL` 变量
3. 修改值，**确保包含** `https://` 前缀
4. 保存后重新部署（Deployments → Redeploy）

**验证方法**:

使用浏览器开发者工具 (F12) → Network 标签：
- ✅ 正确：请求发往 `https://your-backend.railway.app/api/...`
- ❌ 错误：请求发往 `https://your-frontend.vercel.app/your-backend.railway.app/api/...`

#### Q5: 前端访问后端出现 CORS 错误

**原因**: 后端未允许前端域名。

**解决方案**:

在 Railway 后端环境变量中添加前端域名：

```bash
CORS_ORIGINS=["https://your-project.vercel.app"]
```

#### Q6: Railway 部署失败：`uvicorn: command not found`

**问题**: 启动时显示 `/bin/bash: line 1: uvicorn: command not found`

**原因**:
- 启动命令没有使用 `uv run`
- 缺少 `nixpacks.toml` 配置文件
- uv 工具未正确安装

**解决方案**:

1. **确保 `nixpacks.toml` 存在** (项目根目录)
2. **确保 `railway.toml` 启动命令正确**
3. **提交配置并重新部署**:
   ```bash
   git add nixpacks.toml railway.toml backend/Procfile
   git commit -m "fix: configure Railway deployment with uv"
   git push
   ```

**验证部署成功**:
- 访问 `https://your-app.railway.app/health` 应返回 `{"status": "healthy"}`
- 访问 `https://your-app.railway.app/docs` 查看 API 文档

#### Q7: 文件上传失败 / OSS 超时错误

**症状**:
- 上传简历失败
- 错误信息：`TimeoutError('The write operation timed out')`
- `x-oss-request-id` 为空

**根本原因**:

Railway 服务器部署在海外（美国），连接阿里云 OSS（中国）时网络延迟过高，导致上传大文件时超时。

**解决方案**:

1. **确保已配置 OSS 超时参数**（已在最新代码中实现）:
   - 在 Railway 环境变量中添加或确认：`ALIYUN_OSS_CONNECT_TIMEOUT=120`
   - 如果仍然超时，可以尝试增大这个值（如 180 或 240）

2. **代码已自动包含重试机制**:
   - 最多重试 3 次
   - 使用指数退避策略
   - 总超时 300 秒（5 分钟）

3. **验证配置**:
   - 查看 Railway 部署日志
   - 确认看到类似日志：`OSSService initialized with bucket: xxx, endpoint: xxx, timeout: 120s`
   - 如果有重试，会看到：`OSS upload retry 1/3: ...`

**长期优化建议**:
- 使用阿里云全球加速 endpoint（如果可用）
- 考虑将静态文件存储迁移到更接近 Railway 服务器的存储服务

#### Q8: Vercel 构建失败

**常见原因**:

1. **Husky git hooks 错误** (`.git can't be found`):
   - **原因**: `prepare` 脚本在 CI 环境中尝试安装 git hooks
   - **解决方案**: 已修改 `package.json` 的 `prepare` 脚本为 `"husky || true"`

2. **Node 版本不匹配**: 在 `package.json` 指定版本
   ```json
   "engines": {
     "node": ">=18.0.0"
   }
   ```

3. **环境变量未配置**: 确保 `VITE_API_BASE_URL` 已设置

---

## 监控和维护

### 健康检查

```bash
# 后端健康检查（本地）
curl http://localhost:8000/health

# 后端健康检查（生产）
curl https://your-app.railway.app/health

# 预期输出:
# {
#   "status": "healthy",
#   "version": "0.1.0",
#   "environment": "production",
#   "database": "connected",
#   "timestamp": "2025-11-25T12:00:00+00:00"
# }
```

### 日志查看

#### 本地开发日志

```bash
# 后端日志（终端输出）
cd backend
uv run uvicorn app.main:app --reload --port 8000

# 前端日志（浏览器控制台）
# F12 -> Console
```

#### 生产环境日志

**Railway 后端日志**:
1. 访问 Railway Dashboard
2. 选择你的项目
3. 点击 "Deployments" 查看部署日志
4. 点击 "Logs" 查看运行时日志

**Vercel 前端日志**:
1. 访问 Vercel Dashboard
2. 选择你的项目
3. 点击 "Deployments" 查看构建日志
4. 点击 "Functions" 查看运行时日志（如果有 Serverless Functions）

### 性能监控

#### 后端 API 监控

```bash
# 查看 API 响应时间
time curl https://your-app.railway.app/api/candidates/
```

#### 数据库监控

使用 Supabase Dashboard:
- Database → Logs
- Database → Database Health

### 安全建议

#### 生产环境配置

1. **环境变量**
   - ❌ 不要将 `.env` 文件提交到 Git
   - ✅ 使用环境变量管理服务
   - ✅ 定期轮换 API 密钥

2. **CORS 配置**
   - ✅ 限制 CORS 允许的源（不要使用 `*`）
   - ✅ 生产环境使用 HTTPS

3. **API 安全**
   - ✅ 启用 API 速率限制
   - ✅ 使用 API 密钥认证
   - ✅ 监控异常请求

4. **数据库安全**
   - ✅ 启用 Supabase Row Level Security（RLS）
   - ✅ 定期备份数据库
   - ✅ 限制数据库访问 IP

### 更新和维护

#### 更新依赖

```bash
# 后端
cd backend
uv sync

# 前端
cd frontend
npm update
```

#### 数据库迁移

```bash
# 执行新的 migration
psql "your-connection-string" < database/migrations/001_add_new_feature.sql
```

#### 备份

```bash
# 备份 Supabase 数据库
# Supabase Dashboard -> Database -> Backups

# 手动备份
pg_dump "your-connection-string" > backup_$(date +%Y%m%d).sql
```

---

## 部署检查清单

### 部署前

- [ ] 本地测试通过（前端 + 后端）
- [ ] 所有环境变量已准备好
- [ ] 数据库已创建并运行迁移
- [ ] OSS bucket 已创建并配置权限
- [ ] LLM API key 已获取并测试

### 前端部署（Vercel）

- [ ] Vercel 项目已创建
- [ ] 构建配置正确（Root Directory: `frontend`）
- [ ] 环境变量 `VITE_API_BASE_URL` 已配置
  - [ ] **包含完整协议前缀** (`https://`)
  - [ ] 环境选择：Production, Preview, Development 全选
- [ ] 部署成功并可访问
- [ ] **使用浏览器开发者工具验证 API 请求 URL 正确**（F12 → Network）

### 后端部署（Railway）

- [ ] Railway 项目已创建
- [ ] **Railway 配置文件已创建**:
  - [ ] `nixpacks.toml` 存在（配置 uv 安装）
  - [ ] `railway.toml` 存在（配置启动命令）
  - [ ] `backend/Procfile` 存在
  - [ ] 启动命令使用 `uv run uvicorn`
- [ ] **Root Directory 设置为 `backend`**
- [ ] 所有环境变量已配置
  - [ ] Supabase 配置
  - [ ] LLM API 配置
  - [ ] Aliyun OSS 配置（包括 `ALIYUN_OSS_CONNECT_TIMEOUT=120`）
  - [ ] CORS 配置（包含前端域名）
- [ ] 健康检查端点正常（`/health`）
- [ ] API 文档可访问（`/docs`）
- [ ] 部署日志无错误（无 `uvicorn: command not found`）

### 功能测试

- [ ] **前端可以访问后端 API**
  - [ ] 打开浏览器开发者工具 (F12) → Network 标签
  - [ ] 尝试注册/登录
  - [ ] 验证请求 URL 正确发往后端域名
  - [ ] 验证没有 404 或 CORS 错误
- [ ] 用户可以上传简历
- [ ] AI 解析功能正常
- [ ] 职位筛选功能正常
- [ ] 文件上传到 OSS 成功
- [ ] 数据库读写正常

---

## 相关文档

- [Backend README](../backend/README.md) - 后端完整文档
- [Frontend README](../frontend/README.md) - 前端完整文档
- [开发规范](./rule.md) - 代码规范和约定
- [项目指南](../CLAUDE.md) - 项目开发指南

---

## 更新日志

| 日期 | 版本 | 说明 |
|------|------|------|
| 2025-11-25 | 2.0 | 整合本地开发和生产部署文档，添加 OSS 超时问题解决方案 |
| 2025-11-25 | 1.2 | 添加关键排查指南：Vercel 环境变量必须包含协议前缀 |
| 2025-01-25 | 1.1 | 更新 Railway 部署配置，添加 uv 工具支持和故障排除 |
| 2025-10-22 | 1.0 | 初始版本 |

---

**最后更新**: 2025-11-25
**维护者**: AI Resume Scanning System Team
