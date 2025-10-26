# 文档状态总览

**最后更新**: 2025-01-25
**当前数据库版本**: v1.4
**准备升级到**: v2.0 (认证和组织管理)

## 📚 核心文档列表

### 1. 项目总览与规范

| 文档 | 路径 | 状态 | 说明 |
|------|------|------|------|
| 项目指南 | `CLAUDE.md` | ✅ 最新 | 完整的项目架构和开发指导原则 |
| 开发规范 | `docs/rule.md` | ✅ 最新 | 编码标准、工具配置、Git规范 |
| 项目说明 | `README.md` | ⚠️ 需更新 | 缺少v1.2变更说明 |

### 2. 数据库设计

| 文档 | 路径 | 状态 | 说明 |
|------|------|------|------|
| 数据库设计总览 | `docs/database_design.md` | ✅ 最新 | **新增** - 完整的schema文档和迁移指南 |
| 产品需求文档 | `docs/ai_resume_prd.md` | ✅ 最新 | 包含完整业务规则和数据库schema |
| 认证组织设计 | `docs/auth_and_org_design.md` | ✅ 最新 | v2.0升级设计文档（简化版） |

### 3. 后端文档

| 文档 | 路径 | 状态 | 说明 |
|------|------|------|------|
| 后端README | `backend/README.md` | ✅ 最新 | 所有19个API端点文档 |
| 后端任务计划 | `docs/backend_task_plan.md` | ⚠️ 需更新 | 需添加认证模块任务 |
| 部署文档 | `backend/docs/deployment.md` | ✅ 最新 | 部署配置和流程 |

### 4. 前端文档

| 文档 | 路径 | 状态 | 说明 |
|------|------|------|------|
| 前端README | `frontend/README.md` | ✅ 最新 | 前端架构和组件说明 |
| 前端设计 | `docs/frontend_design.md` | ✅ 最新 | 架构设计和技术选型 |
| 前端任务计划 | `docs/frontend_task_plan.md` | ⚠️ 需更新 | 需添加认证页面任务 |
| 开发计划 | `frontend/DEVELOPMENT_PLAN.md` | ✅ 最新 | 迭代计划和进度 |
| 性能文档 | `frontend/PERFORMANCE.md` | ✅ 最新 | 性能优化指南 |

### 5. 部署与运维

| 文档 | 路径 | 状态 | 说明 |
|------|------|------|------|
| 部署服务 | `docs/deploy_service.md` | ✅ 最新 | 生产环境部署方案 |
| 部署指南 | `docs/deployment.md` | ✅ 最新 | 通用部署流程 |

## 🔄 最近更新

### v1.4 更新 (2025-01-25)
1. ✅ **候选人全局评分系统重构**
   - 从 4 分制 (1-4) 改为 10 分制 (0-10)
   - 完全基于简历内容的 LLM 评分，包含 6 个维度
   - 院校(0-3) + 专业(0-2) + 学历(0-2) + GPA(0-1) + AI经验(0-1) + 竞赛(0-1)

2. ✅ **代码实现**
   - `backend/app/services/llm/prompts.py`: 新增 `RESUME_GLOBAL_SCORING_PROMPT`
   - `backend/app/services/candidate_service.py`: 新增 `calculate_global_score()` 方法
   - 简历上传时自动计算并存储全局评分

3. ✅ **数据库变更**
   - `database/schema.sql`: 更新为 v1.4
   - `database/migrations/v1.4_update_score_scale.sql`: 新增迁移脚本
   - `database/README.md`: 添加 v1.4 迁移说明和验证SQL

4. ✅ **文档更新**
   - `docs/database_design.md`: 更新到 v1.4，添加全局评分系统说明
   - `docs/ai_resume_prd.md`: 更新 score 字段约束和说明
   - `DOCUMENTATION_STATUS.md`: 记录 v1.4 更新

**注意事项**:
- 职位-候选人匹配评分 (position_candidates表) 仍保持 **4分制 (1-4)** 不变
- 迁移会重置所有现有评分为 NULL，需重新上传或解析简历

### v1.3 更新 (2025-01-25)
1. ✅ **`database/migrations/v1.3_add_resume_text.sql`** (新增)
   - 添加 resume_text 字段到 candidates 表
   - 存储简历纯文本内容，支持全文搜索
   - 包含可选的全文搜索索引创建SQL

2. ✅ **`docs/database_design.md`** 更新到 v1.3
   - 添加 resume_text 字段说明
   - 更新版本号和变更日志

3. ✅ **`docs/ai_resume_prd.md`** 更新
   - candidates表字段添加resume_text说明
   - 更新CREATE TABLE SQL语句

### v1.2 更新 (2025-01-23)

