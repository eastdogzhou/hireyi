# AI Resume Scanning System - 部署和运行指南

> 📅 最后更新: 2025-10-20
> 🎯 适用版本: v1.0.0
> 📖 快速上手指南

本文档提供完整的系统部署和运行指南，包括开发环境和生产环境的配置说明。

---

## 📋 目录

- [系统要求](#系统要求)
- [快速启动（一键启动）](#快速启动一键启动)
- [手动启动](#手动启动)
- [生产环境部署](#生产环境部署)
- [环境变量配置](#环境变量配置)
- [数据库初始化](#数据库初始化)
- [常见问题](#常见问题)
- [监控和日志](#监控和日志)

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
- **Docker**: 容器化部署（生产环境）

### 云服务账号

#### 必需服务
- **Supabase**: 数据库托管 ([免费注册](https://supabase.com))
- **LLM API**: OpenAI、DeepSeek 或其他兼容服务

#### 可选服务
- **Aliyun OSS**: 文件存储（可选，默认使用本地存储）

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

## 快速启动（一键启动）

### 使用一键启动脚本

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

### 脚本选项

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

### 停止服务

```bash
# 按 Ctrl+C 停止所有服务
# 或使用 kill 命令
pkill -f "uvicorn app.main:app"
pkill -f "vite"
```

---

## 手动启动

如果需要更多控制或调试，可以手动启动各个服务。

### 第一步：环境配置

#### 1.1 后端环境配置

```bash
cd backend

# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的配置
# 必填项：
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - OPENAI_API_KEY (或其他 LLM API key)
```

**后端 .env 配置示例**：
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# LLM API
OPENAI_API_KEY=sk-...
DEFAULT_LLM_MODEL=gpt-4o

# Aliyun OSS (可选)
ALIYUN_OSS_ACCESS_KEY_ID=your-key-id
ALIYUN_OSS_ACCESS_KEY_SECRET=your-secret
ALIYUN_OSS_BUCKET=your-bucket
ALIYUN_OSS_ENDPOINT=oss-cn-shanghai.aliyuncs.com

# Application
ENVIRONMENT=development
LOG_LEVEL=INFO
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

#### 1.2 前端环境配置

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

### 第二步：安装依赖

#### 2.1 后端依赖

```bash
cd backend

# 安装 uv（如果尚未安装）
curl -LsSf https://astral.sh/uv/install.sh | sh

# 安装 Python 依赖
uv sync

# 安装 pre-commit hooks
pre-commit install
```

#### 2.2 前端依赖

```bash
cd frontend

# 安装 Node.js 依赖
npm install
```

### 第三步：数据库初始化

```bash
# 在 Supabase Dashboard 中执行数据库 schema
# 1. 打开 Supabase Dashboard: https://supabase.com/dashboard
# 2. 选择你的项目
# 3. 进入 SQL Editor
# 4. 执行 database/schema.sql 中的内容

# 可选：加载测试数据
# 执行 database/seed.sql（如果需要）
```

### 第四步：启动服务

#### 4.1 启动后端

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

#### 4.2 启动前端

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

## 生产环境部署

### 使用 Docker（推荐）

#### 1. 构建 Docker 镜像

**后端 Dockerfile**:
```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装 uv
RUN pip install uv

# 复制依赖文件
COPY pyproject.toml uv.lock ./

# 安装依赖
RUN uv sync --no-dev

# 复制应用代码
COPY app ./app

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**前端 Dockerfile**:
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制应用代码
COPY . .

# 构建生产版本
RUN npm run build

# 使用 nginx 提供静态文件
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 2. Docker Compose

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  backend-data:
```

#### 3. 部署命令

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart
```

### 使用云平台部署

#### Vercel（前端）

```bash
cd frontend

# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

#### Railway / Render（后端）

1. 连接 GitHub 仓库
2. 设置环境变量
3. 自动部署

---

## 环境变量配置

### 后端环境变量

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `SUPABASE_URL` | ✅ | Supabase 项目 URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | ✅ | Supabase 匿名密钥 | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase 服务密钥 | `eyJhbGc...` |
| `OPENAI_API_KEY` | ✅ | OpenAI API 密钥 | `sk-...` |
| `DEFAULT_LLM_MODEL` | ⚠️ | 默认 LLM 模型 | `gpt-4o` |
| `ALIYUN_OSS_ACCESS_KEY_ID` | ❌ | 阿里云 OSS Key | - |
| `ALIYUN_OSS_ACCESS_KEY_SECRET` | ❌ | 阿里云 OSS Secret | - |
| `ALIYUN_OSS_BUCKET` | ❌ | OSS 存储桶名称 | `my-bucket` |
| `ALIYUN_OSS_ENDPOINT` | ❌ | OSS 端点 | `oss-cn-shanghai.aliyuncs.com` |
| `ENVIRONMENT` | ⚠️ | 运行环境 | `development` / `production` |
| `LOG_LEVEL` | ⚠️ | 日志级别 | `INFO` / `DEBUG` |
| `CORS_ORIGINS` | ⚠️ | CORS 允许的源 | `["http://localhost:5173"]` |

### 前端环境变量

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `VITE_SUPABASE_URL` | ✅ | Supabase URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase 匿名密钥 | `eyJhbGc...` |
| `VITE_API_BASE_URL` | ✅ | 后端 API 地址 | `http://localhost:8000` |
| `VITE_API_TIMEOUT` | ⚠️ | API 超时时间（ms） | `30000` |

---

## 数据库初始化

### 方法 1: Supabase Dashboard（推荐）

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

### 方法 2: 命令行

```bash
# 获取数据库连接字符串
# Supabase Dashboard -> Settings -> Database -> Connection string

# 执行 schema
psql "your-connection-string" < database/schema.sql

# 执行 seed data（可选）
psql "your-connection-string" < database/seed.sql
```

### 验证数据库

```bash
# 测试数据库连接
cd backend
uv run python -c "from app.config.database import get_supabase; print(get_supabase().table('users').select('count').execute())"
```

---

## 常见问题

### Q1: 后端启动失败，提示数据库连接错误？

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

### Q2: 前端无法连接后端 API？

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

### Q3: 简历上传失败？

**A**: 检查：
1. Aliyun OSS 配置是否正确（如果启用）
2. LLM API 密钥是否有效
3. PyMuPDF 依赖是否已安装

```bash
# 测试 LLM 连接
cd backend
uv run python -c "from app.services.llm import text_complete; import asyncio; print(asyncio.run(text_complete('gpt-4o', [{'role': 'user', 'content': 'hello'}])))"
```

### Q4: 端口被占用？

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

### Q5: Docker 部署失败？

**A**: 常见原因：
1. Docker 镜像构建失败 → 查看构建日志
2. 环境变量未正确传递 → 检查 `docker-compose.yml`
3. 网络问题 → 检查容器网络配置

```bash
# 查看容器日志
docker-compose logs backend
docker-compose logs frontend

# 进入容器调试
docker-compose exec backend bash
```

---

## 监控和日志

### 日志查看

#### 后端日志

```bash
# 开发模式（终端输出）
cd backend
uv run uvicorn app.main:app --reload --port 8000

# 生产模式（写入文件）
uv run uvicorn app.main:app --log-config logging.yaml

# 查看日志
tail -f logs/app.log
```

#### 前端日志

```bash
# 浏览器控制台
# F12 -> Console

# Vite 开发服务器日志
cd frontend
npm run dev
```

### 健康检查

```bash
# 后端健康检查
curl http://localhost:8000/health

# 预期输出:
# {
#   "status": "healthy",
#   "version": "0.1.0",
#   "environment": "development",
#   "database": "connected"
# }
```

### 性能监控

#### 后端 API 监控

```bash
# 查看 API 响应时间
# Swagger UI: http://localhost:8000/docs
# 或使用 curl 测量
time curl http://localhost:8000/api/candidates/
```

#### 数据库监控

使用 Supabase Dashboard:
- Database -> Logs
- Database -> Database Health

---

## 安全建议

### 生产环境配置

1. **环境变量**
   - ❌ 不要将 `.env` 文件提交到 Git
   - ✅ 使用环境变量管理服务（如 AWS Secrets Manager）
   - ✅ 定期轮换 API 密钥

2. **CORS 配置**
   - ✅ 限制 CORS 允许的源（不要使用 `*`）
   - ✅ 生产环境使用 HTTPS

3. **API 安全**
   - ✅ 启用 API 速率限制
   - ✅ 使用 API 密钥认证（后续版本）
   - ✅ 监控异常请求

4. **数据库安全**
   - ✅ 启用 Supabase Row Level Security（RLS）
   - ✅ 定期备份数据库
   - ✅ 限制数据库访问 IP

---

## 性能优化

### 后端优化

```python
# 使用多 worker 进程
uv run uvicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker

# 启用 gzip 压缩（在反向代理中配置）
```

### 前端优化

```bash
# 生产构建优化
npm run build

# 使用 CDN 加速静态资源
# 启用浏览器缓存
```

### 数据库优化

- 为常用查询字段添加索引（已在 schema.sql 中定义）
- 使用连接池管理数据库连接
- 定期清理软删除的数据

---

## 更新和维护

### 更新依赖

```bash
# 后端
cd backend
uv sync

# 前端
cd frontend
npm update
```

### 数据库迁移

```bash
# 执行新的 migration
psql "your-connection-string" < database/migrations/001_add_new_feature.sql
```

### 备份

```bash
# 备份 Supabase 数据库
# Supabase Dashboard -> Database -> Backups

# 手动备份
pg_dump "your-connection-string" > backup_$(date +%Y%m%d).sql
```

---

## 相关文档

- [Backend README](../backend/README.md) - 后端完整文档
- [Frontend README](../frontend/README.md) - 前端完整文档
- [开发规范](./rule.md) - 代码规范和约定
- [项目指南](../CLAUDE.md) - 项目开发指南

---

**最后更新**: 2025-10-20
**维护者**: AI Resume Scanning System Team
