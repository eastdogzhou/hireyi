✅ 前端部署到 Vercel（可行）

  为什么可行：
  - 你的前端是 Vite + React + TypeScript，Vercel 原生支持
  - 纯静态网站，不需要服务器端渲染
  - Vercel 会自动检测并构建

  部署步骤逻辑：
  1. 连接 GitHub 仓库 → Vercel 会自动识别 frontend/ 目录
  2. 配置构建设置：
    - Root Directory: frontend
    - Build Command: npm run build (Vite 默认)
    - Output Directory: dist
  3. 配置环境变量：
    - VITE_API_BASE_URL = 你的后端API地址（见下文）

  ---
  ❌ 后端无法部署到 Vercel

  原因：
  - Vercel 主要为 Node.js/Next.js 设计
  - 你的后端是 Python FastAPI
  - Vercel Serverless Functions 有时间限制（10秒免费版），你的 AI 筛选任务会超时

  ---
  🔀 推荐的部署架构

  方案一：Railway（最简单）

  前端 → Vercel
  后端 → Railway (支持 Python，自动部署)
  数据库 → Supabase (云服务)
  文件存储 → Aliyun OSS (云服务)

  Railway 部署后端：
  1. 连接 GitHub 仓库
  2. 选择 backend/ 目录
  3. Railway 自动识别 Python 项目
  4. 配置环境变量（从 .env 复制）
  5. 自动生成公网地址（如 https://your-app.railway.app）

  方案二：Render（免费额度）

  前端 → Vercel
  后端 → Render (免费 tier 可用)

  方案三：传统云服务器

  前端 → Vercel
  后端 → 阿里云/腾讯云 ECS + Nginx + Uvicorn

  ---
  🔧 关键配置点

  1. CORS 跨域配置

  后端需要允许 Vercel 域名：

  # backend/app/main.py (已有配置)
  cors_origins: list[str] = [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://your-project.vercel.app",  # ← 添加 Vercel 域名
  ]

  2. 前端 API 地址

  Vercel 环境变量：
  VITE_API_BASE_URL=https://your-backend.railway.app

  3. 后端环境变量

  所有敏感信息（API keys, 数据库密码等）都需要在后端部署平台配置。

  ---
  📝 完整部署流程

  Step 1: 部署后端（Railway 为例）

  1. 登录 https://railway.app
  2. New Project → Deploy from GitHub → 选择仓库
  3. 设置 Root Directory: backend
  4. 添加环境变量（复制 backend/.env）
  5. 部署后获得后端地址（如 https://api.your-app.railway.app）

  Step 2: 部署前端（Vercel）

  1. 登录 https://vercel.com
  2. Import Project → 选择 GitHub 仓库
  3. 配置：
    - Framework Preset: Vite
    - Root Directory: frontend
    - Build Command: npm run build
    - Output Directory: dist
  4. 环境变量：
  VITE_API_BASE_URL=https://api.your-app.railway.app
  5. Deploy

  Step 3: 更新后端 CORS

  将 Vercel 给你的域名（如 https://resume-matcher.vercel.app）添加到后端 CORS 配置。

  ---
  ⚠️ 注意事项

  1. 免费额度限制：
    - Vercel: 100GB 带宽/月
    - Railway: $5 免费额度/月
    - Render: 免费 tier 会冷启动（15分钟无请求后休眠）
  2. Supabase 和 OSS：
    - 这些都是云服务，已经是"部署"状态
    - 只需要配置好环境变量即可
  3. API Keys 安全：
    - 绝对不要把 API keys 提交到 Git
    - 使用平台的环境变量功能

  ---
  🎯 总结

  可以发布到 Vercel ✅，但需要：
  - 前端 → Vercel（静态站点）
  - 后端 → Railway/Render/云服务器（Python 服务）
  - 前端配置后端 API 地址
  - 后端配置 CORS 允许前端域名

  这是典型的前后端分离部署模式，也是现代 Web 应用的标准做法。