# Database Scripts

数据库 schema 和迁移脚本目录。

## 📁 目录结构

```
database/
├── README.md                    # 本文件
├── schema.sql                   # 完整数据库 schema (v1.3)
├── seed.sql                     # 测试数据
└── migrations/
    ├── run_migration.py         # 迁移执行工具
    └── v1.3_add_resume_text.sql # v1.3 迁移脚本
```

## 🗄️ Schema 文件

### `schema.sql`
**用途**: 完整的数据库 schema 定义
**版本**: v1.3
**使用场景**:
- 创建全新数据库
- 开发环境重置
- 参考完整表结构

**如何使用**:
```bash
# 在 Supabase SQL Editor 中执行整个文件
# 或使用迁移工具
cd database
python migrations/run_migration.py schema.sql
```

**注意**: 此脚本会 DROP 所有表并重新创建，**仅用于开发环境**。

### `seed.sql`
**用途**: 测试数据
**包含**:
- 3 个测试用户
- 5 个测试候选人
- 3 个测试职位
- 4 条职位候选人关联
- 3 条面试反馈记录

**如何使用**:
```bash
# 在 Supabase SQL Editor 中执行
# 注意: 会清空现有测试数据
```

## 🔄 迁移脚本

### 迁移版本历史

| 版本 | 文件 | 说明 |
|------|------|------|
| v1.4 | `migrations/v1.4_update_score_scale.sql` | 全局评分从 4 分制改为 10 分制 (0-10) |
| v1.3 | `migrations/v1.3_add_resume_text.sql` | 添加 resume_text 字段，修复 rating 约束 |

### 执行迁移

#### 方式 1: Supabase SQL Editor (推荐)
```sql
-- 直接在 Supabase SQL Editor 中执行迁移文件内容
-- 最安全，有完整的错误提示
```

#### 方式 2: 使用迁移工具
```bash
cd database/migrations

# 执行 v1.3 迁移
python run_migration.py v1.3_add_resume_text.sql

# 或使用完整路径
python run_migration.py /path/to/migration.sql
```

## 📋 v1.4 迁移说明

**迁移内容**:
1. ✅ 更新 `candidates.score` CHECK 约束从 (1-4) 改为 (0-10)
2. ✅ 重置所有现有评分为 NULL（需使用新系统重新评估）
3. ✅ 更新字段注释说明新的 LLM 评分系统

**执行前检查**:
```sql
-- 检查当前 score 约束
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'candidates_score_check';
```

**执行后验证**:
```sql
-- 验证 score 约束已更新为 0-10
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'candidates_score_check';
-- 期望: (score >= 0) AND (score <= 10)

-- 验证所有评分已重置为 NULL
SELECT COUNT(*) as total, COUNT(score) as with_score
FROM candidates WHERE is_deleted = false;
-- 期望: with_score = 0
```

**注意**: 旧的 4 分制评分不兼容新的 10 分制系统，迁移会将所有评分重置为 NULL。新评分会在以下情况自动计算：
- 上传新简历时
- 重新解析现有简历时

## 📋 v1.3 迁移说明

**迁移内容**:
1. ✅ 添加 `candidates.resume_text` 字段 (TEXT, nullable)
2. ✅ 修复 `interview_feedbacks.rating` 约束 (1-4 而非 1-5)

**执行前检查**:
```sql
-- 检查当前 rating 约束
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%rating%';
```

**执行后验证**:
```sql
-- 验证 resume_text 字段已添加
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'candidates' AND column_name = 'resume_text';

-- 验证 rating 约束已更新
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'interview_feedbacks_rating_check';
```

## 🛠️ 数据库版本

| 版本 | 日期 | 主要变更 |
|------|------|----------|
| v1.0 | 2025-10-16 | 初始 schema |
| v1.1 | 2025-10-22 | 添加 resume_text, work_experience 等字段 |
| v1.2 | 2025-10-22 | interview_feedbacks.position_id 改为可空 |
| v1.3 | 2025-01-25 | 修复 rating 约束为 4 分制，确认 resume_text |
| v1.4 | 2025-01-25 | 全局评分改为 10 分制 (0-10)，基于简历内容的 LLM 评分 |

## ⚠️ 注意事项

### 开发环境 vs 生产环境

**开发环境**:
- 可以直接运行 `schema.sql` 重建数据库
- 使用 `seed.sql` 填充测试数据

**生产环境**:
- ❌ 禁止运行 `schema.sql` (会删除所有数据)
- ✅ 仅运行增量迁移脚本 (migrations/)
- ✅ 在 Supabase SQL Editor 中手动执行并验证

### 迁移最佳实践

1. **备份数据**: 执行迁移前务必备份
2. **测试优先**: 先在开发环境测试迁移
3. **逐步执行**: 不要一次执行多个迁移
4. **验证结果**: 执行后验证数据完整性

## 📚 相关文档

- **数据库设计**: `docs/database_design.md`
- **产品需求**: `docs/ai_resume_prd.md`
- **认证设计**: `docs/auth_and_org_design.md`

---

**维护者**: 请在创建新迁移时更新本 README 的迁移版本历史表。
