# AI Resume Scanning System - Quick Reference

**最后更新**: 2025-01-26
**项目状态**: ✅ 生产就绪

这是一份面向 **AI 助手 (Claude Code, Cursor, etc.)** 和 **新贡献者** 的快速参考文档。

---

## 📊 项目当前状态

| 模块 | 完成度 | 测试覆盖率 | 状态 |
|------|--------|-----------|------|
| 后端 API | 100% (28个端点) | 78% | ✅ 生产就绪 |
| 前端 UI | 100% (MVP功能) | 67个组件测试 | ✅ 生产就绪 |
| 数据库 | v1.4 | N/A | ✅ 生产就绪 |
| 文档 | 95% | N/A | ⚠️ 持续完善中 |

**详细进度**: 查看 `docs/backend_task_plan.md` 和 `docs/frontend_task_plan.md`

---

## 🎯 项目核心概念

### 技术栈
- **后端**: Python (FastAPI) + Supabase (PostgreSQL)
- **前端**: React 18 + TypeScript + TailwindCSS + Vite
- **AI**: LiteLLM (多模型支持)
- **存储**: 阿里云 OSS

### 三层评分体系 ⚠️ **关键概念**

本系统使用 **3种独立的评分系统**，请务必区分：

1. **候选人全局评分**: `candidates.score` (0-10分) - 简历质量评估
2. **职位匹配评分**: `position_candidates.overall_score` (1-4分) - 职位适配度
3. **面试评价**: `interview_feedbacks.rating` (1-4分) - 面试表现

**详见**: `docs/ai_resume_prd.md` → "评分系统说明"章节

---

## 📂 关键文档导航

### 我想...

| 任务 | 查看文档 | 说明 |
|------|---------|------|
| **快速了解项目** | `README.md` | 5分钟快速开始 |
| **开发新功能** | `CLAUDE.md` | 完整开发指南 (必读) |
| **查看API** | `backend/README.md` | 28个API端点完整文档 |
| **理解数据库** | `docs/database_design.md` | v1.4 schema + 迁移指南 |
| **了解业务规则** | `docs/ai_resume_prd.md` | 产品需求文档 |
| **遵循编码规范** | `docs/rule.md` | Git规范 + 代码标准 |
| **部署到生产** | `docs/deployment.md` | 部署和配置指南 |
| **清理测试数据** | `backend/scripts/clear_all_data.py` | 数据清除工具 |

---

## 🚀 快速开始

### 初次设置

```bash
# 1. 后端设置
cd backend
uv sync                          # 安装依赖
cp .env.example .env             # 配置环境变量
uv run uvicorn app.main:app --reload --port 8000

# 2. 前端设置
cd frontend
npm install                      # 安装依赖
cp .env.example .env             # 配置环境变量
npm run dev                      # 启动开发服务器

# 3. 数据库初始化
# 在 Supabase SQL Editor 执行 database/schema.sql
```

### 常用命令

```bash
# 后端
uv run pytest                    # 运行测试 (135个测试用例)
uv run ruff check .              # 代码检查
uv run basedpyright              # 类型检查

# 前端
npm test                         # 运行测试
npm run build                    # 构建生产版本
npm run type-check               # 类型检查
```

**详细指南**: `CLAUDE.md` → "Development Environment Setup"

---

## 🏗️ 架构要点

### 后端架构
```
app/
├── api/            # 26个业务端点 + 2个系统端点
├── services/       # 业务逻辑层
│   ├── candidate_service.py
│   ├── position_service.py
│   ├── smart_screening_service.py
│   └── llm/        # AI集成
├── models/         # Pydantic 数据模型
└── config/         # Supabase 配置
```

### 前端架构
```
src/
├── pages/          # 路由页面 (候选人、职位管理)
├── components/     # UI组件
├── hooks/api/      # React Query hooks
├── services/       # API客户端
└── ui/components/  # 通用组件库 (16个组件)
```

