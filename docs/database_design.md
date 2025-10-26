# 数据库设计文档

**版本**: v1.4
**最后更新**: 2025-01-25
**状态**: 生产环境 (准备引入认证和组织管理)

## 变更日志

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| v1.0 | 2024-10-15 | 初始设计 |
| v1.1 | 2024-10-20 | 调整评分系统为4分制 |
| v1.2 | 2024-10-22 | `interview_feedbacks.position_id` 改为可空 |
| v1.3 | 2025-01-25 | `candidates`表添加`resume_text`字段存储简历纯文本 |
| v1.4 | 2025-01-25 | 候选人全局评分改为10分制 (0-10)，基于简历内容的LLM评分系统 |
| v2.0 | 待定 | 引入认证和组织管理 (详见 `auth_and_org_design.md`) |

## 当前数据库表结构 (v1.4)

### 1. candidates (候选人表)

**功能**: 存储所有候选人基本信息和简历提取的结构化数据

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | SERIAL | PRIMARY KEY | 自增主键 |
| name | VARCHAR(100) | NOT NULL | 候选人姓名 |
| phone | VARCHAR(20) | NULLABLE | 手机号 |
| email | VARCHAR(255) | NULLABLE | 邮箱 |
| skills | TEXT[] | DEFAULT '{}' | 技能列表 (PostgreSQL数组) |
| highlights | TEXT | NULLABLE | 简历亮点 (AI提取) |
| years_of_experience | INTEGER | NULLABLE | 工作年限 (AI提取) |
| education_level | VARCHAR(50) | NULLABLE | 最高学历 (本科/硕士/博士/大专) |
| recent_company | VARCHAR(200) | NULLABLE | 最近一家公司 |
| recent_position | VARCHAR(200) | NULLABLE | 最近职位 |
| score | INTEGER | CHECK (score >= 0 AND score <= 10) | 全局综合评分 (10分制，0-10分) **v1.4更新** |
| resume_file | VARCHAR(500) | NOT NULL | 简历文件路径 (阿里云OSS) |
| resume_md5 | VARCHAR(32) | NOT NULL | 简历文件MD5 (用于去重) |
| resume_text | TEXT | NULLABLE | 简历纯文本内容 (AI提取，用于全文搜索) |
| is_deleted | BOOLEAN | DEFAULT false | 软删除标记 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**索引**:
```sql
CREATE INDEX idx_candidates_skills ON candidates USING GIN(skills);
CREATE INDEX idx_candidates_name ON candidates(name);
CREATE INDEX idx_candidates_phone ON candidates(phone);
CREATE INDEX idx_candidates_is_deleted ON candidates(is_deleted);
CREATE INDEX idx_candidates_score ON candidates(score);

-- 唯一性约束
CREATE UNIQUE INDEX idx_candidates_unique_name_phone
  ON candidates(name, phone)
  WHERE is_deleted = false AND phone IS NOT NULL;

CREATE UNIQUE INDEX idx_candidates_unique_resume_md5
  ON candidates(resume_md5)
  WHERE is_deleted = false;
```

**唯一性规则**:
- **优先级1**: `name` + `phone` (phone不为空时)
- **优先级2**: `resume_md5` (phone为空时)

**全局评分系统 (v1.4)**:

候选人全局评分 (`score`) 采用 **10分制 (0-10分)**，完全基于简历内容由 LLM 评估，包含以下 6 个维度：

| 维度 | 分值范围 | 说明 |
|------|----------|------|
| 院校评分 (school_score) | 0-3 | C9=3, 985&QS≤100=2, 211=1, 双一流=0.5, 其他=0 |
| 专业匹配度 (major_score) | 0-2 | CS/SE学硕=2, 数学/物理/AI专硕=1.5, 其他=1 |
| 学历评分 (degree_score) | 0-2 | 博士=2, 学术硕士=1.5, 专业硕士=1, 本科=0.5, 大专=0 |
| GPA评分 (gpa_score) | 0-1 | ≥3.8=1, ≥3.5=0.5, 其他=0 |
| AI经验 (ai_experience_score) | 0-1 | 有AI/ML/DL项目经验=1, 无=0.5 |
| 国家级竞赛 (competition_score) | 0-1 | 一等奖=1, 二等奖=0.5, 三等奖/无=0 |

**总分计算**: `total_score = sum(所有维度分数)`, 最高10分

**特点**:
- ✅ 完全基于简历纯文本内容，不依赖其他信息
- ✅ 与职位无关，体现候选人综合素质
- ✅ LLM 自动评估，确保评分客观一致
- ✅ 上传新简历或重新解析时自动计算

**注意**:
- 职位-候选人匹配评分 (`position_candidates` 表) 仍保持 **4分制 (1-4)**
- 两种评分相互独立，各有用途