#### 新增文档
1. ✅ **`docs/database_design.md`**
   - 完整的数据库schema v1.2文档
   - 所有表结构、索引、约束说明
   - 软删除规则和数据完整性
   - v2.0迁移预览

2. ✅ **`docs/auth_and_org_design.md`** (重大简化)
   - 简化的认证和组织管理设计
   - 遵循最小化设计原则
   - 去除过度设计和复杂架构
   - 明确的实施路径

### 更新文档
1. ✅ **`docs/ai_resume_prd.md`**
   - 修复 `rating` 字段说明（1-5 → 1-4）
   - 更新数据库schema SQL中的CHECK约束
   - 保持与代码一致

2. ✅ **`backend/scripts/clear_all_data.py`** (重命名自`clear_position_candidates.py`)
   - 支持清除所有业务表数据
   - 支持单表清除
   - 添加确认提示和参数选项

## 📋 待办事项

### 高优先级
- [ ] 更新 `README.md` - 添加v1.2变更说明和认证预告
- [ ] 更新 `docs/backend_task_plan.md` - 添加认证模块开发任务
- [ ] 更新 `docs/frontend_task_plan.md` - 添加登录注册页面任务

### 中优先级
- [ ] 创建 `docs/migration_guide.md` - v1.2 → v2.0迁移详细步骤
- [ ] 创建 `docs/api_changelog.md` - API版本变更记录

### 低优先级
- [ ] 添加架构图到文档中
- [ ] 创建故障排查指南

## 🎯 数据库版本历史

| 版本 | 日期 | 主要变更 | 文档 |
|------|------|----------|------|
| v1.0 | 2024-10-15 | 初始设计 | `docs/ai_resume_prd.md` |
| v1.1 | 2024-10-20 | 评分系统改为4分制 | `docs/ai_resume_prd.md` |
| v1.2 | 2024-10-22 | `interview_feedbacks.position_id`改为可空 | `docs/database_design.md` |
| v1.3 | 2025-01-25 | `candidates.resume_text`字段添加 | `docs/database_design.md` |
| v1.4 | 2025-01-25 | 全局评分改为10分制，LLM评分系统 | `docs/database_design.md` |
| v2.0 | 待定 | 认证和组织管理 | `docs/auth_and_org_design.md` |

## 🛠️ 工具脚本

### 数据清理
```bash
# 清除所有业务表数据
cd backend
uv run python scripts/clear_all_data.py

# 清除单个表
uv run python scripts/clear_all_data.py --table candidates

# 自动确认（脚本调用）
uv run python scripts/clear_all_data.py --confirm
```

### 数据库迁移 (即将推出)
```bash
# v1.2 → v2.0 迁移（待实现）
cd backend
uv run python scripts/migrate_to_v2.py
```

## 📝 文档维护原则

### 何时更新文档

1. **数据库schema变更** → 立即更新 `database_design.md` 和 `ai_resume_prd.md`
2. **API端点变更** → 立即更新 `backend/README.md`
3. **完成任务** → 立即更新对应的任务计划文档
4. **架构变更** → 更新 `CLAUDE.md` 和设计文档
5. **部署流程变更** → 更新部署相关文档

### 文档同步检查清单

完成功能开发后，检查是否需要更新：
- [ ] `CLAUDE.md` - 如有架构或业务规则变更
- [ ] `backend/README.md` - 如有API变更
- [ ] `docs/ai_resume_prd.md` - 如有业务规则或schema变更
- [ ] `docs/database_design.md` - 如有schema变更
- [ ] `docs/*_task_plan.md` - 标记任务完成状态
- [ ] `README.md` - 如有重大功能或版本更新

## 🔍 快速查找指南

### 我想了解...

| 问题 | 查看文档 |
|------|----------|
| 项目整体架构 | `CLAUDE.md` |
| 数据库表结构 | `docs/database_design.md` |
| API接口列表 | `backend/README.md` |
| 业务规则详情 | `docs/ai_resume_prd.md` |
| 开发规范 | `docs/rule.md` |
| 前端组件设计 | `frontend/README.md` |
| v2.0升级计划 | `docs/auth_and_org_design.md` |
| 如何部署 | `docs/deployment.md` |

### 我想做...

| 任务 | 查看文档 |
|------|----------|
| 添加新API | `backend/README.md` + `CLAUDE.md` |
| 修改数据库 | `docs/database_design.md` + `CLAUDE.md` |
| 开发新功能 | `CLAUDE.md` + `docs/rule.md` |
| 清除测试数据 | `docs/database_design.md` (数据清除工具) |
| 准备v2.0升级 | `docs/auth_and_org_design.md` |

---

**维护者注意**: 请在更新文档后同步更新本文件，保持文档状态的准确性。
