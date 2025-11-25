# AI Resume Scanning System - 部署指南

本文档提供完整的生产环境部署指南，采用前后端分离架构。

## 目录

- [架构概览](#架构概览)
- [前端部署（Vercel）](#前端部署vercel)
- [后端部署选项](#后端部署选项)
- [环境变量配置](#环境变量配置)
- [部署检查清单](#部署检查清单)
- [常见问题](#常见问题)

---

## 架构概览

### 推荐部署架构

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

### 技术栈

- **前端**: Vite + React + TypeScript
- **后端**: Python FastAPI + Uvicorn
- **数据库**: Supabase (PostgreSQL)
- **文件存储**: Aliyun OSS
- **AI服务**: OpenRouter API

---

## 前端部署（Vercel）

### ✅ 为什么选择 Vercel

- 原生支持 Vite/React 项目
- 自动 CI/CD（Git 推送即部署）
- 全球 CDN 加速
- 免费 HTTPS 证书
- 慷慨的免费额度（100GB 带宽/月）

### 部署步骤

#### 1. 准备工作

确保项目可以本地构建成功：

```bash
cd frontend
npm install
npm run build
```

检查 \`dist/\` 目录是否生成。

#### 2. 连接 Vercel

1. 访问 [Vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 **"New Project"**
4. 选择你的 GitHub 仓库

#### 3. 配置项目设置

在 Vercel 项目配置界面：

**Framework Preset**: Vite
**Root Directory**: \`frontend\`
**Build Command**: \`npm run build\`
**Output Directory**: \`dist\`
**Install Command**: \`npm install\`

#### 4. 配置环境变量

在 Vercel 项目设置 → Environment Variables 添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| \`VITE_API_BASE_URL\` | \`https://your-backend.railway.app\` | 后端 API 地址 |

⚠️ **注意**:
- 必须以 \`VITE_\` 开头才能在浏览器端访问
- 部署后需要重新构建才能生效

#### 5. 部署

点击 **"Deploy"** 按钮，等待构建完成（约 1-2 分钟）。

部署成功后，Vercel 会提供：
- 生产环境 URL: \`https://your-project.vercel.app\`
- 预览 URL: \`https://your-project-git-branch.vercel.app\`

#### 6. 自定义域名（可选）

在 Vercel 项目设置 → Domains 可以绑定自己的域名。

---

## 后端部署选项

### 方案对比

| 平台 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **Railway** | 自动部署，支持 Python，免费 $5/月 | 免费额度有限 | ⭐⭐⭐⭐⭐ |
| **Render** | 完全免费 tier | 冷启动（15分钟无请求休眠） | ⭐⭐⭐⭐ |
| **Fly.io** | 全球部署，性能好 | 配置稍复杂 | ⭐⭐⭐⭐ |
| **云服务器** | 完全控制 | 需要运维知识，成本较高 | ⭐⭐⭐ |

---

## 后端部署：Railway（推荐）

### 部署步骤

#### 1. 准备 Railway 配置文件

在项目根目录创建 \`railway.toml\`：

\`\`\`toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
\`\`\`

#### 2. 创建 Railway 项目

1. 访问 [Railway.app](https://railway.app)
2. 使用 GitHub 登录
3. 点击 **"New Project"**
4. 选择 **"Deploy from GitHub repo"**
5. 选择你的仓库

#### 3. 配置项目

**Root Directory**: \`backend\`（如果 Railway 没有自动检测）

#### 4. 配置环境变量

在 Railway 项目 → Variables 添加所有 \`backend/.env\` 中的变量：

**必需变量**：

\`\`\`bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# LLM
OPENROUTER_API_KEY=sk-or-v1-...
DEFAULT_LLM_MODEL=openrouter/openai/gpt-4o

# Aliyun OSS
ALIYUN_OSS_ACCESS_KEY_ID=your-access-key
ALIYUN_OSS_ACCESS_KEY_SECRET=your-secret-key
ALIYUN_OSS_ENDPOINT=https://oss-cn-shanghai.aliyuncs.com
ALIYUN_OSS_BUCKET=your-bucket-name

# Application
ENVIRONMENT=production
LOG_LEVEL=INFO
\`\`\`

**CORS 配置**：

添加前端域名到 \`CORS_ORIGINS\`（或修改代码）：

\`\`\`bash
CORS_ORIGINS=["https://your-project.vercel.app"]
\`\`\`

#### 5. 部署

Railway 会自动检测 \`requirements.txt\` 并开始部署。

部署成功后，Railway 会提供：
- 公网地址: \`https://your-app.up.railway.app\`

#### 6. 配置健康检查

在 Railway 项目设置中启用健康检查：

**Healthcheck Path**: \`/health\`

确保后端有健康检查端点（已在 \`app/main.py\` 实现）：

\`\`\`python
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
\`\`\`

---

## 环境变量配置

### 前端环境变量

在 Vercel 项目设置中配置：

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| \`VITE_API_BASE_URL\` | \`https://api.example.com\` | 后端 API 基础地址 |

### 后端环境变量

在后端部署平台（Railway/Render/服务器）配置：

#### 核心配置

\`\`\`bash
# 应用环境
ENVIRONMENT=production
LOG_LEVEL=INFO
DEBUG=false

# CORS（前端域名）
CORS_ORIGINS=["https://your-project.vercel.app"]
\`\`\`

#### Supabase 配置

\`\`\`bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
\`\`\`

在 Supabase 项目设置 → API 中获取。

#### LLM 配置

\`\`\`bash
OPENROUTER_API_KEY=sk-or-v1-...
DEFAULT_LLM_MODEL=openrouter/openai/gpt-4o
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=2000
\`\`\`

在 [OpenRouter.ai](https://openrouter.ai) 获取 API Key。

#### Aliyun OSS 配置

\`\`\`bash
ALIYUN_OSS_ACCESS_KEY_ID=LTAI...
ALIYUN_OSS_ACCESS_KEY_SECRET=...
ALIYUN_OSS_ENDPOINT=https://oss-cn-shanghai.aliyuncs.com
ALIYUN_OSS_BUCKET=your-bucket-name
ALIYUN_OSS_BASE_PATH=resumes/
ALIYUN_OSS_PUBLIC_READ=true
\`\`\`

在阿里云 OSS 控制台获取。

---

## 部署检查清单

### 部署前

- [ ] 本地测试通过（前端 + 后端）
- [ ] 所有环境变量已准备好
- [ ] 数据库已创建并运行迁移
- [ ] OSS bucket 已创建并配置权限
- [ ] LLM API key 已获取并测试

### 前端部署

- [ ] Vercel 项目已创建
- [ ] 构建配置正确（Root Directory: \`frontend\`）
- [ ] 环境变量 \`VITE_API_BASE_URL\` 已配置
- [ ] 部署成功并可访问
- [ ] 域名 DNS 已配置（如使用自定义域名）

### 后端部署

- [ ] 部署平台已选择（Railway/Render/服务器）
- [ ] 所有环境变量已配置
- [ ] 健康检查端点正常（\`/health\`）
- [ ] API 文档可访问（\`/docs\`）
- [ ] CORS 配置正确（允许前端域名）

### 功能测试

- [ ] 前端可以访问后端 API
- [ ] 用户可以上传简历
- [ ] AI 解析功能正常
- [ ] 职位筛选功能正常
- [ ] 文件上传到 OSS 成功
- [ ] 数据库读写正常

### 安全检查

- [ ] 所有 API keys 使用环境变量（未提交到 Git）
- [ ] HTTPS 已启用
- [ ] CORS 配置了白名单（不是 \`*\`）
- [ ] Supabase RLS 已配置（生产环境）
- [ ] 敏感日志已关闭（不输出密码等）

---

## 常见问题

### 1. 前端访问后端出现 CORS 错误

**原因**: 后端未允许前端域名。

**解决方案**:

在后端环境变量中添加前端域名：

\`\`\`bash
CORS_ORIGINS=["https://your-project.vercel.app"]
\`\`\`

或修改 \`backend/app/config/settings.py\`:

\`\`\`python
cors_origins: list[str] = Field(
    default=["https://your-project.vercel.app"]
)
\`\`\`

### 2. Railway/Render 部署失败

**常见原因**:

1. **依赖安装失败**: 检查 \`requirements.txt\` 是否正确
2. **启动命令错误**: 确认 \`PORT\` 环境变量正确使用
3. **内存不足**: 考虑升级 plan

**调试方法**:

查看部署日志，搜索错误关键词。

### 3. Vercel 构建失败

**常见原因**:

1. **Node 版本不匹配**: 在 \`package.json\` 指定版本
   \`\`\`json
   "engines": {
     "node": ">=18.0.0"
   }
   \`\`\`

2. **依赖安装失败**: 删除 \`node_modules\` 和 \`package-lock.json\`，重新安装

3. **环境变量未配置**: 确保 \`VITE_API_BASE_URL\` 已设置

### 4. API 请求超时

**原因**:
- Render 免费 tier 冷启动
- LLM API 响应慢

**解决方案**:

1. 增加前端请求超时时间
2. 后端启用请求缓存
3. 考虑升级 Render plan 避免冷启动

### 5. 文件上传失败

**检查**:

1. OSS bucket 权限配置
2. CORS 配置（允许前端域名）
3. Access Key 是否正确
4. 文件大小是否超过限制

### 6. 数据库连接失败

**检查**:

1. Supabase URL 和 Key 是否正确
2. Supabase 项目是否暂停（免费 tier 1周无活动会暂停）
3. 网络连接是否正常

---

## 更新日志

| 日期 | 版本 | 说明 |
|------|------|------|
| 2025-10-22 | 1.0 | 初始版本 |
