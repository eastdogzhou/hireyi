# AI 人才筛选系统 PRD

---
**文档版本**: v2.0
**数据库版本**: v2.0
**最后更新**: 2025-01-27
**状态**: 生产就绪
---

## 版本历史

| 版本 | 日期 | 主要变更 |
|------|------|---------|
| v2.0 | 2025-01-27 | interview_feedbacks表重构：支持三种互斥记录类型（面试评价、AI评价、状态变更），interviewer改为UUID，新增interviewer_type和ai_rating字段 |
| v1.4 | 2025-01-25 | 全局评分改为10分制 (0-10)，基于简历内容的LLM评分系统 |
| v1.3 | 2025-01-25 | candidates表添加resume_text字段存储简历纯文本 |
| v1.2 | 2024-10-22 | interview_feedbacks.position_id改为可空，支持候选人级别记录 |
| v1.1 | 2024-10-20 | 职位匹配评分调整为4分制 |
| v1.0 | 2024-10-15 | 初始PRD |

---

## 评分系统说明 ⚠️ 重要

本系统使用**两种独立的评分体系**，请务必区分：

### 1. 候选人全局评分 (Candidate Global Score)

- **字段**: `candidates.score`
- **分值范围**: **0-10 (10分制)**
- **用途**: 评估候选人简历质量和综合素质
- **评估依据**: 完全基于简历内容，与具体职位无关
- **计算方式**: LLM自动评分，包含6个维度：
  - 院校评分 (0-3分)
  - 专业匹配度 (0-2分)
  - 学历评分 (0-2分)
  - GPA评分 (0-1分)
  - AI经验 (0-1分)
  - 国家级竞赛 (0-1分)

### 2. 职位匹配评分 (Position Matching Score)

- **字段**: `position_candidates.relevance_score`, `fit_score`, `overall_score`
- **分值范围**: **1-4 (4分制)**
- **用途**: 评估候选人与特定职位的匹配程度
- **评估依据**: 候选人简历 + 职位JD
- **计算方式**: LLM打分
  - `relevance_score`: 技能相关度 (1-4)
  - `fit_score`: 经验适配度 (1-4)
  - `overall_score`: 综合得分 (1-4，用于展示)
  - `overall_score_numeric`: 综合得分数值 (0-100，用于精确排序)

### 3. 面试评价评分 (Interview Rating)

- **字段**: `interview_feedbacks.interview_rating`
- **分值范围**: **1-4 (4分制)**
- **用途**: 面试官对候选人的主观评价
- **评估依据**: 面试表现

### 4. AI 评价评分 (AI Rating) - v2.0 新增

- **字段**: `interview_feedbacks.ai_rating`
- **分值范围**: **1-10 (10分制)**
- **用途**: AI 对候选人面试的自动评估
- **评估依据**: AI 面试对话内容分析
- **互斥性**: 与 interview_rating 和 new_status 互斥

**⚠️ 注意**: 不要混淆这四种评分！interview_rating、ai_rating、new_status 三个字段在 interview_feedbacks 表中同一条记录只能有一个非空。

---

## 1. 产品概述

### 1.1 产品定位
基于 AI 的简历管理和人才筛选系统，帮助招聘团队高效管理候选人并智能匹配职位。

### 1.2 核心价值
- 自动化简历信息提取，构建结构化人才库
- AI 智能匹配职位和候选人
- 集中管理面试评价和候选人状态

### 1.3 技术栈
- **后端**: Python (FastAPI) + Supabase
- **前端**: React + TypeScript
- **数据库**: PostgreSQL (通过 Supabase 管理)
- **API**: Supabase Auto-generated REST API (PostgREST)
- **AI**: LLM API (用于简历解析和打分)

---

## 2. 核心功能需求

### 2.1 人才库管理

#### 2.1.1 功能描述
系统存储所有简历，自动提取关键信息形成结构化人才库。

#### 2.1.2 数据字段
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 候选人唯一标识（自增主键） |
| name | VARCHAR(100) | 姓名 |
| phone | VARCHAR(20) | 手机号（可选） |
| email | VARCHAR(255) | 邮箱（可选） |
| skills | TEXT[] | 关键技能列表 |
| highlights | TEXT | 简历亮点（AI 提取） |
| years_of_experience | INTEGER | 工作年限（AI 提取，用于全局评分） |
| education_level | VARCHAR(50) | 最高学历（本科/硕士/博士/大专） |
| recent_company | VARCHAR(200) | 最近一家公司名称 |
| recent_position | VARCHAR(200) | 最近职位名称 |
| score | INTEGER | 全局综合评分 (0-10，10分制，基于简历内容的LLM评分) |
| resume_file | VARCHAR(500) | 简历文件路径（阿里云 OSS） |
| resume_md5 | VARCHAR(32) | 简历文件MD5值（用于唯一性判断） |
| resume_text | TEXT | 简历纯文本内容（AI提取，用于全文搜索） |
| is_deleted | BOOLEAN | 软删除标记 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**候选人唯一性规则**：
- **优先级1**：通过 `name` + `phone` 组合判断（如果phone不为空）
- **优先级2**：通过 `resume_md5` 判断（如果phone为空）
- 如果候选人已存在，上传新简历时覆盖原有信息并更新 `resume_md5`

#### 2.1.3 功能要点
- 支持上传 PDF/DOC 格式简历
- AI 自动解析提取关键信息（支持重试机制）
- 支持手动编辑和补充候选人信息
- 人才库列表支持搜索和筛选（姓名模糊搜索、技能标签、评分范围、时间范围）
- 简历文件存储在**阿里云 OSS**（非 Supabase Storage）

#### 2.1.4 API 示例

**获取候选人列表**
```http
GET /rest/v1/candidates?select=*&limit=20&offset=0
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

**创建候选人**
```http
POST /rest/v1/candidates
Content-Type: application/json
Authorization: Bearer YOUR_SUPABASE_ANON_KEY

