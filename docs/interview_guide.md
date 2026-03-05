# HireYI 技术评估任务 — 候选人指南

## 一、关于这次面试任务

### 为什么是这样的面试？

AI 编程工具正在深刻改变软件开发的方式。我们相信，**能否有效地与 AI 协作**已成为工程师的核心竞争力之一——这不是"能不能写代码"的问题，而是"能否引导 AI 高效解决真实工程问题"的问题。

因此，这次技术评估的核心不是考察你的代码量或算法能力，而是观察你如何：

- **快速理解一个陌生的真实代码库**
- **在 AI 工具的辅助下定位问题、设计方案、完成实现**
- **做出合理的工程决策并清晰地解释它们**

### 工具使用政策

**✅ 完全鼓励使用任何 AI 工具**：Cursor、Copilot、Claude Code、ChatGPT、Windsurf、Gemini……无限制。

**✅ 可以查阅任何资源**：官方文档、Stack Overflow、技术博客、开源项目。

**✅ 可以使用任何开源库**：只要选择合理，能解释你的判断。

**⚠️ 重要提示**：

> 后续面试将**完全基于你的提交**进行深度讨论。我们会请你讲解设计决策、现场修改代码、讨论扩展场景。请确保你理解并能解释提交的每一处改动。
>
> 我们也会聊到你在这个过程中**如何使用 AI 工具**——哪些地方 AI 帮了忙？有没有 AI 给出错误方案的情况？你是怎么判断和修正的？

---

## 二、关于 HireYI 项目

### 项目简介

**HireYI** 是一个 AI 驱动的简历管理与人才筛选平台，帮助招聘团队高效管理候选人并智能匹配岗位。

**核心功能**：

- 自动化简历解析（支持 PDF、DOCX、图片等多格式，AI 提取结构化数据）
- AI 驱动的岗位-候选人匹配与评分（两阶段：关键词预筛选 + LLM 精排）
- 集中化的面试反馈与候选人状态管理
- 多租户组织管理与角色权限控制

### 技术栈

| 层面 | 技术 |
|------|------|
| 后端 | Python 3.11+ / FastAPI / Supabase (PostgreSQL) |
| 前端 | TypeScript / React 19 / TailwindCSS / React Query |
| AI/LLM | LiteLLM（支持 OpenAI、DeepSeek、Ollama 等 100+ 提供商） |
| 文件存储 | Aliyun OSS |
| 包管理 | uv (Python) / npm (前端) |
| 代码质量 | ruff + basedpyright + pre-commit |

### 项目状态