---

### 2. positions (职位表)

**功能**: 存储所有招聘职位信息

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | SERIAL | PRIMARY KEY | 自增主键 |
| title | VARCHAR(200) | NOT NULL | 职位名称 |
| department | VARCHAR(100) | NULLABLE | 部门 |
| jd | TEXT | NOT NULL | 职位描述 (Job Description) |
| requirements | JSONB | NULLABLE | 职位要求 (技能、经验等) |
| status | VARCHAR(20) | DEFAULT 'open' | 状态: open/closed |
| created_by | INTEGER | REFERENCES users(id) | 创建人ID |
| is_deleted | BOOLEAN | DEFAULT false | 软删除标记 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**索引**:
```sql
CREATE INDEX idx_positions_status ON positions(status);
CREATE INDEX idx_positions_is_deleted ON positions(is_deleted);
```

---

### 3. position_candidates (职位候选人关联表)

**功能**: 存储职位和候选人的关联关系及匹配得分

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | SERIAL | PRIMARY KEY | 自增主键 |
| position_id | INTEGER | REFERENCES positions(id) ON DELETE CASCADE | 职位ID |
| candidate_id | INTEGER | REFERENCES candidates(id) ON DELETE CASCADE | 候选人ID |
| relevance_score | INTEGER | CHECK (relevance_score >= 1 AND relevance_score <= 4) | 相关度得分 (4分制) |
| fit_score | INTEGER | CHECK (fit_score >= 1 AND fit_score <= 4) | 适配度得分 (4分制) |
| overall_score | INTEGER | CHECK (overall_score >= 1 AND overall_score <= 4) | 综合得分 (4分制，用于展示) |
| overall_score_numeric | INTEGER | CHECK (overall_score_numeric >= 0 AND overall_score_numeric <= 100) | 综合得分数值 (用于精确排序) |
| current_status | VARCHAR(20) | DEFAULT 'screening' | 候选人当前状态 |
| is_deleted | BOOLEAN | DEFAULT false | 软删除标记 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**索引**:
```sql
CREATE INDEX idx_position_candidates_position ON position_candidates(position_id);
CREATE INDEX idx_position_candidates_candidate ON position_candidates(candidate_id);
CREATE INDEX idx_position_candidates_status ON position_candidates(current_status);
CREATE INDEX idx_position_candidates_score_numeric ON position_candidates(overall_score_numeric);
CREATE INDEX idx_position_candidates_is_deleted ON position_candidates(is_deleted);

-- 唯一约束：一个候选人只能关联一个职位一次
UNIQUE(position_id, candidate_id)
```

**评分计算公式**:
```
overall_score_numeric = (relevance_score × 0.6 + fit_score × 0.4) × 25
overall_score = ROUND(overall_score_numeric / 25)
```

**状态值**:
- `screening`: 筛选中
- `interview`: 面试中
- `offer`: 已发Offer
- `hired`: 已入职
- `rejected`: 已拒绝
- `withdrawn`: 已撤回

---

### 4. interview_feedbacks (执行记录表)

**功能**: 存储面试评价、状态变更、职位关联等所有执行记录

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | SERIAL | PRIMARY KEY | 自增主键 |
| candidate_id | INTEGER | REFERENCES candidates(id) ON DELETE CASCADE | 候选人ID |
| position_id | INTEGER | REFERENCES positions(id) ON DELETE CASCADE | 职位ID (**v1.2: 可为空**) |
| interviewer | INTEGER | REFERENCES users(id) | 面试官/操作人ID (可为空) |
| rating | INTEGER | CHECK (rating >= 1 AND rating <= 4) | 评分 (4分制，状态变更时可为空) |
| comments | TEXT | NULLABLE | 评价内容/变更原因/系统描述 |
| interview_date | DATE | NULLABLE | 面试日期 (状态变更时可为空) |
| new_status | VARCHAR(20) | NULLABLE | 新状态 (状态变更记录) |
| is_status_change | BOOLEAN | DEFAULT false | 是否为状态变更记录 |
| is_deleted | BOOLEAN | DEFAULT false | 软删除标记 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**索引**:
```sql
CREATE INDEX idx_interview_feedbacks_candidate ON interview_feedbacks(candidate_id);
CREATE INDEX idx_interview_feedbacks_position ON interview_feedbacks(position_id);
CREATE INDEX idx_interview_feedbacks_status_change ON interview_feedbacks(is_status_change);
CREATE INDEX idx_interview_feedbacks_is_deleted ON interview_feedbacks(is_deleted);
```

**多重职能**:
1. **面试评价记录**: `is_status_change=false`, `position_id`非空, 填写`rating`, `interview_date`
2. **状态变更记录**: `is_status_change=true`, 填写`new_status`, `comments`(变更原因)
3. **候选人级别记录**: `position_id`为NULL (v1.2新增)

