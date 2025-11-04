# Migration 002: Interview Feedbacks 表重构

**版本**: v2.0
**日期**: 2025-01-27
**状态**: Ready to Deploy

## 变更摘要

重构 `interview_feedbacks` 表，统一支持三种互斥的记录类型：
1. **面试评价** (interview_rating: 1-4分)
2. **AI 评价** (ai_rating: 1-10分)
3. **状态变更/日志** (new_status: 状态枚举)

## 主要变更

### 数据库表结构

#### 新增字段
- `interviewer_type` VARCHAR(20) NOT NULL - 评价者类型 ('user', 'agent', 'system')
- `ai_rating` INTEGER - AI 评价分数 (1-10，互斥字段)

#### 修改字段
- `interviewer` UUID NOT NULL - 改为必填，移除外键约束
- `interview_date` DATE NOT NULL - 改为必填（非面试记录填 created_at 日期）
- `comments` TEXT NOT NULL - 改为必填
- `interview_rating` INTEGER - 重命名自 `rating`（保持1-4分制）

#### 删除字段
- `is_status_change` BOOLEAN - 废弃（通过字段值判断类型）

#### 字段互斥约束
以下三个字段只能有一个非 NULL：
- `interview_rating` - 面试官评价
- `ai_rating` - AI 评价
- `new_status` - 状态变更

### Pydantic 模型变更

#### 新增类型
- `InterviewerType = Literal["user", "agent", "system"]`
- `AIRating = Literal[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`

#### 新增便捷 Schema
- `InterviewEvaluationCreate` - 创建面试评价
- `AIEvaluationCreate` - 创建 AI 评价
- `StatusChangeCreate` - 创建状态变更（保留）

### Service 层变更

#### 新增方法
- `create_ai_evaluation()` - 创建 AI 评价记录
- `create_system_log()` - 创建系统日志记录
- `get_ai_evaluations_only()` - 仅获取 AI 评价

#### 修改方法
- `create_interview_feedback()` - 参数更新（interviewer 改为 UUID，rating 改为 interview_rating）
- `create_status_change_record()` - 参数更新（operator 改为 UUID，comments 必填）
- `update_feedback()` - 支持更新 interview_rating 和 ai_rating
- `get_feedbacks_for_candidate()` - 参数 `include_status_changes` 改为 `record_type`
- `get_feedbacks_for_candidate_position()` - 参数 `include_status_changes` 改为 `record_type`
- `get_interview_feedbacks_only()` → `get_interview_evaluations_only()` - 方法重命名
- `count_feedbacks_for_candidate_position()` - 参数 `is_status_change` 改为 `record_type`

#### 删除方法
- `create_position_association_record()` - 替换为 `create_system_log()`

## 迁移步骤

### 1. 数据库迁移

```bash
# 连接到数据库
psql "postgresql://..."

# 执行迁移脚本
\i database/migrations/002_refactor_interview_feedbacks.sql

# 验证数据迁移
SELECT COUNT(*) FROM interview_feedbacks_backup;
SELECT COUNT(*) FROM interview_feedbacks;
SELECT interviewer_type, COUNT(*) FROM interview_feedbacks GROUP BY interviewer_type;
```

### 2. 代码部署

```bash
# 拉取最新代码
git pull origin feat-refactor-feedback-db

# 重启后端服务
uv run uvicorn app.main:app --reload
```

### 3. 验证

**API 兼容性检查**：
- 旧 API 调用会失败（字段变更）
- 需要更新前端调用

**功能验证**：
1. 创建面试评价记录
2. 创建 AI 评价记录
3. 创建状态变更记录
4. 查询候选人反馈历史
5. 更新评价记录

## 数据迁移规则

### 现有数据处理

旧表字段 → 新表字段映射：

| 旧字段 | 新字段 | 迁移规则 |
|--------|--------|----------|
| interviewer (可NULL) | interviewer (UUID) | NULL → 系统 UUID (00000000-...) |
| - | interviewer_type | interviewer IS NULL → 'system', ELSE 'user' |
| interview_date (可NULL) | interview_date (必填) | NULL → created_at::date |
| comments (可NULL) | comments (必填) | NULL → 空字符串 '' |
| rating | interview_rating | is_status_change=false → rating, ELSE NULL |
| - | ai_rating | 全部为 NULL（无历史 AI 评价） |
| new_status | new_status | is_status_change=true → new_status, ELSE NULL |

### 备份表

迁移脚本会自动创建 `interview_feedbacks_backup` 表，保留所有原始数据。

## Breaking Changes

⚠️ **不兼容变更**：

1. **API 参数变更**：
   - `interviewer`: `int` → `UUID`
   - `rating` → `interview_rating`
   - `operator`: `int` → `UUID`

2. **Response 结构变更**：
   - 新增 `interviewer_type`, `ai_rating` 字段
   - `rating` 重命名为 `interview_rating`
   - 移除 `is_status_change` 字段

3. **Service 方法签名变更**：
   - 所有涉及 interviewer 的方法需要传递 UUID 而非 int
   - 部分方法参数重命名

## 回滚计划

如果迁移失败，可执行以下步骤回滚：

```sql
-- 1. 恢复旧表
DROP TABLE IF EXISTS interview_feedbacks;
ALTER TABLE interview_feedbacks_backup RENAME TO interview_feedbacks;

-- 2. 重建索引
CREATE INDEX idx_interview_feedbacks_candidate ON interview_feedbacks(candidate_id);
CREATE INDEX idx_interview_feedbacks_position ON interview_feedbacks(position_id);
-- ... (其他旧索引)

-- 3. 恢复 RLS 策略
ALTER TABLE interview_feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interview_feedbacks_org_isolation" ON interview_feedbacks
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM candidates c
            WHERE c.id = interview_feedbacks.candidate_id
              AND c.org_id = current_org_id()
        )
    );
```

## 测试清单

- [ ] 数据库迁移成功，无错误
- [ ] 备份表数据完整
- [ ] 新表数据行数与备份表一致
- [ ] 新增 AI 评价 API 正常
- [ ] 更新面试评价 API 正常
- [ ] 状态变更 API 正常
- [ ] 查询反馈历史 API 正常
- [ ] RLS 策略生效（多组织隔离）

## 相关文件

- 迁移脚本: `database/migrations/002_refactor_interview_feedbacks.sql`
- Schema: `database/schema_v2.sql`
- Models: `backend/app/models/interview_feedback.py`
- Service: `backend/app/services/interview_feedback_service.py`

## 联系人

如有问题，请联系：
- 开发: eastdog
- 日期: 2025-01-27