- 后端：35 个 API 端点，135+ 测试用例
- 前端：完整的 MVP 功能，16+ UI 基础组件
- GitHub 仓库：[https://github.com/eastdogzhou/hireyi](https://github.com/eastdogzhou/hireyi)
- 线上体验：[https://hireyi.vercel.app](https://hireyi.vercel.app)

> **💡 建议**：在开始开发前，先访问线上版本体验一下产品的完整功能，有助于快速建立对项目的整体认知。

---

## 三、任务说明

### 你需要做什么

根据你应聘的方向，我们为你准备了对应的任务（如有疑问请提前沟通）：

---

### 任务 A：职位管理页面完善

**考察方向**：前端工程能力 — 代码导航、模式复用、状态管理
**建议时间**：4-6 小时

**背景**：职位管理模块的两个核心页面存在多处 UI 未正确接入的问题。

**需要修复的问题**：

**职位列表页 (`/positions`)**：

1. "智能筛选"按钮点击后无反应（当前只有 `console.log`）—— 项目中已有 `SmartScreeningModal` 组件在其他页面正常使用
2. 候选人数量列始终显示 `0`，未展示实际数据
3. 状态列始终显示"招聘中"，未使用后端返回的实际 `status` 字段
4. 列表缺少分页功能 —— 项目中已有 `Pagination` 组件在候选人列表页使用

**职位详情页 (`/positions/:id`)**：

5. 候选人列表中"安排面试"和"更新状态"按钮无功能（当前只有 `console.log`）
6. 候选人列表缺少分页

**提示**：
- 重点考察你**发现并复用已有组件**的能力
- 对于后端未直接返回的数据（如 candidates_count），需要你做出设计决策并在 PR 中说明

**关联 Issue**：[#25](https://github.com/eastdogzhou/hireyi/issues/25)、[#26](https://github.com/eastdogzhou/hireyi/issues/26)

---

### 任务 B：首页仪表板设计与实现

**考察方向**：产品感觉 — 需求提炼、数据呈现、UX 设计
**建议时间**：6-8 小时

**背景**：应用目前没有首页，用户登录后直接跳转到候选人列表。作为一个招聘管理平台，HR 用户需要一个 Dashboard 快速了解当前招聘状况。

**需要实现的功能**：

1. 设计并实现一个 Home Page，作为用户登录后的首个页面
2. 展示对 HR 用户有价值的招聘数据统计（展示哪些指标由你决定）
3. 提供快速导航到常用操作的入口
4. 使用已有的 API hooks 获取数据（参考 `frontend/src/hooks/api/`）
5. 与现有的设计系统保持一致（Orange 主题，已有 UI 组件库）

**提示**：
- 没有设计稿，展示什么数据和如何布局完全由你决定
- 我们关注的是你的**产品判断**和**设计决策**，而非动效华丽度
- 请在 PR 描述中说明你的设计思路和取舍

**关联 Issue**：[#15](https://github.com/eastdogzhou/hireyi/issues/15)

---

### 任务 C：AI 候选人评估 Agent

**考察方向**：AI 应用开发 — Prompt 设计、LLM 集成、全栈串联
**建议时间**：6-8 小时

**背景**：系统已经实现了多个 AI 功能（简历解析、全局评分、智能筛选）。面试反馈记录（interview_feedbacks）支持三种类型：

| 类型 | 字段 | 状态 |
|------|------|------|
| 人工面试评价 | `interview_rating` (1-4) | ✅ 已实现 |
| **AI 评估** | **`ai_rating` (1-10)** | **⚠️ 数据模型已就绪，但无实际 AI 逻辑** |
| 状态变更记录 | `new_status` | ✅ 已实现 |

**需要实现的功能**：

1. **Prompt 设计**：设计一个评估 Prompt，综合考虑候选人简历信息和相关上下文，生成 AI 评分（1-10）和结构化评估意见

2. **后端实现**：
   - 实现 AI 评估逻辑，利用已有的 LLM 客户端（`backend/app/services/llm/client.py`）
   - 新增 API 端点触发 AI 评估
   - 评估结果通过已有的 `create_ai_evaluation()` 方法写入数据库

3. **前端实现**：
   - 在合适的位置添加"AI 评估"触发按钮
   - 展示评估结果（已有的 `ExecutionRecordsTimeline` 组件已支持显示 AI 评估记录）
   - 处理加载状态和错误情况

4. **可测试性**：确保核心逻辑有单元测试（可使用 mock LLM 响应）

**参考文件**（建议按此顺序阅读）：

| 文件 | 作用 |
|------|------|
| `backend/app/services/llm/prompts.py` | 已有的 Prompt 模板，了解设计模式 |
| `backend/app/services/llm/client.py` | LLM 客户端，`text_complete()` 函数 |
| `backend/app/models/interview_feedback.py` | 数据模型，搜索 `AIEvaluationCreate` |
| `backend/app/services/interview_feedback_service.py` | 服务层，搜索 `create_ai_evaluation` |
| `backend/app/services/smart_screening_service.py` | 已有的 AI 调用范例 |
| `frontend/src/components/business/ExecutionRecordsTimeline.tsx` | 前端展示组件 |

**关于 LLM 访问**：
- 项目使用 LiteLLM，支持 100+ LLM 提供商
- **推荐方案（免费本地运行）**：安装 [Ollama](https://ollama.com) → 拉取模型（如 `ollama pull qwen2.5`）→ 在 `.env` 中配置 `DEFAULT_LLM_MODEL=ollama/qwen2.5`
- 也可以使用你自己的 API Key（OpenAI、DeepSeek 等任意提供商）
- 也可以先用 mock 模式开发，确保架构正确后再接入真实 LLM

---

## 四、环境搭建

### 前置要求

| 工具 | 版本 | 安装说明 |
|------|------|---------|
| Git | any | - |
| Python | 3.11+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| uv | latest | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Ollama | latest（仅任务 C） | [ollama.com](https://ollama.com) |

### 第一步：Fork 并克隆项目

```bash
# 1. 在 GitHub 上 Fork 项目到你的账号
#    项目地址：https://github.com/eastdogzhou/hireyi
# 2. 克隆你的 Fork
git clone https://github.com/<your-username>/hireyi.git
cd hireyi
```

### 第二步：配置后端

```bash
cd backend

# 安装依赖
uv sync

# 复制环境变量模板
cp .env.example .env
```

打开 `backend/.env`，需要配置以下关键变量：

```bash
# === Supabase 配置 ===
# 请联系我们获取测试实例凭证，或创建自己的免费 Supabase 项目：
# https://supabase.com （免费额度足够本次任务使用）
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# === LLM 配置（仅任务 C 需要）===
# 使用 Ollama 本地模型（推荐，免费）：
DEFAULT_LLM_MODEL=ollama/qwen2.5
# 或使用云端 API（填入你的 key）：
# OPENAI_API_KEY=sk-xxx
# DEFAULT_LLM_MODEL=openai/gpt-4o-mini
```

> **💡 关于 Supabase 凭证**：请联系我们获取测试实例的凭证。如果你希望完全自主搭建，也可以在 [supabase.com](https://supabase.com) 创建免费项目，并使用 `database/schema.sql` 初始化表结构。

### 第三步：配置前端

```bash
cd ../frontend

# 安装依赖
npm install

# 复制环境变量模板
cp .env.example .env
```

编辑 `frontend/.env`：

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://xxx.supabase.co     # 与后端一致
VITE_SUPABASE_ANON_KEY=your-anon-key           # 与后端一致
```

### 第四步：启动项目

```bash
# 终端 1：启动后端
cd backend
uv run uvicorn app.main:app --reload --port 8000
# 验证：访问 http://localhost:8000/docs 可看到 Swagger API 文档

# 终端 2：启动前端
cd frontend
npm run dev
# 验证：访问 http://localhost:5173 可看到登录页面
```

### 第五步：验证项目运行正常

1. 访问 `http://localhost:5173`，看到登录页面
2. 注册一个新账号 → 创建或加入组织
3. 进入应用后，能看到候选人列表和职位列表页面
4. （可选）上传一份测试简历，验证 AI 解析功能

> **遇到问题？** 请参考 `docs/deployment.md` 的常见问题章节，或直接联系我们。

---

## 五、开发与提交

### 开发流程

```bash
# 1. 创建功能分支
git checkout -b feat/your-task-description

# 2. 开发...（推荐使用 AI 工具辅助）

# 3. 确保代码质量检查通过
cd backend
uv run ruff check .       # 代码检查
uv run ruff format .      # 代码格式化
uv run pytest             # 运行测试

cd ../frontend
npm run lint              # 前端代码检查
npm run build             # 确保构建通过

# 4. 提交代码（遵循 Conventional Commits 格式）
git add .
git commit -m "feat(scope): description of changes"

# 5. 推送到你的 Fork
git push origin feat/your-task-description
```

### 提交 PR

在你的 Fork 仓库中，向 `eastdogzhou/hireyi` 的 `main` 分支提交 Pull Request。

**PR 描述需包含**：

```markdown
## 改动说明
[你做了什么，解决了什么问题]

## 设计决策
[关键的技术选择和原因，例如：]
- 为什么选择方案 X 而不是 Y？
- 哪些地方做了取舍？理由是什么？

## AI 工具使用
[简要说明你在开发过程中如何使用 AI 工具]
- 使用了哪些 AI 工具？
- AI 在哪些环节帮助最大？
- 有没有 AI 给出不恰当建议的情况？你是怎么处理的？

## 测试验证
[如何验证你的改动是正确的]

## 已知限制
[如果有未完成或可以改进的地方，请说明]
```

### 代码规范

项目已有完整的代码规范，AI 工具可以帮助你快速适应：

- **Python**：类型注解（必须）、Sphinx 风格 docstring、ruff 格式化
- **TypeScript**：严格类型、named exports
- **Git**：Conventional Commits（`feat(scope): subject`）
- **详细规范**：参考 `CLAUDE.md` 和 `AGENTS.md`

---

## 六、我们的期望

### 我们看重的

| 维度 | 说明 |
|------|------|
| **代码库理解** | 能否快速理解陌生代码库的架构和模式，找到可复用的组件和方法 |
| **工程决策** | 面对多种实现方案时，能否做出合理选择并清晰解释理由 |
| **AI 协作效率** | 能否有效地利用 AI 工具加速开发，同时保持对代码的理解和把控 |
| **代码质量** | 提交的代码是否规范、完整、可维护，与项目现有风格一致 |
| **完整性** | 功能是否完整可用，PR 是否包含清晰的说明 |

### 我们不看重的

- 代码的绝对数量（质量 > 数量）
- 炫技或过度工程化（简单可行 > 复杂完美）
- 是否用了 AI（我们假设你会用，也鼓励你用）

### 成功标准

1. **对应的问题能被解决** — 功能正常工作
2. **代码规范、完整** — 通过 lint/type check，与项目风格一致
3. **在 GitHub 上提交一个 PR** — 包含清晰的改动说明和设计决策

---

## 七、后续面试

提交 PR 后，我们会安排一次 60 分钟的深度技术面试，内容完全基于你的提交：

| 阶段 | 时长 | 内容 |
|------|------|------|
| Walk Through | 15 min | 你讲解实现思路和关键决策 |
| 深度追问 | 30 min | 基于代码的具体问题、现场小幅修改、扩展场景讨论 |
| 自由交流 | 15 min | 你的问题、双向了解 |

**典型的追问方向**：

- "你是怎么发现这个组件已经在其他页面实现了的？"
- "AI 给你的第一个方案是什么？你为什么没有直接采用？"
- "如果数据量增长 100 倍，这个设计会怎样？"
- "如果让你重新做，你会改变什么？"
- "开发过程中遇到最棘手的问题是什么？你是怎么解决的？"

---

## 八、时间安排

| 节点 | 说明 |
|------|------|
| Day 0 | 收到本文档，开始环境搭建和代码阅读 |
| Day 0-2 | 完成开发并提交 PR（建议实际投入 4-8 小时） |
| Day 3-5 | 安排深度技术面试（60 分钟） |

> **💡 建议**：不必追求完美，先确保核心功能完整可用。如果时间允许，再打磨细节。

---

## 九、需要帮助？

在任何阶段遇到问题，都可以联系我们：

- **环境问题**：Supabase 凭证、项目运行报错 → 直接联系
- **任务理解**：需求不清晰、边界不确定 → 欢迎提问（建议不超过 3 个问题）
- **其他授权**：如果需要额外的服务访问权限 → 随时提出

祝你顺利！