### 数据库核心表
- `candidates`: 候选人库 (简历解析、全局评分)
- `positions`: 职位管理
- `position_candidates`: M2M关系 (匹配评分)
- `interview_feedbacks`: 面试记录 + 状态变更日志
- `users`: 系统用户 (v2.0将引入认证)

**详细设计**: `docs/database_design.md`

---

## ⚠️ 开发注意事项

### 关键原则

1. **最小化设计**: 优先选择简单方案，避免过度工程化
2. **类型安全**: 所有Python代码必须有类型注解
3. **使用 uv**: 所有Python命令必须通过 `uv run` 执行
4. **Context7 MCP**: 使用第三方库前，必须查询官方文档
5. **软删除**: 所有删除操作使用 `is_deleted` 标记

**详见**: `CLAUDE.md` → "Critical Development Rules"

### 评分系统混淆 🚨 **常见错误**

**错误示例**:
```python
# ❌ 错误: 混淆了全局评分和职位匹配评分
if candidate.score >= 3:  # 这是0-10的分数!
    print("高分候选人")
```

**正确做法**:
```python
# ✅ 正确: 明确使用哪种评分
if candidate.score >= 7:  # 全局评分 (0-10)
    print("高质量简历")

if position_candidate.overall_score >= 3:  # 职位匹配 (1-4)
    print("高匹配度候选人")
```

### 数据库变更流程

```bash
# 1. 修改 database/schema.sql
# 2. 更新 docs/database_design.md
# 3. 更新 DOCUMENTATION_STATUS.md (版本号)
# 4. 检查 docs/ai_resume_prd.md 是否需要同步
# 5. 提交PR并更新后端任务计划
```

**详见**: `CLAUDE.md` → "Documentation Maintenance Protocol"

---

## 🐛 常见问题

### 后端相关

**Q: 测试失败怎么办？**
- 当前有 8 个测试用例失败（主要是模拟数据完整性问题）
- 查看 `backend/README.md` → "Known Issues"

**Q: AI解析失败？**
- 检查 `.env` 中的 LLM API Key
- 查看 `backend/app/services/llm/` 中的重试逻辑

**Q: Supabase连接失败？**
- 验证 `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY`
- 检查 Row Level Security (RLS) 是否已关闭

### 前端相关

**Q: API调用失败？**
- 确认 `VITE_API_BASE_URL` 指向正确的后端地址 (http://localhost:8000)
- 检查 CORS 配置

**Q: 组件样式错误？**
- 查看 `frontend/README.md` → "Design System"
- 确认使用了正确的 TailwindCSS 主题色

---

## 🔗 外部资源

- **Supabase文档**: https://supabase.com/docs
- **FastAPI文档**: https://fastapi.tiangolo.com
- **React Query文档**: https://tanstack.com/query/latest

---

## 📝 贡献工作流

1. 创建功能分支: `feat/your-feature-name`
2. 遵循 Conventional Commits: `feat(api): add new endpoint`
3. 确保通过所有检查:
   ```bash
   uv run pytest
   uv run ruff check .
   uv run basedpyright
   npm run lint
   npm run build
   ```
4. 更新相关文档（特别是 `backend/README.md`）
5. 创建 Pull Request

**详细规范**: `docs/rule.md` → "Git Conventions"

---

## 🎓 学习路径

### 新手入门 (第1天)
1. 阅读 `README.md` 了解项目
2. 运行快速开始命令，启动本地环境
3. 浏览 `docs/ai_resume_prd.md` 理解业务逻辑

### 深度开发 (第2-3天)
1. **精读 `CLAUDE.md`** (最重要的文档)
2. 阅读 `docs/database_design.md` 理解数据模型
3. 阅读 `backend/README.md` 了解所有API端点
4. 尝试创建一个候选人并关联到职位

### 高级贡献 (第4天+)
1. 阅读 `docs/rule.md` 理解编码标准
2. 查看 `docs/*_task_plan.md` 找到待完成的任务
3. 开始贡献代码！

---

**最重要的建议**: 遇到问题时，先查看 `CLAUDE.md`，它包含了几乎所有你需要的信息！