{
  "name": "张三",
  "phone": "13812345678",
  "email": "zhangsan@example.com",
  "skills": ["Python", "React", "PostgreSQL"],
  "highlights": "5年全栈开发经验，具备大型项目架构能力",
  "score": 3,
  "resume_md5": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

**搜索候选人**
```http
GET /rest/v1/candidates?select=*&skills=cs.{"Python","React"}
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

---

### 2.2 职位管理

#### 2.2.1 职位 CRUD
**功能**: 管理员可以创建、编辑、删除职位

**职位数据字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 职位唯一标识（自增主键） |
| title | VARCHAR(200) | 职位名称 |
| department | VARCHAR(100) | 部门 |
| jd | TEXT | 职位描述 (Job Description) |
| requirements | JSONB | 职位要求（技能、经验等） |
| status | VARCHAR(20) | 状态：open/closed |
| created_by | INTEGER | 创建人 ID |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**页面**:
- 职位列表页（表格展示）
- 职位详情页（展示 JD + 关联候选人）
- 职位编辑页（表单）

#### 2.2.2 职位管理 API 示例

**创建职位**
```http
POST /rest/v1/positions
Content-Type: application/json
Authorization: Bearer YOUR_SUPABASE_ANON_KEY

{
  "title": "高级前端工程师",
  "department": "技术部",
  "jd": "负责公司核心产品的前端开发工作...",
  "requirements": {
    "skills": ["React", "TypeScript", "Node.js"],
    "experience": "3年以上前端开发经验",
    "education": "本科及以上学历"
  },
  "status": "open"
}
```

**获取职位详情**
```http
GET /rest/v1/positions?select=*,position_candidates(candidate_id,candidates(*))&id=eq.1
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

#### 2.2.3 人才来源方式

**方式 1: 手动上传简历**
- 在职位详情页点击"上传简历"按钮
- 支持批量上传（多文件选择）
- 上传后自动：
  1. 解析简历信息
  2. 创建候选人记录（如不存在）
  3. 关联到当前职位
  4. 触发 AI 打分

**方式 2: 智能筛选**
- 职位详情页有"智能筛选"按钮
- 点击后：
  1. **预筛选阶段**：使用关键词匹配进行初步筛选
  2. **AI 精排阶段**：对预筛选结果使用 LLM 打分和排序
  3. 自动关联到职位（最多 100 个候选人）
  4. 按匹配度排序
- 可多次执行：
  - 跳过已存在的关联
  - 仅添加新增候选人
  - 重新计算所有关联候选人的分数

#### 2.2.4 候选人打分排序

**打分逻辑**:
- **相关度得分** (1-4): 技能匹配度（4分制）
- **适配度得分** (1-4): 经验、背景匹配度（4分制）
- **综合得分** (1-4): 综合评价（4分制，用于展示）
- **综合得分（数值）** (0-100): 用于精确排序，计算公式 = (相关度 × 0.6) + (适配度 × 0.4) 后转换为百分制
- 权重为硬编码（第一阶段不支持配置）

**分数缓存与更新**:
- 分数存储在 `position_candidates` 表：
  - `relevance_score`: 相关度得分 (1-4)
  - `fit_score`: 适配度得分 (1-4)
  - `overall_score`: 综合得分 (1-4，用于展示)
  - `overall_score_numeric`: 综合得分数值 (0-100，用于排序)
- 触发重新计算的情况：
  - 候选人信息更新（简历、技能等）
  - 职位 JD 更新
  - 用户手动触发重新计算

**展示**:
- 职位详情页展示关联候选人列表
- **默认按 overall_score_numeric 降序排序**（精确排序）
- 支持按更新时间排序
- 支持按状态筛选
- 支持候选人姓名搜索
- 每个候选人卡片显示：
  - 姓名、联系方式
  - 关键技能标签
  - 匹配得分（展示 overall_score 的4分制评级）
  - 快速操作按钮（查看详情、面试评价）

---

### 2.3 面试评价与候选人状态

#### 2.3.1 候选人详情页

**页面结构**:
```
┌─────────────────────────────────────┐
│ 候选人基本信息                        │
├─────────────────────────────────────┤
│ 关联职位列表                          │
├─────────────────────────────────────┤
│ 面试评价历史 (Timeline)               │
│  ├─ 2024-10-10 一面 - 技术面试       │
│  ├─ 2024-10-15 二面 - HR 面试        │
│  └─ ...                              │
├─────────────────────────────────────┤
│ 当前状态                              │
└─────────────────────────────────────┘
```

#### 2.3.2 执行记录数据（面试评价表）

**数据库版本**: v2.0 (2025-01-27)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 记录唯一标识（自增主键） |
| candidate_id | INTEGER | 候选人 ID（必填） |
| position_id | INTEGER | 关联职位（可空，支持候选人级别记录） |
| interviewer | UUID | 面试官/AI/系统操作者 UUID（必填，无外键约束） |
| interviewer_type | VARCHAR(20) | 评价者类型：'user', 'agent', 'system'（必填） |
| interview_date | DATE | 面试日期（必填，非面试记录填 created_at 日期） |
| comments | TEXT | 面试评价、AI评价、状态变更原因、或系统事件描述（必填） |
| interview_rating | INTEGER | 面试评分 (1-4，4分制)，与 ai_rating、new_status 互斥 |
| ai_rating | INTEGER | AI 评分 (1-10，10分制)，与 interview_rating、new_status 互斥 |
| new_status | VARCHAR(20) | 新状态（用于状态变更记录），与 interview_rating、ai_rating 互斥 |
| is_deleted | BOOLEAN | 软删除标记 |
| created_at | TIMESTAMP | 创建时间 |

**说明**：
- **v2.0 重大架构变更**：该表支持三种互斥的记录类型
- **三种记录类型**（互斥）：
  - **面试评价记录**：`interview_rating` 非空，`interviewer_type='user'`，记录人工面试评价
  - **AI 评价记录**：`ai_rating` 非空，`interviewer_type='agent'`，记录 AI 面试评估
  - **状态变更/日志记录**：`new_status` 非空，`interviewer_type` 可为 'user', 'agent', 'system'，记录状态变更或系统事件
- **字段互斥约束**：`interview_rating`、`ai_rating`、`new_status` 三个字段只能有一个非空（应用层校验）
- **interviewer 字段变更**：从 INTEGER 改为 UUID，无外键约束，支持引用 users 或未来的 agents 表
- **必填字段**：candidate_id、interviewer、interviewer_type、interview_date、comments 均为必填
- **position_id 可空**：支持候选人级别的记录（与职位无关的事件）
- 按时间排序展示，形成完整的候选人处理时间线

#### 2.3.3 候选人状态

**状态枚举**:
- `screening`: 简历筛选中
- `interview`: 面试中
- `offer`: 已发 Offer
- `hired`: 已入职
- `rejected`: 已拒绝
- `withdrawn`: 候选人主动放弃

**状态管理规则**:
- 状态存储在 `position_candidates.current_status`
- 候选人全局状态 = 所有职位中最新更新的非 screening 状态
- 状态流转无严格限制，可从任意状态变更为任意状态
- 状态变更记录在 `interview_feedbacks` 表中（扩展表职能）

**状态流转**:
- 在候选人详情页可手动更新状态
- 状态变更时创建 `interview_feedbacks` 记录，包含：
  - 新状态
  - 变更原因（在 `comments` 字段）
  - 操作人
  - 时间戳

#### 2.3.4 面试评价 API 示例

**创建面试评价记录（v2.0）**
```http
POST /api/interview-feedbacks/
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "candidate_id": 1,
  "position_id": 1,
  "interviewer": "12345678-1234-5678-1234-567812345678",  // UUID
  "interviewer_type": "user",
  "interview_rating": 4,
  "comments": "技术基础扎实，沟通能力良好，建议进入二面",
  "interview_date": "2025-01-27"
}
```

**创建 AI 评价记录（v2.0 新增）**
```http
POST /api/interview-feedbacks/
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "candidate_id": 1,
  "position_id": 1,
  "interviewer": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",  // AI agent UUID
  "interviewer_type": "agent",
  "ai_rating": 8,
  "comments": "AI 面试评估：技术能力强，项目经验丰富",
  "interview_date": "2025-01-27"
}
```

**创建状态变更记录（v2.0）**
```http
POST /api/interview-feedbacks/status-change
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "candidate_id": 1,
  "position_id": 1,
  "interviewer": "12345678-1234-5678-1234-567812345678",
  "interviewer_type": "user",
  "new_status": "interview",
  "comments": "通过初筛，进入面试流程"
}
```

---

## 3. 数据模型设计

### 3.1 核心表结构

```sql
-- 候选人表
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),  -- 手机号（可选）
    email VARCHAR(255),  -- 邮箱（可选）
    skills TEXT[] DEFAULT '{}',
    highlights TEXT,
    years_of_experience INTEGER,  -- 工作年限（AI提取，用于全局评分）
    education_level VARCHAR(50),  -- 最高学历（本科/硕士/博士/大专）
    recent_company VARCHAR(200),  -- 最近一家公司名称
    recent_position VARCHAR(200),  -- 最近职位名称
    score INTEGER CHECK (score >= 0 AND score <= 10),  -- 全局综合评分（10分制，基于简历内容的LLM评分）
    resume_file VARCHAR(500) NOT NULL,  -- 阿里云 OSS 文件路径
    resume_md5 VARCHAR(32) NOT NULL,  -- 简历文件MD5值，用于唯一性判断
    resume_text TEXT,  -- 简历纯文本内容（AI提取，用于全文搜索）
    is_deleted BOOLEAN DEFAULT false,  -- 软删除标记
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 职位表
CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    department VARCHAR(100),
    jd TEXT NOT NULL,
    requirements JSONB,
    status VARCHAR(20) DEFAULT 'open',
    created_by INTEGER REFERENCES users(id),  -- 创建人ID
    is_deleted BOOLEAN DEFAULT false,  -- 软删除标记
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 职位候选人关联表
CREATE TABLE position_candidates (
    id SERIAL PRIMARY KEY,
    position_id INTEGER REFERENCES positions(id) ON DELETE CASCADE,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    relevance_score INTEGER CHECK (relevance_score >= 1 AND relevance_score <= 4),  -- 相关度得分（4分制）
    fit_score INTEGER CHECK (fit_score >= 1 AND fit_score <= 4),  -- 适配度得分（4分制）
    overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 4),  -- 综合得分（4分制，用于展示）
    overall_score_numeric INTEGER CHECK (overall_score_numeric >= 0 AND overall_score_numeric <= 100),  -- 综合得分数值（用于排序）
    current_status VARCHAR(20) DEFAULT 'screening',
    is_deleted BOOLEAN DEFAULT false,  -- 软删除标记
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(position_id, candidate_id)
);

-- 面试评价表（执行记录表，支持三种互斥的记录类型）
-- v2.0 (2025-01-27): 重大重构，支持面试评价、AI评价、状态变更三种类型
CREATE TABLE interview_feedbacks (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    position_id INTEGER REFERENCES positions(id) ON DELETE CASCADE,  -- 可空，支持候选人级别记录

    -- 评价者信息（必填，无外键约束以支持多种引用）
    interviewer UUID NOT NULL,  -- 面试官/AI/系统操作者 UUID
    interviewer_type VARCHAR(20) NOT NULL CHECK (interviewer_type IN ('user', 'agent', 'system')),

    -- 核心字段（必填）
    interview_date DATE NOT NULL,  -- 面试日期（非面试记录填 created_at 日期）
    comments TEXT NOT NULL,  -- 评价内容、变更原因、或系统日志

    -- 三种互斥的记录类型字段
    interview_rating INTEGER CHECK (interview_rating >= 1 AND interview_rating <= 4),  -- 面试评分（4分制）
    ai_rating INTEGER CHECK (ai_rating >= 1 AND ai_rating <= 10),  -- AI评分（10分制）
    new_status VARCHAR(20) CHECK (new_status IN ('screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn')),  -- 状态变更

    is_deleted BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 用户表（第一阶段实现基础 CRUD，不做认证授权）
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'recruiter',
    is_deleted BOOLEAN DEFAULT false,  -- 软删除标记
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_candidates_skills ON candidates USING GIN(skills);
CREATE INDEX idx_candidates_name ON candidates(name);
CREATE INDEX idx_candidates_phone ON candidates(phone);  -- 手机号查询优化
CREATE INDEX idx_candidates_is_deleted ON candidates(is_deleted);  -- 软删除查询优化
CREATE INDEX idx_candidates_score ON candidates(score);  -- 评分排序优化

CREATE INDEX idx_positions_status ON positions(status);
CREATE INDEX idx_positions_is_deleted ON positions(is_deleted);  -- 软删除查询优化

CREATE INDEX idx_position_candidates_position ON position_candidates(position_id);
CREATE INDEX idx_position_candidates_candidate ON position_candidates(candidate_id);
CREATE INDEX idx_position_candidates_status ON position_candidates(current_status);  -- 状态筛选优化
CREATE INDEX idx_position_candidates_score_numeric ON position_candidates(overall_score_numeric);  -- 排序优化
CREATE INDEX idx_position_candidates_is_deleted ON position_candidates(is_deleted);  -- 软删除查询优化

CREATE INDEX idx_interview_feedbacks_candidate ON interview_feedbacks(candidate_id);
CREATE INDEX idx_interview_feedbacks_position ON interview_feedbacks(position_id);
CREATE INDEX idx_interview_feedbacks_interviewer ON interview_feedbacks(interviewer);  -- 按评价者查询优化
CREATE INDEX idx_interview_feedbacks_interviewer_type ON interview_feedbacks(interviewer_type);  -- 按评价者类型查询优化
CREATE INDEX idx_interview_feedbacks_is_deleted ON interview_feedbacks(is_deleted);  -- 软删除查询优化

CREATE INDEX idx_users_is_deleted ON users(is_deleted);  -- 软删除查询优化

-- 唯一约束（用于候选人唯一性判断）
-- 优先级1：name + phone
CREATE UNIQUE INDEX idx_candidates_unique_name_phone
ON candidates(name, phone)
WHERE is_deleted = false AND phone IS NOT NULL;

-- 优先级2：resume_md5
CREATE UNIQUE INDEX idx_candidates_unique_resume_md5
ON candidates(resume_md5)
WHERE is_deleted = false;
```

---

## 4. Supabase 集成方案

### 4.1 Supabase 项目配置

#### 4.1.1 环境变量设置
```bash
# .env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### 4.1.2 Python SDK 初始化
```python
import os
from supabase import create_client, Client

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)
```

### 4.2 数据库 CRUD 操作

#### 4.2.1 候选人管理服务示例

```python
class CandidateService:
    def __init__(self, supabase_client):
        self.supabase = supabase_client
    
    def create_candidate(self, candidate_data: dict):
        """创建候选人"""
        response = (
            self.supabase.table("candidates")
            .insert(candidate_data)
            .execute()
        )
        return response.data
    
    def get_candidates(self, limit: int = 20, offset: int = 0, search: str = None):
        """获取候选人列表"""
        query = self.supabase.table("candidates").select("*")
        
        if search:
            query = query.or_(f"name.ilike.%{search}%,skills.cs.{{{search}}}")
        
        response = (
            query.order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return response.data
    
    def get_candidate_by_id(self, candidate_id: int):
        """获取候选人详情"""
        response = (
            self.supabase.table("candidates")
            .select("*")
            .eq("id", candidate_id)
            .single()
            .execute()
        )
        return response.data
    
    def update_candidate(self, candidate_id: int, update_data: dict):
        """更新候选人信息"""
        response = (
            self.supabase.table("candidates")
            .update(update_data)
            .eq("id", candidate_id)
            .execute()
        )
        return response.data
    
    def delete_candidate(self, candidate_id: int):
        """删除候选人"""
        response = (
            self.supabase.table("candidates")
            .delete()
            .eq("id", candidate_id)
            .execute()
        )
        return response.data
```

#### 4.2.2 职位管理服务示例

```python
class PositionService:
    def __init__(self, supabase_client):
        self.supabase = supabase_client
    
    def create_position(self, position_data: dict):
        """创建职位"""
        response = (
            self.supabase.table("positions")
            .insert(position_data)
            .execute()
        )
        return response.data
    
    def get_position_with_candidates(self, position_id: int):
        """获取职位详情及关联候选人"""
        response = (
            self.supabase.table("positions")
            .select("""
                *,
                position_candidates(
                    *,
                    candidates(*)
                )
            """)
            .eq("id", position_id)
            .single()
            .execute()
        )
        return response.data
    
    def link_candidate_to_position(self, position_id: int, candidate_id: int, scores: dict):
        """关联候选人到职位"""
        link_data = {
            "position_id": position_id,
            "candidate_id": candidate_id,
            "relevance_score": scores.get("relevance_score"),
            "fit_score": scores.get("fit_score"),
            "overall_score": scores.get("overall_score")
        }
        
        response = (
            self.supabase.table("position_candidates")
            .upsert(link_data)
            .execute()
        )
        return response.data
```

#### 4.2.3 面试评价服务示例

```python
class InterviewFeedbackService:
    def __init__(self, supabase_client):
        self.supabase = supabase_client
    
    def create_feedback(self, feedback_data: dict):
        """创建面试评价"""
        response = (
            self.supabase.table("interview_feedbacks")
            .insert(feedback_data)
            .execute()
        )
        return response.data
    
    def get_candidate_feedbacks(self, candidate_id: int):
        """获取候选人所有评价"""
        response = (
            self.supabase.table("interview_feedbacks")
            .select("*")
            .eq("candidate_id", candidate_id)
            .order("interview_date", desc=True)
            .execute()
        )
        return response.data
```

### 4.3 文件存储集成（阿里云 OSS）

**重要变更**：简历文件存储使用**阿里云 OSS**，而非 Supabase Storage。

#### 4.3.1 环境变量配置
```bash
# 阿里云 OSS 配置
ALIYUN_OSS_ACCESS_KEY_ID=your-access-key-id
ALIYUN_OSS_ACCESS_KEY_SECRET=your-access-key-secret
ALIYUN_OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
ALIYUN_OSS_BUCKET=resume-screening-bucket
```

#### 4.3.2 简历文件上传
```python
import oss2
import time
from typing import Optional

class FileService:
    def __init__(self, access_key_id: str, access_key_secret: str, endpoint: str, bucket_name: str):
        """初始化阿里云 OSS 客户端"""
        auth = oss2.Auth(access_key_id, access_key_secret)
        self.bucket = oss2.Bucket(auth, endpoint, bucket_name)

    def upload_resume(self, file_content: bytes, candidate_name: str, file_extension: str = "pdf") -> Optional[str]:
        """上传简历文件到阿里云 OSS

        :param file_content: 文件二进制内容
        :param candidate_name: 候选人姓名
        :param file_extension: 文件扩展名
        :return: 文件的公开访问 URL
        """
        # 生成唯一文件路径
        timestamp = int(time.time())
        file_path = f"resumes/{candidate_name}_{timestamp}.{file_extension}"

        try:
            # 上传文件
            result = self.bucket.put_object(file_path, file_content)

            if result.status == 200:
                # 生成公开访问 URL（第一阶段使用公开访问）
                public_url = f"https://{self.bucket.bucket_name}.{self.bucket.endpoint}/{file_path}"
                return public_url
            return None
        except oss2.exceptions.OssError as e:
            logging.error(f"OSS 上传失败: {e}")
            return None

    def delete_resume(self, file_path: str) -> bool:
        """删除简历文件

        :param file_path: OSS 中的文件路径
        :return: 是否删除成功
        """
        try:
            self.bucket.delete_object(file_path)
            return True
        except oss2.exceptions.OssError as e:
            logging.error(f"OSS 删除失败: {e}")
            return False
```

**依赖安装**:
```bash
uv add oss2
```

---

## 5. API 设计规范

### 5.1 RESTful API 结构

基于 Supabase PostgREST 的自动 API，遵循以下规范：

#### 5.1.1 基础 CRUD 操作
```
# 候选人相关
GET    /rest/v1/candidates              # 获取候选人列表
GET    /rest/v1/candidates?id=eq.1      # 获取候选人详情
POST   /rest/v1/candidates              # 创建候选人
PATCH  /rest/v1/candidates?id=eq.1      # 更新候选人信息
DELETE /rest/v1/candidates?id=eq.1      # 删除候选人

# 职位相关
GET    /rest/v1/positions               # 获取职位列表
GET    /rest/v1/positions?id=eq.1       # 获取职位详情
POST   /rest/v1/positions               # 创建职位
PATCH  /rest/v1/positions?id=eq.1       # 更新职位
DELETE /rest/v1/positions?id=eq.1       # 删除职位

# 关联关系
GET    /rest/v1/position_candidates     # 获取职位候选人关联
POST   /rest/v1/position_candidates     # 创建关联关系
PATCH  /rest/v1/position_candidates?id=eq.1  # 更新关联信息

# 面试评价
GET    /rest/v1/interview_feedbacks     # 获取面试评价
POST   /rest/v1/interview_feedbacks     # 创建面试评价
```

#### 5.1.2 高级查询示例

**分页查询**
```http
GET /rest/v1/candidates?select=*&limit=10&offset=20
```

**条件筛选**
```http
GET /rest/v1/candidates?select=*&score=gte.80&skills=cs.{"Python","React"}
```

**关联查询**
```http
GET /rest/v1/positions?select=*,position_candidates(candidate_id,candidates(name,phone,email))
```

**排序**
```http
GET /rest/v1/candidates?select=*&order=score.desc,created_at.desc
```

### 5.2 自定义业务接口

对于复杂业务逻辑，通过 FastAPI 包装 Supabase 操作：

```python
from fastapi import FastAPI, UploadFile, File
from services.candidate_service import CandidateService
from services.ai_service import AIService

app = FastAPI()

@app.post("/api/candidates/upload")
async def upload_resume(file: UploadFile = File(...), position_id: int = None):
    """上传简历并自动解析"""
    # 1. 读取文件内容
    file_content = await file.read()
    file_extension = file.filename.split('.')[-1]

    # 2. 上传文件到阿里云 OSS
    file_url = file_service.upload_resume(file_content, file.filename, file_extension)
    if not file_url:
        raise HTTPException(status_code=500, detail="文件上传失败")

    # 3. AI 解析简历
    try:
        parsed_data = ai_service.parse_resume(file_content)
    except Exception as e:
        # 解析失败，返回部分数据供用户手动编辑
        return {
            "status": "parse_failed",
            "file_url": file_url,
            "error": str(e),
            "partial_data": {"resume_file": file_url}
        }

    # 4. 检查候选人是否已存在（通过姓名+手机号或resume_md5）
    existing_candidate = candidate_service.find_candidate_by_unique_key(
        parsed_data["name"],
        parsed_data.get("phone"),
        resume_md5
    )

    if existing_candidate:
        # 覆盖更新现有候选人
        candidate = candidate_service.update_candidate(
            existing_candidate["id"],
            {**parsed_data, "resume_file": file_url}
        )
    else:
        # 创建新候选人记录
        candidate = candidate_service.create_candidate({**parsed_data, "resume_file": file_url})

    # 5. 如果指定了职位，自动关联
    if position_id:
        scores = ai_service.calculate_match_score(candidate["id"], position_id)
        position_service.link_candidate_to_position(position_id, candidate["id"], scores)

    return {"status": "success", "candidate": candidate, "file_url": file_url}

@app.post("/api/positions/{position_id}/screening")
async def intelligent_screening(position_id: int, limit: int = 100):
    """智能筛选候选人（两阶段：预筛选 + AI 精排）"""
    # 1. 获取职位信息
    position = position_service.get_position_by_id(position_id)

    # 2. 预筛选阶段：关键词匹配
    required_skills = position.get("requirements", {}).get("skills", [])
    pre_filtered = candidate_service.keyword_filter(
        required_skills,
        position["jd"],
        limit=min(limit * 2, 200)  # 预筛选候选人数量为目标的2倍
    )

    if not pre_filtered:
        return {"status": "no_candidates", "linked_candidates": []}

    # 3. AI 精排阶段：批量打分
    scored_candidates = []
    for candidate in pre_filtered:
        # 检查是否已关联，跳过已存在的
        if position_service.is_linked(position_id, candidate["id"]):
            # 重新计算分数
            scores = ai_service.calculate_match_score(candidate["id"], position_id)
            position_service.update_scores(position_id, candidate["id"], scores)
            continue

        scores = ai_service.calculate_match_score(candidate["id"], position_id)
        scored_candidates.append({
            "candidate": candidate,
            "scores": scores
        })

    # 4. 按得分排序
    scored_candidates.sort(key=lambda x: x["scores"]["overall_score"], reverse=True)

    # 5. 自动关联前 N 名（最多 limit 个）
    top_candidates = scored_candidates[:limit]
    linked_count = 0
    for item in top_candidates:
        try:
            position_service.link_candidate_to_position(
                position_id,
                item["candidate"]["id"],
                item["scores"]
            )
            linked_count += 1
        except Exception as e:
            logging.warning(f"关联候选人失败: {e}")
            continue

    return {
        "status": "success",
        "linked_count": linked_count,
        "top_candidates": top_candidates[:20]  # 返回前20个供前端展示
    }
```

---

## 6. 前端页面结构

### 6.1 路由设计

```
/                          # 首页（重定向到人才库或职位列表）
/candidates                # 人才库列表
/candidates/:id            # 候选人详情页
/positions                 # 职位列表
/positions/:id             # 职位详情页
/positions/new             # 新建职位
/positions/:id/edit        # 编辑职位
```

### 6.2 核心组件

**人才库页面**:
- `CandidateList`: 列表组件（表格）
- `CandidateSearchBar`: 搜索筛选组件
- `UploadResumeModal`: 上传简历弹窗

**职位详情页**:
- `PositionHeader`: 职位基本信息
- `CandidateScoreList`: 关联候选人列表（按得分排序）
- `UploadButton`: 上传简历按钮
- `ScreeningButton`: 智能筛选按钮

**候选人详情页**:
- `CandidateProfile`: 基本信息卡片
- `RelatedPositions`: 关联职位列表
- `InterviewTimeline`: 面试评价时间线
- `StatusBadge`: 状态标签
- `AddFeedbackModal`: 添加评价弹窗

### 6.3 Supabase 前端集成

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// hooks/useCandidates.ts
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useCandidates() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCandidates()
  }, [])

  const fetchCandidates = async () => {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setCandidates(data)
    setLoading(false)
  }

  const createCandidate = async (candidateData: any) => {
    const { data, error } = await supabase
      .from('candidates')
      .insert([candidateData])
      .select()

    if (data) {
      setCandidates([...candidates, ...data])
    }
    return { data, error }
  }

  return { candidates, loading, createCandidate, refetch: fetchCandidates }
}
```

---

## 7. AI 集成方案

### 7.1 简历解析

**流程**:
1. 用户上传简历文件
2. 后端读取文件内容
3. 调用 LLM API 提取结构化信息
4. 存储到 Supabase 数据库

**Prompt 示例**:
```python
def parse_resume_prompt(resume_text: str) -> str:
    return f"""
解析以下简历内容，提取以下信息（以 JSON 格式返回）：
- name: 姓名
- phone: 手机号（可能为空）
- email: 邮箱（可能为空）
- skills: 技能列表（数组格式）
- highlights: 3-5 个简历亮点
- experience_years: 工作年限（数字）
- education: 教育背景

简历内容：
{resume_text}

请确保返回格式为有效的 JSON。如果简历中没有手机号或邮箱，对应字段返回 null。
"""
```

**实现示例**:
```python
import openai
import json

class AIService:
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
    
    def parse_resume(self, resume_text: str) -> dict:
        """解析简历"""
        prompt = parse_resume_prompt(resume_text)
        
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "你是一个专业的简历解析助手。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1
        )
        
        try:
            parsed_data = json.loads(response.choices[0].message.content)
            return parsed_data
        except json.JSONDecodeError:
            raise ValueError("AI 返回的数据格式不正确")
```

### 7.2 智能筛选与打分

**流程**:
1. 读取职位 JD 和要求
2. 遍历人才库中的候选人
3. 调用 LLM API 评估匹配度
4. 返回排序后的候选人列表

**Prompt 示例**:
```python
def matching_prompt(jd: str, candidate_info: dict) -> str:
    return f"""
职位要求：
{jd}

候选人信息：
姓名：{candidate_info['name']}
技能：{', '.join(candidate_info['skills'])}
亮点：{candidate_info['highlights']}

请评估候选人与职位的匹配度，返回 JSON 格式结果：
{{
  "relevance_score": 0-100,  // 技能相关度评分
  "fit_score": 0-100,        // 经验适配度评分
  "overall_score": 0-100,    // 综合评分
  "reasoning": "评分理由和建议"
}}
"""
```

**实现示例**:
```python
def calculate_match_score(self, candidate_id: int, position_id: int) -> dict:
    """计算候选人与职位的匹配分数"""
    # 获取候选人和职位信息
    candidate = self.candidate_service.get_candidate_by_id(candidate_id)
    position = self.position_service.get_position_by_id(position_id)
    
    prompt = matching_prompt(position['jd'], candidate)
    
    response = self.client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "你是一个专业的人才匹配分析师。"},
            {"role": "user", "content": prompt}
        ],
        temperature=0.1
    )
    
    try:
        scores = json.loads(response.choices[0].message.content)
        return scores
    except json.JSONDecodeError:
        return {
            "relevance_score": 50,
            "fit_score": 50,
            "overall_score": 50,
            "reasoning": "AI 分析出现问题，给出默认分数"
        }
```

---

## 8. 开发规范与工具

### 8.1 项目结构

```
project/
├── backend/
│   ├── app/
│   │   ├── api/              # API 路由
│   │   │   ├── candidates.py
│   │   │   ├── positions.py
│   │   │   └── feedbacks.py
│   │   ├── services/         # 业务逻辑
│   │   │   ├── candidate_service.py
│   │   │   ├── position_service.py
│   │   │   ├── ai_service.py
│   │   │   └── file_service.py
│   │   ├── models/           # Pydantic 模型
│   │   │   ├── candidate.py
│   │   │   ├── position.py
│   │   │   └── feedback.py
│   │   ├── config/           # 配置
│   │   │   ├── settings.py
│   │   │   └── supabase.py
│   │   └── utils/            # 工具函数
│   │       ├── file_utils.py
│   │       └── validation.py
│   ├── tests/
│   │   ├── test_candidates.py
│   │   ├── test_positions.py
│   │   └── test_ai_service.py
│   ├── pyproject.toml
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/       # 通用组件
│   │   │   ├── CandidateCard.tsx
│   │   │   ├── PositionCard.tsx
│   │   │   └── FileUpload.tsx
│   │   ├── pages/            # 页面组件
│   │   │   ├── candidates/
│   │   │   ├── positions/
│   │   │   └── dashboard/
│   │   ├── hooks/            # 自定义 hooks
│   │   │   ├── useCandidates.ts
│   │   │   ├── usePositions.ts
│   │   │   └── useSupabase.ts
│   │   ├── lib/              # 库文件
│   │   │   ├── supabase.ts
│   │   │   └── api.ts
│   │   ├── types/            # TypeScript 类型
│   │   │   ├── candidate.ts
│   │   │   ├── position.ts
│   │   │   └── feedback.ts
│   │   └── utils/            # 工具函数
│   │       ├── format.ts
│   │       └── validation.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── README.md
├── database/
│   ├── schema.sql            # 数据库表结构
│   ├── seed.sql              # 初始数据
│   └── migrations/           # 数据库迁移文件
├── docs/
│   ├── api.md               # API 文档
│   ├── deployment.md        # 部署文档
│   └── user-guide.md        # 用户指南
└── README.md
```

### 8.2 开发工具配置

#### 8.2.1 Python 后端
```toml
# pyproject.toml
[project]
name = "ai-resume-screening"
version = "0.1.0"
description = "AI-powered resume screening system"
dependencies = [
    "fastapi>=0.104.1",
    "supabase>=2.0.0",
    "python-multipart>=0.0.6",
    "python-dotenv>=1.0.0",
    "openai>=1.3.0",
    "PyPDF2>=3.0.0",
    "python-docx>=0.8.11",
    "uvicorn[standard]>=0.24.0"
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.21.0",
    "httpx>=0.25.0",
    "ruff>=0.1.0",
    "basedpyright>=1.8.0"
]

[tool.ruff]
line-length = 88
target-version = "py311"

[tool.basedpyright]
include = ["app"]
exclude = ["tests"]
```

#### 8.2.2 前端配置
```json
{
  "name": "ai-resume-screening-frontend",
  "version": "0.1.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.38.0",
    "next": "^14.0.0",
    "typescript": "^5.2.0",
    "tailwindcss": "^3.3.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.47.0",
    "lucide-react": "^0.292.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/node": "^20.8.0",
    "eslint": "^8.52.0",
    "eslint-config-next": "^14.0.0",
    "prettier": "^3.0.0"
  }
}
```

### 8.3 最小化实现策略

**第一阶段（MVP）- 2周**:
1. ✅ Supabase 项目初始化和数据库建表
2. ✅ 基础人才库 CRUD（使用 Supabase REST API）
3. ✅ 职位管理基本功能
4. ✅ 简历上传和手动关联
5. ✅ 简单列表展示和搜索

**第二阶段 - 2周**:
1. ✅ AI 简历解析集成
2. ✅ AI 智能筛选和打分
3. ✅ 候选人-职位关联和评分展示
4. ✅ 优化 UI/UX

**第三阶段 - 1周**:
1. ✅ 面试评价功能
2. ✅ 状态流转管理
3. ✅ 测试和部署

---

## 9. 部署与配置

### 9.1 Supabase 项目初始化

1. **创建 Supabase 项目**
   - 访问 https://supabase.com
   - 创建新项目
   - 记录项目 URL 和 API Keys

2. **数据库初始化**
   ```sql
   -- 在 Supabase SQL Editor 中执行
   -- 复制上面的数据库表结构 SQL
   ```

3. **存储桶创建**
   ```sql
   -- 创建简历存储桶
   INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true);
   ```

4. **Row Level Security 设置**（第一阶段可关闭）
   ```sql
   -- 暂时关闭 RLS，便于开发测试
   ALTER TABLE candidates DISABLE ROW LEVEL SECURITY;
   ALTER TABLE positions DISABLE ROW LEVEL SECURITY;
   ALTER TABLE position_candidates DISABLE ROW LEVEL SECURITY;
   ALTER TABLE interview_feedbacks DISABLE ROW LEVEL SECURITY;
   ```

### 9.2 本地开发环境

#### 9.2.1 后端启动
```bash
cd backend
# 安装依赖
pip install -e .

# 设置环境变量
cp .env.example .env
# 编辑 .env 文件，填入 Supabase 配置

# 启动开发服务器
uvicorn app.main:app --reload --port 8000
```

#### 9.2.2 前端启动
```bash
cd frontend
# 安装依赖
npm install

# 设置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件，填入 Supabase 配置

# 启动开发服务器
npm run dev
```

---

## 10. API 文档示例

### 10.1 Swagger/OpenAPI 集成

```python
# app/main.py
from fastapi import FastAPI
from fastapi.openapi.docs import get_swagger_ui_html

app = FastAPI(
    title="AI 人才筛选系统 API",
    description="基于 Supabase 的人才管理和智能筛选系统",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 自定义 API 文档
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - Swagger UI",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    )
```

### 10.2 API 响应示例

**GET /rest/v1/candidates**
```json
[
  {
    "id": 1,
    "name": "张三",
    "phone": "13812345678",
    "email": "zhangsan@example.com",
    "skills": ["Python", "React", "PostgreSQL"],
    "highlights": "5年全栈开发经验，具备大型项目架构能力",
    "score": 3,
    "resume_file": "https://oss-bucket.aliyuncs.com/resumes/zhangsan_resume.pdf",
    "resume_md5": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "is_deleted": false,
    "created_at": "2024-10-15T08:30:00Z",
    "updated_at": "2024-10-15T08:30:00Z"
  }
]
```

**POST /api/candidates/upload**
```json
{
  "candidate": {
    "id": 2,
    "name": "李四",
    "phone": "13998765432",
    "email": "lisi@example.com",
    "skills": ["Java", "Spring", "MySQL"],
    "highlights": "3年后端开发经验，熟悉微服务架构",
    "score": 3,
    "resume_md5": "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7"
  },
  "file_url": "https://oss-bucket.aliyuncs.com/resumes/lisi_resume.pdf"
}
```

---

## 11. 测试策略

### 11.1 单元测试示例

```python
# tests/test_candidate_service.py
import pytest
from app.services.candidate_service import CandidateService

@pytest.fixture
def candidate_service():
    # 使用测试用的 Supabase 实例
    return CandidateService(test_supabase_client)

def test_create_candidate(candidate_service):
    candidate_data = {
        "name": "测试用户",
        "email": "test@example.com",
        "phone": "13800000000",
        "skills": ["Python", "React"],
        "resume_file": "https://oss-bucket.aliyuncs.com/test_resume.pdf",
        "resume_md5": "test_md5_value"
    }

    result = candidate_service.create_candidate(candidate_data)

    assert result is not None
    assert result["name"] == "测试用户"
    assert "Python" in result["skills"]

def test_search_candidates(candidate_service):
    candidates = candidate_service.get_candidates(search="Python")
    
    assert len(candidates) > 0
    # 验证搜索结果包含 Python 技能
    for candidate in candidates:
        assert "Python" in candidate["skills"] or "python" in candidate["name"].lower()
```

### 11.2 集成测试

```python
# tests/test_api_integration.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_upload_resume():
    with open("test_files/sample_resume.pdf", "rb") as f:
        response = client.post(
            "/api/candidates/upload",
            files={"file": ("resume.pdf", f, "application/pdf")}
        )
    
    assert response.status_code == 200
    data = response.json()
    assert "candidate" in data
    assert "file_url" in data

def test_intelligent_screening():
    # 先创建职位
    position_data = {
        "title": "Python 开发工程师",
        "jd": "要求熟练掌握 Python 和 Django 框架",
        "requirements": {"skills": ["Python", "Django"]}
    }
    
    response = client.post("/rest/v1/positions", json=position_data)
    position_id = response.json()[0]["id"]
    
    # 执行智能筛选
    response = client.post(f"/api/positions/{position_id}/screening")
    
    assert response.status_code == 200
    data = response.json()
    assert "linked_candidates" in data
```

---

## 12. 风险控制与监控

### 12.1 技术风险缓解

**LLM API 稳定性**:
```python
import backoff
import logging

class ResilientAIService:
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
        self.logger = logging.getLogger(__name__)
    
    @backoff.on_exception(
        backoff.expo,
        (openai.RateLimitError, openai.APIConnectionError),
        max_tries=3,
        max_time=60
    )
    def parse_resume_with_retry(self, resume_text: str) -> dict:
        """带重试机制的简历解析"""
        try:
            return self.parse_resume(resume_text)
        except Exception as e:
            self.logger.error(f"AI 解析失败: {e}")
            # 返回默认结构，避免系统崩溃
            return {
                "name": "解析失败",
                "phone": None,
                "email": None,
                "skills": [],
                "highlights": "AI 解析失败，请手动编辑",
                "experience_years": 0
            }
```

**数据库连接处理**:
```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def get_supabase_client():
    """获取 Supabase 客户端的上下文管理器"""
    client = None
    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        yield client
    except Exception as e:
        logging.error(f"Supabase 连接错误: {e}")
        raise
    finally:
        # Supabase Python 客户端会自动处理连接清理
        pass
```

### 12.2 性能监控

```python
import time
from functools import wraps

def monitor_performance(func):
    """性能监控装饰器"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        
        duration = end_time - start_time
        logging.info(f"{func.__name__} 执行时间: {duration:.2f}s")
        
        # 如果执行时间过长，记录警告
        if duration > 5.0:
            logging.warning(f"{func.__name__} 执行时间过长: {duration:.2f}s")
        
        return result
    return wrapper

# 使用示例
@monitor_performance
def parse_resume(self, resume_text: str) -> dict:
    # 解析逻辑
    pass
```

---

## 13. 迭代计划

### Sprint 1 (2 周) - 基础架构
- [x] **Week 1**
  - [ ] Supabase 项目创建和配置
  - [ ] 数据库表结构设计和创建
  - [ ] Python 后端项目初始化（FastAPI + Supabase SDK）
  - [ ] 基础 CRUD 接口开发（候选人、职位）
  - [ ] 前端项目初始化（React + TypeScript + Supabase）

- [x] **Week 2**
  - [ ] 候选人列表页面开发
  - [ ] 职位列表页面开发
  - [ ] 基础搜索和筛选功能
  - [ ] 简历文件上传到 Supabase Storage
  - [ ] 候选人-职位手动关联功能

### Sprint 2 (2 周) - AI 集成
- [x] **Week 3**
  - [ ] AI 简历解析服务开发
  - [ ] 简历自动解析和候选人创建流程
  - [ ] AI 匹配评分算法实现
  - [ ] 智能筛选 API 开发

- [x] **Week 4**
  - [ ] 职位详情页面（含关联候选人）
  - [ ] 候选人详情页面
  - [ ] 打分和排序展示优化
  - [ ] 批量操作功能（批量上传、批量关联）

### Sprint 3 (1 周) - 完善功能
- [x] **Week 5**
  - [ ] 面试评价功能开发
  - [ ] 候选人状态管理
  - [ ] 面试时间线展示
  - [ ] 数据统计报表（简单版）
  - [ ] 测试和 Bug 修复

### Sprint 4 (1 周) - 部署上线
- [x] **Week 6**
  - [ ] 生产环境部署配置
  - [ ] 性能优化和监控
  - [ ] 用户体验优化
  - [ ] 文档完善
  - [ ] 系统上线和验收

---

## 14. 总结


### 14.1 技术亮点

- **零后端 API**：利用 Supabase PostgREST 自动生成的 RESTful API
- **实时能力**：预留了 Supabase Realtime 的集成空间
- **文件存储**：完整的简历文件上传和管理方案
- **AI 集成**：可靠的 AI 服务，包含错误处理和重试机制
- **测试覆盖**：完整的单元测试和集成测试策略

### 14.2 开发优势

- **快速启动**：利用 Supabase 的开箱即用特性，大大减少后端开发时间
- **扩展性强**：PostgreSQL + PostgREST 的组合，支持复杂查询和高并发
- **维护简单**：Supabase 托管服务减少了运维负担
- **成本可控**：按使用量计费，适合初期项目