---

### 5. users (用户表)

**功能**: 存储系统用户信息

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | SERIAL | PRIMARY KEY | 自增主键 |
| email | VARCHAR(255) | UNIQUE NOT NULL | 邮箱 |
| name | VARCHAR(100) | NOT NULL | 姓名 |
| role | VARCHAR(20) | DEFAULT 'recruiter' | 角色 |
| is_deleted | BOOLEAN | DEFAULT false | 软删除标记 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**索引**:
```sql
CREATE INDEX idx_users_is_deleted ON users(is_deleted);
```

**注意**: v1.x不实现认证授权，仅基础CRUD

---

## 数据完整性规则

### 软删除级联

当删除记录时，需要级联软删除相关数据：

```python
# 删除候选人时
def soft_delete_candidate(candidate_id):
    # 1. 标记候选人为已删除
    candidates.update(id=candidate_id, is_deleted=True)

    # 2. 级联软删除关联记录
    position_candidates.update(candidate_id=candidate_id, is_deleted=True)
    interview_feedbacks.update(candidate_id=candidate_id, is_deleted=True)

# 删除职位时
def soft_delete_position(position_id):
    # 1. 标记职位为已删除
    positions.update(id=position_id, is_deleted=True)

    # 2. 级联软删除关联记录
    position_candidates.update(position_id=position_id, is_deleted=True)
```

### 查询过滤

所有查询必须过滤软删除记录：

```sql
SELECT * FROM candidates WHERE is_deleted = false;
SELECT * FROM positions WHERE is_deleted = false;
```

---

## 即将废弃 (v2.0重构)

当引入认证和组织管理后，以下结构将改变：

1. **所有业务表添加 `org_id` 列**
   ```sql
   ALTER TABLE candidates ADD COLUMN org_id UUID REFERENCES organizations(id);
   ALTER TABLE positions ADD COLUMN org_id UUID REFERENCES organizations(id);
   -- ...其他表类似
   ```

2. **users表重构**
   ```sql
   DROP TABLE users CASCADE;
   CREATE TABLE users (
       id UUID PRIMARY KEY REFERENCES auth.users(id),
       name VARCHAR(255) NOT NULL,
       email VARCHAR(255) NOT NULL,
       current_org_id UUID REFERENCES organizations(id),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

3. **启用 Row Level Security (RLS)**
   ```sql
   ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "org_isolation" ON candidates
     FOR ALL USING (org_id = auth.current_org_id());
   ```

详细设计见: `docs/auth_and_org_design.md`

---

## 数据清除工具

为数据库结构更新提供的清理脚本：

```bash
# 清除所有业务表数据
uv run python backend/scripts/clear_all_data.py

# 清除单个表
uv run python backend/scripts/clear_all_data.py --table candidates

# 跳过确认（自动化脚本）
uv run python backend/scripts/clear_all_data.py --confirm
```

---

## 数据库迁移流程

### 当前环境 (v1.2 → v2.0)

由于可以清除现有数据，采用**清空重建**方式：

```bash
# 1. 备份关键数据（如果需要）
# (可选步骤)

# 2. 清除所有表数据
uv run python backend/scripts/clear_all_data.py --confirm

# 3. 在 Supabase SQL Editor 执行新schema
# 复制 auth_and_org_design.md 中的建表SQL

# 4. 重启应用
# backend和frontend会自动连接新schema
```

### 生产环境 (未来)

如果有生产数据，需要正式的迁移脚本：

```sql
-- 示例: 添加 org_id 列的迁移
BEGIN;

-- 1. 添加列（可空）
ALTER TABLE candidates ADD COLUMN org_id UUID;

-- 2. 创建默认组织并回填
INSERT INTO organizations (id, name, created_by)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Org', 1);

UPDATE candidates SET org_id = '00000000-0000-0000-0000-000000000001'
WHERE org_id IS NULL;

-- 3. 设置为非空
ALTER TABLE candidates ALTER COLUMN org_id SET NOT NULL;

-- 4. 添加外键
ALTER TABLE candidates
  ADD CONSTRAINT fk_candidates_org
  FOREIGN KEY (org_id) REFERENCES organizations(id);

COMMIT;
```

---

## 参考文档

- **产品需求**: `docs/ai_resume_prd.md` - 完整PRD和业务规则
- **后端API**: `backend/README.md` - 所有API端点文档
- **认证设计**: `docs/auth_and_org_design.md` - v2.0认证和组织管理设计
- **开发规范**: `docs/rule.md` - 编码标准和工具
- **项目总览**: `CLAUDE.md` - 项目架构和指导原则
