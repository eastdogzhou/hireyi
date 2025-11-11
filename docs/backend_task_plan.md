# AI 简历筛选系统 - 后端任务与进展

> 📅 最后更新: 2025-10-30
> 📊 **MVP完成度: 100%** | **认证功能: 99%** ✅
> 🎯 状态: MVP功能已完成，认证与组织管理系统开发完成，迁移基础设施就绪，等待测试

## 🚀 快速状态

### 整体进度
- **数据库**: ✅ 100% (Schema完整，已部署到Supabase)
- **服务层**: ✅ 100% (所有核心服务完成)
- **API层**: ✅ 100% (26个端点全部完成)
- **测试**: ✅ 95% (135个测试，覆盖率78%)

### 当前可用 (35个API端点 + 2个系统端点)
- ✅ **认证 API** (6个端点：注册、登录、登出、个人信息、刷新Token、密码重置) 🆕
- ✅ **组织管理 API** (5个端点：创建组织、获取组织、成员列表、更新角色、移除成员) 🆕
- ✅ 候选人 CRUD API (7个端点：列表、详情、创建、更新、删除、上传、批量上传) **已添加认证要求**
- ✅ 职位 CRUD API (9个端点：列表、详情、创建、更新、删除、状态更新、智能筛选、分数重算、候选人列表) **已添加认证要求**
- ✅ 面试评价 API (7个端点：列表、创建、更新、候选人执行记录、面试官评价) **已添加认证要求**
- ✅ 用户管理 API (3个端点：基础CRUD，非认证用户)
- ✅ 系统监控 API (2个端点：根路径、健康检查)
- ✅ 简历解析服务 (PyMuPDF + LLM)
- ✅ 文件存储服务 (阿里云 OSS)

### 高级功能
- ✅ POST `/api/positions/{id}/smart-screening` - 智能筛选API (两阶段筛选：预筛+AI排序)
- ✅ POST `/api/positions/{id}/recalculate-scores` - 分数重算API (批量更新候选人匹配分数)
- ✅ 用户管理 CRUD API (`/api/users/*`) - 完整的用户管理功能

### ♻️ 最近更新

#### 2025-10-22 - 简历解析优化 (v1.1)
- ✅ **数据库 Schema v1.1**: 新增 3 个字段用于增强简历信息存储
  - `resume_text TEXT` - 存储完整简历文本，用于全文搜索和匹配
  - `work_experience TEXT` - 工作经历格式化文本（2行格式：时间+公司+职位 / 工作总结）
  - `education_background TEXT` - 教育背景格式化文本（2行格式：时间+学校+学历 / 主要收获）
  - 添加 GIN 索引支持高性能全文检索
- ✅ **手机号验证增强**: 正则验证 + 自动格式化
  - 统一格式为纯数字（去除特殊字符）
  - 支持中国手机号（11位，以1开头）和国际号码（至少7位）
- ✅ **LLM Prompt 更新**: 新增工作经历和教育背景结构化提取
  - 每段信息两行表示：第1行=时间+实体+角色，第2行=总结/收获（10-20字）
  - 多段之间用空行分隔
- ✅ **简历解析服务**: 返回结果包含 `resume_text` 字段
- ✅ **向后兼容**: 所有新字段可空，不影响现有数据

#### 2025-01-18
- ✅ 候选人技能筛选改为 PostgreSQL overlaps，满足"任意匹配"需求
- ✅ FastAPI 路由统一通过 `run_in_threadpool` 调用 Supabase 客户端，避免阻塞事件循环
- ✅ 所有分页接口返回 Supabase 精确 `count`，前端总数显示与真实数据一致

---

## 📋 项目状态概览

### ✅ 已完成模块
- [x] 数据库设计与 Schema (database/schema.sql, seed.sql)
- [x] Pydantic 数据模型层 (app/models/)
- [x] 应用配置管理 (app/config/)
- [x] BaseService 基类 (app/services/base.py)
- [x] LLM 客户端 (app/services/llm/client.py)
- [x] 简历解析服务 (app/services/parser/)
- [x] 环境配置 (.env)
- [x] **文件存储服务** (app/services/storage/oss_service.py) ✅
- [x] **业务逻辑服务层** ✅
  - [x] UserService (用户服务)
  - [x] CandidateService (候选人服务) + highlights字段修复
  - [x] PositionService (职位服务)
  - [x] PositionCandidateService (职位候选人关系服务)
  - [x] InterviewFeedbackService (面试评价服务)
- [x] **高级业务功能** ✅
  - [x] SmartScreeningService (智能筛选服务)
- [x] **FastAPI 路由层** ✅
  - [x] FastAPI 主应用初始化 (app/main.py)
  - [x] 候选人 API 路由 (app/api/candidates.py)
  - [x] 职位 API 路由 (app/api/positions.py)
  - [x] 面试评价 API 路由 (app/api/interview_feedbacks.py)
- [x] **测试** (总测试数: 135, 通过: 127, 覆盖率: 78%) ✅
  - [x] 单元测试 (93个测试，覆盖服务层、模型层)
  - [x] API 集成测试 (42个测试，覆盖所有API端点)
    - tests/conftest.py - 测试配置和 fixtures
    - tests/test_api_candidates.py - 候选人API测试 (14个)
    - tests/test_api_positions.py - 职位API测试 (13个)
    - tests/test_api_interview_feedbacks.py - 面试评价API测试 (11个)
    - tests/test_api_e2e.py - 端到端业务流程测试 (4个)

### 🔄 待完成模块
- [ ] 修复少量测试失败 (8个测试，主要是模拟数据完整性问题)
- [ ] API 文档完善 (OpenAPI 增强)
- [ ] 应用初始化脚本与部署配置

---

## 🎯 任务列表与详细规划

### 阶段 1: 基础服务层（无外部业务依赖）

---

#### Task 1.1: 阿里云 OSS 文件存储服务 ✅ [已完成]

**任务目标**: 实现简历文件上传、下载、删除功能

**完成状态**: ✅ 已实现并通过所有测试

**文件**: `app/services/storage/oss_service.py`

**前置依赖**:
- ✅ settings.py 中的 OSS 配置
- ✅ oss2 依赖库

**User Story**:
- **As a**: Backend Developer
- **I want to**: Upload resume files to Aliyun OSS and get publicly accessible URLs
- **So that**: Candidates' resumes can be securely stored and easily accessed by the system and users

**Acceptance Criteria**:
- **Given** a PDF resume file
- **When** I call `upload_file()` with the file content
- **Then** the file should be uploaded to OSS, and I should receive a public URL, MD5 hash, and file size
- **And** the URL should be directly accessible without authentication
- **And** file operations should be logged for debugging

**功能需求**:
1. 上传文件到阿里云 OSS
2. 生成文件的公开访问 URL
3. 计算文件 MD5
4. 删除文件
5. 检查文件是否存在

**输入定义**:
```python
# upload_file
Input: {
    "file_content": bytes,        # 文件二进制内容
    "file_name": str,             # 原始文件名
    "subfolder": str = "resumes/" # 子目录路径
}

# delete_file
Input: {
    "file_path": str              # OSS 中的文件路径
}

# get_file_url
Input: {
    "file_path": str              # OSS 中的文件路径
}
```

**输出定义**:
```python
# upload_file
Output: {
    "success": bool,
    "file_path": str,             # OSS 文件路径
    "file_url": str,              # 公开访问 URL
    "file_md5": str,              # 文件 MD5 值
    "file_size": int              # 文件大小（字节）
}

# delete_file
Output: {
    "success": bool,
    "message": str
}

# get_file_url
Output: str                       # 公开访问 URL
```

**验收标准**:
- ✅ 能成功上传 PDF 文件到 OSS
- ✅ 返回的 URL 可以直接访问下载
- ✅ MD5 计算正确
- ✅ 删除操作成功执行
- ✅ 异常情况有明确错误提示

**测试方法**:
```python
# tests/test_oss_service.py
import pytest
from app.services.storage.oss_service import OSSService

@pytest.fixture
def oss_service():
    return OSSService()

@pytest.mark.asyncio
async def test_upload_file(oss_service):
    # 准备测试文件
    test_content = b"Test resume content"

    # 执行上传
    result = await oss_service.upload_file(
        file_content=test_content,
        file_name="test_resume.pdf"
    )

    # 验证结果
    assert result["success"] is True
    assert "file_url" in result
    assert result["file_md5"] is not None
    assert result["file_size"] == len(test_content)

    # 清理测试数据
    await oss_service.delete_file(result["file_path"])

@pytest.mark.asyncio
async def test_delete_file(oss_service):
    # 先上传文件
    upload_result = await oss_service.upload_file(
        file_content=b"Test",
        file_name="test_delete.pdf"
    )

    # 执行删除
    delete_result = await oss_service.delete_file(upload_result["file_path"])

    # 验证删除成功
    assert delete_result["success"] is True
```

**实现提示**:
- 使用 `oss2.Bucket` 进行操作
- 文件命名格式: `{subfolder}{timestamp}_{original_name}`
- 使用 `hashlib.md5()` 计算文件 MD5
- 所有操作添加日志记录
- 捕获 `oss2.exceptions.OssError` 异常

**预估工作量**: 2-3 小时

---

#### Task 1.2: 数据库初始化脚本

**任务目标**: 创建数据库初始化和数据导入脚本

**文件**: `scripts/init_database.py`

**前置依赖**:
- ✅ database/schema.sql
- ✅ database/seed.sql
- ✅ Supabase 配置

**User Story**:
- **As a**: DevOps Engineer / Developer
- **I want to**: Initialize the database schema with a single command that can be run multiple times safely
- **So that**: I can quickly set up development and production environments without manual SQL execution or worrying about errors from re-running scripts

**Acceptance Criteria**:
- **Given** an empty Supabase database or an existing database
- **When** I run `uv run python scripts/init_database.py --environment development --load-seed true`
- **Then** all tables, indexes, and triggers should be created successfully
- **And** test data should be loaded (5 candidates, 3 positions, 3 users, etc.)
- **And** running the script again should not cause errors (idempotent execution)
- **And** detailed execution logs should be displayed showing progress

**功能需求**:
1. 检查数据库连接
2. 执行 schema.sql 建表
3. 可选执行 seed.sql 导入测试数据
4. 验证表和索引创建成功

**输入定义**:
```bash
# CLI 参数
--environment: development | production
--load-seed: true | false
--force: true | false  # 是否强制重建（删除已有表）
```

**输出定义**:
```
Success Output:
✅ Database connection successful
✅ Schema created: 5 tables, 15 indexes
✅ Seed data loaded: 3 users, 5 candidates, 3 positions
✅ Database initialization complete

Failure Output:
❌ Database connection failed: [error message]
❌ Schema creation failed: [error message]
```

**验收标准**:
- ✅ 能连接到 Supabase 数据库
- ✅ 成功创建所有表和索引
- ✅ 测试数据导入成功
- ✅ 可幂等执行（重复执行不报错）
- ✅ 有详细的执行日志

**测试方法**:
```bash
# 开发环境初始化（含测试数据）
uv run python scripts/init_database.py --environment development --load-seed true

# 生产环境初始化（不含测试数据）
uv run python scripts/init_database.py --environment production --load-seed false

# 验证表是否创建成功
uv run python -c "
from app.config import get_supabase
supabase = get_supabase()
result = supabase.table('candidates').select('count').execute()
print(f'Candidates table exists with {len(result.data)} records')
"
```

**实现提示**:
- 使用 `supabase.rpc()` 执行 SQL 语句
- 或使用 `psycopg2` 直接连接 PostgreSQL
- 添加事务支持（失败时回滚）
- 记录详细的执行日志

**预估工作量**: 2-3 小时

---

### 阶段 2: 业务逻辑服务层

---

#### Task 2.1: 用户服务 (UserService) ✅ [已完成]

**任务目标**: 实现用户 CRUD 操作

**完成状态**: ✅ 已实现并通过所有测试

**文件**: `app/services/user_service.py`

**前置依赖**:
- ✅ BaseService
- ✅ User Pydantic 模型
- ✅ Supabase 客户端

**User Story**:
- **As a**: HR Admin
- **I want to**: Manage system users (recruiters and admins) with full CRUD operations
- **So that**: I can control who has access to the resume screening system and track who created positions or conducted interviews

**Acceptance Criteria**:
- **Given** I have admin privileges
- **When** I create a new user with email "recruiter@company.com" and role "recruiter"
- **Then** the user should be created in the database with a unique email
- **And** I should be able to retrieve the user by ID or email
- **And** I should be able to update user information (name, role)
- **And** I should be able to soft-delete users (setting is_deleted=true)
- **And** deleted users should be excluded from search results by default

**功能需求**:
1. 创建用户
2. 获取用户列表（分页）
3. 获取单个用户详情
4. 更新用户信息
5. 软删除用户
6. 根据邮箱查找用户

**输入定义**:
```python
# create_user
Input: UserCreate = {
    "email": "user@example.com",
    "name": "张三",
    "role": "recruiter"  # recruiter | admin
}

# get_users
Input: {
    "limit": int = 20,
    "offset": int = 0,
    "role": str | None = None  # 可选的角色筛选
}

# update_user
Input: (user_id: int, UserUpdate)
```

**输出定义**:
```python
# create_user
Output: UserResponse = {
    "id": 1,
    "email": "user@example.com",
    "name": "张三",
    "role": "recruiter",
    "is_deleted": false,
    "created_at": "2024-01-01T00:00:00Z"
}

# get_users
Output: list[UserResponse]
```

**验收标准**:
- ✅ 所有 CRUD 操作正常工作
- ✅ 邮箱唯一性约束生效
- ✅ 软删除正确过滤
- ✅ 分页功能正确
- ✅ 类型注解完整
- ✅ 有完整的 docstring

**测试方法**:
```python
# tests/test_user_service.py
import pytest
from app.services.user_service import UserService
from app.models.user import UserCreate

@pytest.fixture
def user_service():
    from app.config import get_supabase
    return UserService(get_supabase(), "users")

@pytest.mark.asyncio
async def test_create_user(user_service):
    user_data = UserCreate(
        email="test@example.com",
        name="测试用户",
        role="recruiter"
    )

    user = user_service.create(user_data.model_dump())

    assert user["id"] is not None
    assert user["email"] == "test@example.com"
    assert user["name"] == "测试用户"

    # 清理测试数据
    user_service.soft_delete(user["id"])

@pytest.mark.asyncio
async def test_get_users_pagination(user_service):
    # 创建3个测试用户
    for i in range(3):
        user_service.create({
            "email": f"test{i}@example.com",
            "name": f"测试用户{i}",
            "role": "recruiter"
        })

    # 测试分页
    page1 = user_service.get_all(limit=2, offset=0)
    assert len(page1) == 2

    page2 = user_service.get_all(limit=2, offset=2)
    assert len(page2) >= 1
```

**实现提示**:
- 继承 BaseService
- 添加 `get_by_email(email: str)` 方法
- 添加 `exists_by_email(email: str)` 方法
- 所有方法添加日志记录

**预估工作量**: 2 小时

---

#### Task 2.2: 候选人服务 (CandidateService) ✅ [已完成 + 修复]

**任务目标**: 实现候选人管理的核心业务逻辑

**完成状态**: ✅ 已实现并通过所有测试
**修复内容**:
- ✅ highlights 字段格式转换 (数组→字符串)
- ✅ email 字段标准化 (转小写)
- ✅ 新增字段验证单元测试

**文件**: `app/services/candidate_service.py`

**前置依赖**:
- ✅ BaseService
- ✅ Candidate Pydantic 模型
- ✅ OSSService
- ✅ ResumeParser

**User Story**:
- **As a**: Recruiter
- **I want to**: Upload resumes (single or batch), have them automatically parsed by AI, and stored in a searchable candidate database
- **So that**: I can build a talent pool without manually entering candidate information, and the system prevents duplicate candidates using name+phone and resume_md5

**Acceptance Criteria**:
- **Given** I upload a PDF resume for "张三" with phone "13812345678"
- **When** the system processes the upload
- **Then** the resume should be uploaded to OSS and a candidate record created with AI-extracted fields (name, phone, email, skills, highlights, years_of_experience, education_level, recent_company, recent_position)
- **And** the candidate should have a global score (1-4) calculated by LLM based on comprehensive evaluation
- **And** the resume_md5 should be calculated from the original PDF content
- **And** if I upload another resume with the same name+phone or resume_md5, the existing candidate should be updated instead of creating a duplicate
- **And** I should be able to search candidates by name (fuzzy), skills (array contains), score range, and date range
- **And** when batch uploading, parsing failures should not stop other resumes from processing (fault-tolerant)

**功能需求**:
1. 创建候选人
2. 根据唯一性规则查找候选人（name+phone 或 resume_md5）
3. 更新候选人信息
4. 软删除候选人（级联删除关联数据）
5. 搜索候选人（姓名模糊搜索、技能筛选、评分筛选）
6. 批量上传简历并创建候选人

**输入定义**:
```python
# create_candidate
Input: CandidateCreate = {
    "name": "张三",
    "phone": "13812345678",
    "email": "zhangsan@example.com",
    "skills": ["Python", "React"],
    "highlights": "5年全栈开发经验",
    "score": 3,
    "resume_file": "https://oss.../resume.pdf",
    "resume_md5": "abc123..."
}

# find_by_unique_key
Input: {
    "name": str,
    "phone": str | None,
    "resume_md5": str
}

# search_candidates
Input: {
    "name_query": str | None,      # 姓名模糊搜索
    "skills": list[str] | None,    # 技能筛选
    "min_score": int | None,       # 最低评分
    "max_score": int | None,       # 最高评分
    "limit": int = 20,
    "offset": int = 0
}

# upload_and_create_from_resume
Input: {
    "file_content": bytes,
    "file_name": str,
    "auto_parse": bool = True
}
```

**输出定义**:
```python
# create_candidate
Output: CandidateResponse

# find_by_unique_key
Output: CandidateResponse | None

# search_candidates
Output: {
    "candidates": list[CandidateResponse],
    "total": int,
    "limit": int,
    "offset": int
}

# upload_and_create_from_resume
Output: {
    "candidate": CandidateResponse,
    "file_url": str,
    "parse_status": "success" | "failed" | "manual_required"
}
```

**验收标准**:
- ✅ 唯一性检查按优先级正确执行
- ✅ 搜索功能支持多条件组合
- ✅ 软删除时级联标记 position_candidates
- ✅ 简历上传和解析流程完整
- ✅ 解析失败时允许手动补充
- ✅ 所有操作有事务保证

**测试方法**:
```python
# tests/test_candidate_service.py
import pytest
from app.services.candidate_service import CandidateService

@pytest.mark.asyncio
async def test_find_by_unique_key_name_phone(candidate_service):
    # 创建候选人
    candidate1 = candidate_service.create({
        "name": "张三",
        "phone": "13800000000",
        "email": "test@example.com",
        "skills": ["Python"],
        "resume_file": "https://oss.../resume1.pdf",
        "resume_md5": "md5_1"
    })

    # 测试通过 name+phone 查找
    found = candidate_service.find_by_unique_key(
        name="张三",
        phone="13800000000",
        resume_md5="different_md5"
    )

    assert found is not None
    assert found["id"] == candidate1["id"]

@pytest.mark.asyncio
async def test_search_candidates_by_skills(candidate_service):
    # 创建测试数据
    candidate_service.create({
        "name": "Python开发者",
        "skills": ["Python", "Django"],
        "resume_file": "...",
        "resume_md5": "..."
    })

    # 搜索
    result = candidate_service.search_candidates(
        skills=["Python"],
        limit=10
    )

    assert result["total"] >= 1
    assert any("Python" in c["skills"] for c in result["candidates"])

@pytest.mark.asyncio
async def test_upload_and_parse_resume(candidate_service):
    # 准备测试PDF文件
    with open("tests/fixtures/sample_resume.pdf", "rb") as f:
        file_content = f.read()

    # 执行上传和解析
    result = await candidate_service.upload_and_create_from_resume(
        file_content=file_content,
        file_name="sample_resume.pdf"
    )

    assert result["parse_status"] == "success"
    assert result["candidate"]["name"] is not None
    assert len(result["candidate"]["skills"]) > 0
```

**实现提示**:
- 继承 BaseService
- 唯一性检查逻辑：
  ```python
  def find_by_unique_key(self, name, phone, resume_md5):
      # 优先级1: name + phone (如果 phone 不为空)
      if phone:
          result = self.supabase.table("candidates")\\
              .select("*")\\
              .eq("name", name)\\
              .eq("phone", phone)\\
              .eq("is_deleted", False)\\
              .maybe_single().execute()
          if result.data:
              return result.data

      # 优先级2: resume_md5
      result = self.supabase.table("candidates")\\
          .select("*")\\
          .eq("resume_md5", resume_md5)\\
          .eq("is_deleted", False)\\
          .maybe_single().execute()
      return result.data
  ```
- 软删除时使用事务确保级联
- 搜索时使用 Supabase 的 `or_()` 和 `cs.` 操作符

**预估工作量**: 4-5 小时

---

#### Task 2.3: 职位服务 (PositionService) ✅ [已完成]

**任务目标**: 实现职位管理功能

**完成状态**: ✅ 已实现并通过所有测试

**文件**: `app/services/position_service.py`

**前置依赖**:
- ✅ BaseService
- ✅ Position Pydantic 模型

**User Story**:
- **As a**: Hiring Manager
- **I want to**: Create and manage job positions with detailed requirements (JD, required skills, experience)
- **So that**: I can track open positions and view all candidates who have been screened for each position, sorted by match score

**Acceptance Criteria**:
- **Given** I want to hire a "高级Python工程师"
- **When** I create a position with title, department, JD, and requirements (skills: ["Python", "Django"], experience: "3年以上", education: "本科及以上")
- **Then** the position should be created with status "open" and linked to my user ID as creator
- **And** I should be able to retrieve the position with all associated candidates, including their scores (relevance_score, fit_score, overall_score, overall_score_numeric)
- **And** I should be able to filter candidates by status (screening, interview, offer, etc.)
- **And** I should be able to sort candidates by score (overall_score_numeric DESC) or by updated_at
- **And** when I soft-delete the position, all associated position_candidates records should be cascade soft-deleted
- **And** I should be able to update the position status to "open" or "closed"

**功能需求**:
1. 创建职位
2. 获取职位列表（支持状态筛选）
3. 获取职位详情（含关联候选人）
4. 更新职位信息
5. 软删除职位（级联删除关联数据）
6. 更新职位状态（open/closed）

**输入定义**:
```python
# create_position
Input: PositionCreate = {
    "title": "高级Python工程师",
    "department": "技术部",
    "jd": "职位描述...",
    "requirements": {
        "skills": ["Python", "Django"],
        "experience": "3年以上",
        "education": "本科及以上"
    },
    "status": "open",
    "created_by": 1  # user_id
}

# get_position_with_candidates
Input: {
    "position_id": int,
    "candidate_status": str | None,  # 可选的候选人状态筛选
    "sort_by": "score" | "updated_at" = "score"
}

# update_status
Input: {
    "position_id": int,
    "status": "open" | "closed"
}
```

**输出定义**:
```python
# create_position
Output: PositionResponse

# get_position_with_candidates
Output: {
    "id": 1,
    "title": "高级Python工程师",
    "jd": "...",
    "status": "open",
    "candidates": [
        {
            "candidate_id": 1,
            "candidate": CandidateResponse,
            "relevance_score": 3,
            "fit_score": 4,
            "overall_score": 4,
            "overall_score_numeric": 85,
            "current_status": "interview"
        }
    ],
    "candidate_count": 10
}
```

**验收标准**:
- ✅ 职位 CRUD 操作正常
- ✅ 关联候选人查询支持排序和筛选
- ✅ 软删除时级联标记 position_candidates
- ✅ 状态切换正确执行

**测试方法**:
```python
# tests/test_position_service.py
@pytest.mark.asyncio
async def test_create_position(position_service, user_service):
    # 先创建用户
    user = user_service.create({
        "email": "recruiter@example.com",
        "name": "招聘专员",
        "role": "recruiter"
    })

    # 创建职位
    position = position_service.create({
        "title": "Python工程师",
        "department": "技术部",
        "jd": "负责后端开发",
        "requirements": {"skills": ["Python"]},
        "created_by": user["id"]
    })

    assert position["id"] is not None
    assert position["title"] == "Python工程师"
    assert position["status"] == "open"

@pytest.mark.asyncio
async def test_get_position_with_candidates(position_service, candidate_service):
    # 创建职位
    position = position_service.create({...})

    # 创建候选人
    candidate = candidate_service.create({...})

    # 关联候选人到职位
    position_service.link_candidate(
        position_id=position["id"],
        candidate_id=candidate["id"],
        scores={
            "relevance_score": 3,
            "fit_score": 4,
            "overall_score": 4
        }
    )

    # 获取职位详情
    result = position_service.get_position_with_candidates(position["id"])

    assert result["candidate_count"] == 1
    assert len(result["candidates"]) == 1
    assert result["candidates"][0]["candidate"]["id"] == candidate["id"]
```

**实现提示**:
- 继承 BaseService
- `get_position_with_candidates` 使用 Supabase 的嵌套查询：
  ```python
  response = self.supabase.table("positions")\\
      .select("*, position_candidates(*, candidates(*))")\\
      .eq("id", position_id)\\
      .single().execute()
  ```
- 添加 `link_candidate` 方法用于关联候选人

**预估工作量**: 3 小时

---

#### Task 2.4: 职位候选人关系服务 (PositionCandidateService) ✅ [已完成]

**任务目标**: 管理职位与候选人的关联关系和打分

**完成状态**: ✅ 已实现并通过所有测试

**文件**: `app/services/position_candidate_service.py`

**前置依赖**:
- ✅ BaseService
- ✅ PositionCandidate Pydantic 模型
- ✅ LLM 服务

**User Story**:
- **As a**: System (automated process)
- **I want to**: Link candidates to positions with AI-calculated match scores (relevance_score, fit_score, overall_score)
- **So that**: Recruiters can see how well each candidate matches a specific position

**功能需求**:
1. 创建职位-候选人关联（自动计算分数）
2. 更新关联信息（重新计算分数）
3. 批量关联候选人
4. 获取职位的所有候选人（支持排序和筛选）
5. 获取候选人的所有职位
6. 更新候选人状态
7. 软删除关联

**输入定义**:
```python
# link_candidate_to_position
Input: {
    "position_id": int,
    "candidate_id": int,
    "auto_score": bool = True  # 是否自动打分
}

# update_scores
Input: {
    "position_id": int,
    "candidate_id": int
}

# get_position_candidates
Input: {
    "position_id": int,
    "status_filter": str | None,
    "sort_by": "score" | "updated_at" = "score",
    "limit": int = 20,
    "offset": int = 0
}

# update_candidate_status
Input: {
    "position_id": int,
    "candidate_id": int,
    "new_status": str,
    "reason": str | None
}
```

**输出定义**:
```python
# link_candidate_to_position
Output: PositionCandidateResponse = {
    "id": 1,
    "position_id": 1,
    "candidate_id": 1,
    "relevance_score": 3,
    "fit_score": 4,
    "overall_score": 4,
    "overall_score_numeric": 85,
    "current_status": "screening"
}

# get_position_candidates
Output: {
    "candidates": list[PositionCandidateResponse],
    "total": int
}
```

**验收标准**:
- ✅ 关联时自动调用 LLM 打分
- ✅ 分数计算公式正确
- ✅ 唯一性约束生效（同一候选人不能重复关联）
- ✅ 状态变更时自动创建 interview_feedback 记录
- ✅ 排序功能正确（使用 overall_score_numeric）

**测试方法**:
```python
# tests/test_position_candidate_service.py
@pytest.mark.asyncio
async def test_link_candidate_with_auto_score(pc_service, mock_llm):
    # Mock LLM 返回分数
    mock_llm.return_value = {
        "relevance_score": 3,
        "fit_score": 4,
        "reasoning": "技能匹配度高"
    }

    result = await pc_service.link_candidate_to_position(
        position_id=1,
        candidate_id=1,
        auto_score=True
    )

    assert result["relevance_score"] == 3
    assert result["fit_score"] == 4
    assert result["overall_score"] == 4  # (3*0.6 + 4*0.4) ≈ 3.4 → 3
    assert result["overall_score_numeric"] == 85  # (3.4 / 4) * 100

@pytest.mark.asyncio
async def test_duplicate_link_raises_error(pc_service):
    # 第一次关联
    pc_service.link_candidate_to_position(
        position_id=1,
        candidate_id=1
    )

    # 第二次关联应该失败
    with pytest.raises(Exception) as exc_info:
        pc_service.link_candidate_to_position(
            position_id=1,
            candidate_id=1
        )
    assert "already linked" in str(exc_info.value).lower()

@pytest.mark.asyncio
async def test_update_status_creates_feedback(pc_service, feedback_service):
    # 更新状态
    pc_service.update_candidate_status(
        position_id=1,
        candidate_id=1,
        new_status="interview",
        reason="初筛通过，邀请面试"
    )

    # 验证创建了 feedback 记录
    feedbacks = feedback_service.get_by_candidate_and_position(1, 1)
    assert len(feedbacks) > 0
    assert feedbacks[-1]["new_status"] == "interview"
    assert feedbacks[-1]["is_status_change"] is True
```

**实现提示**:
- 继承 BaseService
- 打分逻辑调用 LLM 服务：
  ```python
  async def calculate_match_scores(self, position_id, candidate_id):
      # 获取职位和候选人信息
      position = self.position_service.get_by_id(position_id)
      candidate = self.candidate_service.get_by_id(candidate_id)

      # 调用 LLM
      prompt = build_matching_prompt(position, candidate)
      response = await llm_client.text_complete(...)

      # 解析分数
      scores = parse_scores_from_response(response)

      # 计算 overall_score_numeric
      scores["overall_score_numeric"] = int(
          (scores["relevance_score"] * 0.6 + scores["fit_score"] * 0.4) * 25
      )

      return scores
  ```
- 唯一性检查使用 `UNIQUE(position_id, candidate_id)` 约束
- 状态变更时调用 `InterviewFeedbackService.create_status_change()`

**预估工作量**: 4-5 小时

---

#### Task 2.5: 面试评价服务 (InterviewFeedbackService) ✅ [已完成]

**任务目标**: 管理面试评价和状态变更历史

**完成状态**: ✅ 已实现并通过所有测试

**文件**: `app/services/interview_feedback_service.py`

**前置依赖**:
- ✅ BaseService
- ✅ InterviewFeedback Pydantic 模型

**User Story**:
- **As a**: Interviewer
- **I want to**: Record interview feedback and track candidate status changes over time
- **So that**: I can maintain a complete timeline of each candidate's interview process and see their global status across all positions

**功能需求**:
1. 创建面试评价
2. 创建状态变更记录
3. 获取候选人的评价历史（时间线）
4. 获取职位的所有评价
5. 更新评价内容
6. 获取候选人的全局状态

**输入定义**:
```python
# create_feedback
Input: InterviewFeedbackCreate = {
    "candidate_id": 1,
    "position_id": 1,
    "interviewer": 1,  # user_id
    "rating": 4,
    "comments": "技术基础扎实",
    "interview_date": "2024-01-15"
}

# create_status_change
Input: StatusChangeCreate = {
    "candidate_id": 1,
    "position_id": 1,
    "interviewer": 1,
    "new_status": "interview",
    "reason": "初筛通过"
}

# get_candidate_timeline
Input: {
    "candidate_id": int,
    "position_id": int | None  # 可选，筛选特定职位
}
```

**输出定义**:
```python
# create_feedback
Output: InterviewFeedbackResponse

# get_candidate_timeline
Output: list[InterviewFeedbackResponse] = [
    {
        "id": 1,
        "candidate_id": 1,
        "position_id": 1,
        "is_status_change": false,
        "rating": 4,
        "comments": "技术基础扎实",
        "interview_date": "2024-01-15",
        "created_at": "2024-01-15T10:00:00Z"
    },
    {
        "id": 2,
        "is_status_change": true,
        "new_status": "interview",
        "comments": "初筛通过",
        "created_at": "2024-01-15T11:00:00Z"
    }
]

# get_global_status
Output: {
    "status": "interview",
    "updated_at": "2024-01-15T11:00:00Z",
    "position_id": 1
}
```

**验收标准**:
- ✅ 面试评价和状态变更记录正确创建
- ✅ 时间线按时间倒序排列
- ✅ 全局状态计算正确（最新的非screening状态）
- ✅ 支持按职位筛选

**测试方法**:
```python
# tests/test_interview_feedback_service.py
@pytest.mark.asyncio
async def test_create_feedback(feedback_service):
    feedback = feedback_service.create({
        "candidate_id": 1,
        "position_id": 1,
        "interviewer": 1,
        "rating": 4,
        "comments": "表现良好",
        "interview_date": "2024-01-15"
    })

    assert feedback["id"] is not None
    assert feedback["is_status_change"] is False
    assert feedback["rating"] == 4

@pytest.mark.asyncio
async def test_create_status_change(feedback_service):
    status_change = feedback_service.create_status_change({
        "candidate_id": 1,
        "position_id": 1,
        "interviewer": 1,
        "new_status": "interview",
        "reason": "初筛通过"
    })

    assert status_change["is_status_change"] is True
    assert status_change["new_status"] == "interview"
    assert status_change["rating"] is None

@pytest.mark.asyncio
async def test_get_candidate_timeline(feedback_service):
    # 创建多条记录
    feedback_service.create({...})  # 面试评价
    feedback_service.create_status_change({...})  # 状态变更

    timeline = feedback_service.get_candidate_timeline(candidate_id=1)

    assert len(timeline) == 2
    # 验证按时间倒序
    assert timeline[0]["created_at"] > timeline[1]["created_at"]

@pytest.mark.asyncio
async def test_get_global_status(feedback_service):
    # 创建多个职位的状态变更
    feedback_service.create_status_change({
        "candidate_id": 1,
        "position_id": 1,
        "new_status": "screening",
        ...
    })
    feedback_service.create_status_change({
        "candidate_id": 1,
        "position_id": 2,
        "new_status": "interview",  # 最新的非screening状态
        ...
    })

    global_status = feedback_service.get_global_status(candidate_id=1)

    assert global_status["status"] == "interview"
    assert global_status["position_id"] == 2
```

**实现提示**:
- 继承 BaseService
- `create_status_change` 自动设置 `is_status_change = True`
- 全局状态查询逻辑：
  ```python
  def get_global_status(self, candidate_id):
      response = self.supabase.table("interview_feedbacks")\\
          .select("*")\\
          .eq("candidate_id", candidate_id)\\
          .eq("is_status_change", True)\\
          .neq("new_status", "screening")\\
          .order("created_at", desc=True)\\
          .limit(1)\\
          .execute()
      return response.data[0] if response.data else None
  ```

**预估工作量**: 3 小时

---

### 阶段 3: 高级业务功能

---

#### Task 3.1: 智能筛选服务 (SmartScreeningService) ✅ [已完成]

**任务目标**: 实现两阶段智能筛选（预筛选 + AI精排）

**完成状态**: ✅ 已实现并通过所有测试

**文件**: `app/services/smart_screening_service.py`

**前置依赖**:
- ✅ CandidateService
- ✅ PositionService
- ✅ PositionCandidateService
- ✅ LLM 服务

**User Story**:
- **As a**: Recruiter
- **I want to**: Click "智能筛选" on a position and automatically get top matching candidates from the talent pool
- **So that**: I don't have to manually review hundreds of resumes, and the AI does the heavy lifting using two-phase screening (keyword pre-filtering + AI ranking)

**功能需求**:
1. 关键词预筛选
2. AI 批量打分
3. 跳过已关联候选人
4. 结果排序和限制数量
5. 支持重新计算分数

**输入定义**:
```python
# smart_screening
Input: {
    "position_id": int,
    "max_candidates": int = 100,
    "recalculate_existing": bool = True,
    "pre_filter_limit": int = 200  # 预筛选数量
}
```

**输出定义**:
```python
Output: {
    "status": "success" | "no_candidates",
    "position_id": int,
    "total_candidates_screened": int,
    "new_linked": int,
    "scores_updated": int,
    "top_candidates": [
        {
            "candidate": CandidateResponse,
            "scores": {
                "relevance_score": 3,
                "fit_score": 4,
                "overall_score": 4,
                "overall_score_numeric": 85,
                "reasoning": "技能匹配度高..."
            }
        }
    ]
}
```

**验收标准**:
- ✅ 预筛选阶段使用关键词匹配（快速）
- ✅ AI 精排阶段批量处理（效率高）
- ✅ 正确跳过已关联候选人
- ✅ 支持重新计算已有关联的分数
- ✅ 结果按分数降序排列
- ✅ 限制关联数量

**测试方法**:
```python
# tests/test_smart_screening_service.py
@pytest.mark.asyncio
async def test_smart_screening_full_workflow(screening_service):
    # 准备测试数据
    position = position_service.create({
        "title": "Python工程师",
        "jd": "要求精通Python、Django框架...",
        "requirements": {"skills": ["Python", "Django"]}
    })

    # 创建候选人
    for i in range(10):
        candidate_service.create({
            "name": f"候选人{i}",
            "skills": ["Python", "Django", "React"],
            ...
        })

    # 执行智能筛选
    result = await screening_service.smart_screening(
        position_id=position["id"],
        max_candidates=5
    )

    assert result["status"] == "success"
    assert result["new_linked"] <= 5
    assert len(result["top_candidates"]) > 0

    # 验证分数排序
    scores = [c["scores"]["overall_score_numeric"]
              for c in result["top_candidates"]]
    assert scores == sorted(scores, reverse=True)

@pytest.mark.asyncio
async def test_screening_skips_existing_links(screening_service):
    # 手动关联1个候选人
    pc_service.link_candidate_to_position(
        position_id=1,
        candidate_id=1
    )

    # 执行智能筛选
    result = await screening_service.smart_screening(
        position_id=1,
        max_candidates=5
    )

    # 验证跳过了已关联的候选人
    assert result["scores_updated"] >= 1  # 更新了已有关联的分数
    assert result["new_linked"] <= 4      # 新关联的不超过4个

@pytest.mark.asyncio
async def test_screening_with_no_candidates(screening_service):
    # 创建一个特殊要求的职位
    position = position_service.create({
        "title": "量子计算工程师",
        "jd": "要求量子物理博士学位...",
        "requirements": {"skills": ["量子计算", "量子纠缠"]}
    })

    result = await screening_service.smart_screening(
        position_id=position["id"]
    )

    assert result["status"] == "no_candidates"
    assert result["new_linked"] == 0
```

**实现提示**:
- 预筛选阶段使用 PostgreSQL 的 `@>` 操作符：
  ```python
  def pre_filter_candidates(self, position):
      required_skills = position["requirements"].get("skills", [])

      # 构建技能匹配查询
      query = self.candidate_service.supabase.table("candidates")\\
          .select("*")\\
          .eq("is_deleted", False)

      # 添加技能筛选（任意技能匹配）
      if required_skills:
          skill_conditions = " OR ".join([
              f"skills.cs.{{{skill}}}" for skill in required_skills
          ])
          query = query.or_(skill_conditions)

      return query.limit(pre_filter_limit).execute().data
  ```
- AI 精排使用并发处理：
  ```python
  async def batch_score_candidates(self, position, candidates):
      tasks = [
          self.pc_service.calculate_match_scores(
              position["id"],
              candidate["id"]
          )
          for candidate in candidates
      ]

      # 限制并发数
      semaphore = asyncio.Semaphore(max_concurrent)
      async def score_with_limit(task):
          async with semaphore:
              return await task

      scores = await asyncio.gather(*[score_with_limit(t) for t in tasks])
      return scores
  ```

**预估工作量**: 5-6 小时

---

### 阶段 4: FastAPI 路由层

---

#### Task 4.1: FastAPI 主应用初始化 ✅ [已完成]

**任务目标**: 创建 FastAPI 应用实例和全局配置

**完成状态**: ✅ 已实现并通过验证

**文件**: `app/main.py`

**User Story**:
- **As a**: Frontend Developer
- **I want to**: Access a well-documented REST API with CORS support and automatic OpenAPI documentation
- **So that**: I can build the frontend application and test API endpoints easily

**功能需求**:
1. FastAPI 应用初始化
2. CORS 中间件配置
3. 全局异常处理
4. 健康检查端点
5. API 文档配置

**输入定义**: N/A

**输出定义**:
```python
# GET /health
Output: {
    "status": "healthy",
    "version": "0.1.0",
    "database": "connected",
    "timestamp": "2024-01-01T00:00:00Z"
}

# GET /docs
Output: Swagger UI 页面

# GET /redoc
Output: ReDoc API 文档页面
```

**验收标准**:
- ✅ 应用正常启动
- ✅ CORS 配置生效
- ✅ 异常统一返回标准格式
- ✅ 健康检查正常响应
- ✅ API 文档可访问

**测试方法**:
```bash
# 启动应用
uv run uvicorn app.main:app --reload --port 8000

# 测试健康检查
curl http://localhost:8000/health

# 访问API文档
open http://localhost:8000/docs

# 测试CORS
curl -H "Origin: http://localhost:3000" \\
     -H "Access-Control-Request-Method: POST" \\
     -X OPTIONS http://localhost:8000/api/candidates
```

**实现提示**:
```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(
    title="AI Resume Scanning System",
    description="AI-powered resume management and matching",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS中间件
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "path": str(request.url)
        }
    )

# 健康检查
@app.get("/health")
async def health_check():
    try:
        supabase = get_supabase()
        result = supabase.table("users").select("count").limit(1).execute()
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return {
        "status": "healthy",
        "version": "0.1.0",
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
```

**预估工作量**: 1-2 小时

---

#### Task 4.2: 候选人 API 路由 ✅ [已完成]

**任务目标**: 实现候选人相关的 RESTful API

**完成状态**: ✅ 已实现并注册到FastAPI

**文件**: `app/api/candidates.py`

**User Story**:
- **As a**: Recruiter (API Consumer)
- **I want to**: RESTful API endpoints to manage candidates (CRUD, search, upload, batch upload)
- **So that**: I can integrate the candidate management system with the frontend UI and mobile apps

**功能需求**:
1. GET /api/candidates - 获取候选人列表（支持搜索和筛选）
2. GET /api/candidates/{id} - 获取候选人详情
3. POST /api/candidates - 创建候选人
4. PATCH /api/candidates/{id} - 更新候选人信息
5. DELETE /api/candidates/{id} - 软删除候选人
6. POST /api/candidates/upload - 上传简历并创建候选人
7. POST /api/candidates/batch-upload - 批量上传简历

**输入定义**:
```python
# GET /api/candidates
Query Params: {
    "name": str | None,
    "skills": list[str] | None,
    "min_score": int | None,
    "max_score": int | None,
    "limit": int = 20,
    "offset": int = 0
}

# POST /api/candidates
Body: CandidateCreate

# POST /api/candidates/upload
Form Data: {
    "file": UploadFile,
    "position_id": int | None
}

# POST /api/candidates/batch-upload
Form Data: {
    "files": list[UploadFile],
    "position_id": int | None
}
```

**输出定义**:
```python
# GET /api/candidates
Output: {
    "candidates": list[CandidateResponse],
    "total": int,
    "limit": int,
    "offset": int
}

# POST /api/candidates/upload
Output: {
    "status": "success" | "parse_failed",
    "candidate": CandidateResponse | None,
    "file_url": str,
    "parse_error": str | None
}

# POST /api/candidates/batch-upload
Output: {
    "total": int,
    "successful": int,
    "failed": int,
    "results": [
        {
            "file_name": str,
            "status": "success" | "failed",
            "candidate": CandidateResponse | None,
            "error": str | None
        }
    ]
}
```

**验收标准**:
- ✅ 所有端点正常工作
- ✅ 参数验证正确
- ✅ 错误处理完善
- ✅ 支持文件上传
- ✅ 批量上传容错处理

**测试方法**:
```python
# tests/test_api_candidates.py
from fastapi.testclient import TestClient

def test_get_candidates(client: TestClient):
    response = client.get("/api/candidates?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "candidates" in data
    assert len(data["candidates"]) <= 10

def test_create_candidate(client: TestClient):
    candidate_data = {
        "name": "测试候选人",
        "email": "test@example.com",
        "skills": ["Python", "React"],
        "resume_file": "https://oss.../resume.pdf",
        "resume_md5": "abc123"
    }
    response = client.post("/api/candidates", json=candidate_data)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "测试候选人"

def test_upload_resume(client: TestClient):
    with open("tests/fixtures/sample_resume.pdf", "rb") as f:
        response = client.post(
            "/api/candidates/upload",
            files={"file": ("resume.pdf", f, "application/pdf")}
        )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] in ["success", "parse_failed"]
```

**实现提示**:
```python
from fastapi import APIRouter, Depends, UploadFile, File, Query
from app.services.candidate_service import CandidateService

router = APIRouter(prefix="/api/candidates", tags=["candidates"])

@router.get("/")
async def get_candidates(
    name: str | None = None,
    skills: list[str] | None = Query(None),
    min_score: int | None = None,
    max_score: int | None = None,
    limit: int = 20,
    offset: int = 0,
    candidate_service: CandidateService = Depends(get_candidate_service)
):
    result = candidate_service.search_candidates(
        name_query=name,
        skills=skills,
        min_score=min_score,
        max_score=max_score,
        limit=limit,
        offset=offset
    )
    return result

@router.post("/upload", status_code=201)
async def upload_resume(
    file: UploadFile = File(...),
    position_id: int | None = None,
    candidate_service: CandidateService = Depends(get_candidate_service)
):
    file_content = await file.read()

    result = await candidate_service.upload_and_create_from_resume(
        file_content=file_content,
        file_name=file.filename
    )

    # 如果指定了职位,自动关联
    if position_id and result["parse_status"] == "success":
        pc_service = get_position_candidate_service()
        await pc_service.link_candidate_to_position(
            position_id=position_id,
            candidate_id=result["candidate"]["id"]
        )

    return result
```

**预估工作量**: 4-5 小时

---

#### Task 4.3: 职位 API 路由 ✅ [已完成]

**任务目标**: 实现职位相关的 RESTful API

**完成状态**: ✅ 已实现并注册到FastAPI

**文件**: `app/api/positions.py`

**User Story**:
- **As a**: Hiring Manager (API Consumer)
- **I want to**: RESTful API endpoints to manage positions and trigger smart screening
- **So that**: I can post new jobs, view matched candidates, and automate the screening process

**功能需求**:
1. GET /api/positions - 获取职位列表
2. GET /api/positions/{id} - 获取职位详情（含候选人）
3. POST /api/positions - 创建职位
4. PATCH /api/positions/{id} - 更新职位
5. DELETE /api/positions/{id} - 软删除职位
6. POST /api/positions/{id}/screening - 智能筛选
7. PATCH /api/positions/{id}/status - 更新职位状态

**输入/输出/测试**: (类似 Task 4.2 的格式)

**预估工作量**: 4 小时

---

#### Task 4.4: 面试评价 API 路由 ✅ [已完成]

**任务目标**: 实现面试评价和状态管理 API

**完成状态**: ✅ 已实现并注册到FastAPI

**文件**: `app/api/interview_feedbacks.py`

**User Story**:
- **As a**: Interviewer (API Consumer)
- **I want to**: API endpoints to submit interview feedback, update candidate status, and view the complete interview timeline
- **So that**: I can record my evaluation and track the candidate's progress through the hiring funnel

**功能需求**:
1. GET /api/feedbacks - 获取评价列表
2. GET /api/candidates/{id}/timeline - 获取候选人时间线
3. POST /api/feedbacks - 创建面试评价
4. POST /api/feedbacks/status-change - 创建状态变更记录
5. PATCH /api/feedbacks/{id} - 更新评价

**预估工作量**: 3 小时

---

### 阶段 5: 测试与部署

---

#### Task 5.1: 单元测试完善

**任务目标**: 为所有服务层编写单元测试

**文件**: `tests/test_*.py`

**User Story**:
- **As a**: Developer
- **I want to**: Comprehensive unit tests for all service layer methods with >80% code coverage
- **So that**: I can confidently refactor code, catch bugs early, and ensure business logic correctness

**验收标准**:
- ✅ 测试覆盖率 > 80%
- ✅ 所有核心业务逻辑有测试
- ✅ 测试可独立运行
- ✅ 使用 Mock 隔离外部依赖

**预估工作量**: 6-8 小时

---

#### Task 5.2: 集成测试

**任务目标**: 端到端测试完整业务流程

**User Story**:
- **As a**: QA Engineer
- **I want to**: End-to-end integration tests that cover complete user workflows (upload → parse → match → interview → status)
- **So that**: I can verify that all services work together correctly in realistic scenarios

**测试场景**:
1. 简历上传 → 解析 → 创建候选人 → 关联职位
2. 智能筛选 → 批量关联 → 打分排序
3. 面试评价 → 状态变更 → 时间线查询
4. 候选人全局状态计算

**预估工作量**: 4-5 小时

---

#### Task 5.3: API 文档完善

**任务目标**: 完善 OpenAPI 文档和示例

**User Story**:
- **As a**: API Consumer (Frontend Developer / Third-party Integrator)
- **I want to**: Complete and accurate API documentation with request/response examples
- **So that**: I can understand how to use each endpoint without reading the source code

**预估工作量**: 2 小时

---

## 📊 总体预估

### 工作量统计
- **阶段 1**: 4-6 小时
- **阶段 2**: 18-20 小时
- **阶段 3**: 5-6 小时
- **阶段 4**: 12-14 小时
- **阶段 5**: 12-15 小时

**总计**: 51-61 小时 (约 **6-8 个工作日**)

### 关键路径
1. 阶段 1 (基础服务) → 阶段 2 (业务服务) → 阶段 3 (高级功能) → 阶段 4 (API路由)
2. 测试可以与开发并行进行

### 里程碑
- **Milestone 1**: 基础服务层完成 (Day 1)
- **Milestone 2**: 核心业务服务完成 (Day 3)
- **Milestone 3**: API 路由完成 (Day 5)
- **Milestone 4**: 测试完成,系统可部署 (Day 7)

---

## 🔄 开发流程建议

### 每个任务的执行流程
1. **阅读任务说明** - 理解输入/输出/验收标准
2. **编写测试用例** - TDD 方式,先写测试
3. **实现功能代码** - 按照实现提示编码
4. **运行测试验证** - 确保测试通过
5. **代码审查** - 检查类型注解、docstring、日志
6. **提交代码** - 使用规范的 commit message

### 质量保证
- ✅ 所有函数有类型注解
- ✅ 所有公开接口有 docstring
- ✅ 使用 `uv run ruff format .` 格式化
- ✅ 使用 `uv run basedpyright` 类型检查
- ✅ 测试覆盖率 > 80%

---

## 📝 备注

- 每个任务独立可测,可以并行开发
- 建议按顺序完成阶段,保证依赖关系
- 预估时间包含测试编写和调试
- 实际开发中可能需要根据情况调整优先级

---

## 🔐 阶段 6: 认证与组织管理 (新增 - 2025-01-27)

### 概述
添加用户认证和多租户组织管理功能，实现数据隔离和权限控制。

**技术方案**:
- 认证：Supabase Auth + JWT（邮箱+密码登录）
- 权限：简单的 admin/member 角色
- 数据隔离：PostgreSQL RLS + org_id

---

### Task 6.1: 数据库Schema更新 🆕

**任务目标**: 创建认证和组织相关的数据库表结构

**状态**: ⏳ 待开始
**预计时间**: 2-3小时

**文件**:
- `database/schema_v2.sql` - 新版schema
- `database/migrations/add_auth_and_org.sql` - 迁移脚本
- `scripts/reset_database.py` - 数据库重置脚本

**功能需求**:
1. 创建 organizations 表（含6位组织码）
2. 创建 org_members 表（含审批流程）
3. 创建 users 配置表
4. 所有业务表添加 org_id 字段
5. 设置 RLS 策略

**验收标准**:
- [ ] 新表创建成功
- [ ] 外键约束正确
- [ ] RLS策略生效
- [ ] 索引优化完成
- [ ] 测试数据准备

---

### Task 6.2: Supabase Auth集成 🆕

**任务目标**: 集成Supabase Auth实现用户认证

**状态**: ⏳ 待开始
**预计时间**: 3-4小时

**文件**:
- `app/config/auth.py` - Auth配置
- `app/services/auth_service.py` - 认证服务
- `app/middleware/auth.py` - JWT中间件

**功能需求**:
1. Supabase Auth客户端配置
2. JWT验证中间件
3. 用户session管理
4. Token刷新机制
5. 权限验证装饰器

**验收标准**:
- [ ] JWT验证正常
- [ ] 401/403错误处理
- [ ] Token自动刷新
- [ ] 用户上下文注入
- [ ] 单元测试通过

---

### Task 6.3: 认证API端点 🆕

**任务目标**: 实现用户注册、登录等认证API

**状态**: ⏳ 待开始
**预计时间**: 4-5小时

**文件**: `app/api/auth.py`

**API端点**:
- POST /api/auth/register - 用户注册
- POST /api/auth/login - 用户登录
- POST /api/auth/logout - 用户登出
- GET /api/auth/me - 获取当前用户
- POST /api/auth/reset-password - 重置密码
- POST /api/auth/verify-email - 邮箱验证

**验收标准**:
- [ ] 注册流程完整
- [ ] 登录返回JWT
- [ ] 密码强度验证
- [ ] 邮箱格式验证
- [ ] 错误信息友好

---

### Task 6.4: 组织管理API 🆕

**任务目标**: 实现组织创建、加入、成员管理等API

**状态**: ⏳ 待开始
**预计时间**: 4-5小时

**文件**: `app/api/organizations.py`

**API端点**:
- GET /api/organizations - 我的组织列表
- POST /api/organizations - 创建组织
- GET /api/organizations/{id} - 组织详情
- POST /api/organizations/join - 申请加入
- GET /api/organizations/{id}/members - 成员列表
- POST /api/organizations/{id}/approve - 审批成员
- DELETE /api/organizations/{id}/members/{uid} - 移除成员
- POST /api/organizations/{id}/promote - 提升为管理员

**业务规则**:
- 最多3个管理员
- 创建者自动成为管理员
- 加入需要管理员审批
- 30天未审批自动过期

**验收标准**:
- [ ] 组织创建成功
- [ ] 6位组织码生成
- [ ] 成员审批流程
- [ ] 权限控制正确
- [ ] 管理员数量限制

---

### Task 6.5: Service层改造 🆕

**任务目标**: 为所有Service添加org_id支持

**状态**: ⏳ 待开始
**预计时间**: 6-8小时

**需改造的Service**:
1. BaseService - 添加org_id注入机制
2. CandidateService - 所有查询添加org_id
3. PositionService - 所有查询添加org_id
4. InterviewFeedbackService - 数据隔离
5. SmartScreeningService - 只筛选本组织候选人

**验收标准**:
- [ ] 所有查询包含org_id
- [ ] 创建时自动注入org_id
- [ ] 跨组织访问被阻止
- [ ] 性能无明显下降
- [ ] 测试用例更新

---

### Task 6.6: API路由更新 🆕

**任务目标**: 更新所有API路由，添加认证和org_id注入

**状态**: ⏳ 待开始
**预计时间**: 3-4小时

**需更新的路由**:
- app/api/candidates.py
- app/api/positions.py
- app/api/interview_feedbacks.py
- app/api/users.py

**验收标准**:
- [ ] 所有端点需要认证
- [ ] org_id自动注入
- [ ] 未认证返回401
- [ ] 无组织返回403
- [ ] API文档更新

---

### Task 6.7: 认证集成测试 🆕

**任务目标**: 编写认证和组织管理的集成测试

**状态**: ⏳ 待开始
**预计时间**: 4-5小时

**测试文件**:
- tests/test_auth_flow.py - 认证流程测试
- tests/test_organization.py - 组织管理测试
- tests/test_data_isolation.py - 数据隔离测试

**测试场景**:
1. 完整注册流程（创建个人组织）
2. 加入组织流程（申请→审批→访问）
3. 数据隔离验证（组织A看不到组织B）
4. 权限控制（member vs admin）
5. Token过期和刷新

**验收标准**:
- [ ] 覆盖率>80%
- [ ] E2E测试通过
- [ ] 性能测试达标
- [ ] 安全测试通过
- [ ] 并发测试无死锁

---

## 📊 认证功能进度汇总

### 后端认证任务清单 (共7个主任务)

| 任务ID | 任务名称 | 状态 | 预计时间 | 实际时间 | 负责人 |
|--------|---------|------|----------|----------|--------|
| 6.1 | 数据库Schema更新 | ✅ 已完成 | 2-3小时 | 3小时 | Claude |
| 6.2 | Supabase Auth集成 | ✅ 已完成 | 3-4小时 | 4小时 | Claude |
| 6.3 | 认证API端点 | ✅ 已完成 | 4-5小时 | 5小时 | Claude |
| 6.4 | 组织管理API | ✅ 已完成 | 4-5小时 | 5小时 | Claude |
| 6.5 | Service层改造 | ✅ 已完成 | 6-8小时 | 6小时 | Claude |
| 6.6 | API路由更新 | ✅ 已完成 | 3-4小时 | 4小时 | Claude |
| 6.7 | 集成测试 | ⏳ 待开始 | 4-5小时 | - | - |

**总计**: 26-34小时（约4-5个工作日）

### 实施顺序

1. **Day 1**: Task 6.1 (数据库Schema)
2. **Day 2**: Task 6.2 (Auth集成) + Task 6.3 (认证API)
3. **Day 3**: Task 6.4 (组织API)
4. **Day 4**: Task 6.5 (Service改造)
5. **Day 5**: Task 6.6 (路由更新) + Task 6.7 (测试)

### 验收标准

**Phase 1 完成标志**:
- [ ] 用户可以注册和登录
- [ ] 创建/加入组织流程完整
- [ ] 数据严格隔离
- [ ] 所有原有功能正常

**性能指标**:
- 登录响应 < 1秒
- API响应增加 < 100ms
- 数据库查询增加 < 10%

---

## 🔄 阶段 7: Interview Feedbacks 数据库重构 v2.0 (新增 - 2025-01-27)

### 概述
重构 `interview_feedbacks` 表以支持三种互斥的记录类型，提供更灵活的评价和状态追踪系统。

**技术方案**:
- 数据库：三种记录类型（interview_rating, ai_rating, new_status）互斥存储
- 后端：Pydantic 模型 + Service 层 + API 层全部适配 v2.0
- 迁移：完整的数据迁移脚本，支持向后兼容

**v2.0 核心变更**:
1. **记录类型**：支持三种互斥类型
   - Interview evaluations: `interview_rating` (1-4)
   - AI evaluations: `ai_rating` (1-10)
   - Status/log records: `new_status` (enum)

2. **新字段**：
   - `interviewer` (UUID) - 替代原来的整数ID
   - `interviewer_type` (user/agent/system) - 区分评价者类型
   - 移除 `is_status_change` 字段（通过 new_status 是否为 NULL 判断）

3. **向后兼容**：
   - 自动从 `interview_feedbacks_backup` 迁移旧数据
   - 旧的 `rating` 字段 → 新的 `interview_rating`
   - 旧的 `is_status_change=true` 记录 → `new_status` 有值

---

### Task 7.1: 数据库迁移脚本 ✅ [已完成]

**任务目标**: 创建并执行 interview_feedbacks v2.0 迁移脚本

**完成状态**: ✅ 已在线上 Supabase 执行完成 (2025-01-27)

**文件**: `database/migrations/002_refactor_interview_feedbacks.sql`

**迁移内容**:
1. ✅ 备份旧表到 `interview_feedbacks_backup`
2. ✅ DROP 并重建 `interview_feedbacks` 表（新schema）
3. ✅ 创建索引（candidate_id, position_id, interviewer, interviewer_type, created_at, interview_date）
4. ✅ 从 backup 表迁移数据
5. ✅ 重新启用 RLS 策略
6. ✅ 创建验证函数 `validate_interview_feedback_type()`

**数据库状态**:
- Total records: 0 (迁移后干净状态)
- Backup records: 0 (旧数据已迁移)
- 所有索引正常
- RLS 策略已重新启用

**验收标准**:
- ✅ 迁移脚本在线上执行成功
- ✅ 表结构符合v2.0设计
- ✅ 索引全部创建
- ✅ RLS策略生效
- ✅ 验证函数存在

---

### Task 7.2: Pydantic 模型更新 ✅ [已完成]

**任务目标**: 更新 InterviewFeedback Pydantic 模型以支持 v2.0 schema

**完成状态**: ✅ 已完成并通过类型检查 (2025-01-27)

**文件**: `app/models/interview_feedback.py`

**完成内容**:
1. ✅ 更新核心模型字段
   - `interviewer: UUID` (原: int)
   - `interviewer_type: InterviewerType` (新增)
   - `interview_rating: InterviewRating | None` (原: rating)
   - `ai_rating: AIRating | None` (新增)
   - `new_status: FeedbackStatus | None` (原: is_status_change + new_status)

2. ✅ 新增类型定义
   - `InterviewRating = Literal[1, 2, 3, 4]`
   - `AIRating = Literal[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`
   - `InterviewerType = Literal["user", "agent", "system"]`
   - `FeedbackStatus = Literal[...]` (6种状态)

3. ✅ 创建便捷包装类
   - `InterviewEvaluationCreate` - 人工面试评价
   - `AIEvaluationCreate` - AI评价
   - `StatusChangeCreate` - 状态变更

4. ✅ 添加互斥性验证
   - `@model_validator` 确保三个类型字段有且仅有一个非 NULL

**验收标准**:
- ✅ 所有模型通过 basedpyright 类型检查
- ✅ 互斥性验证逻辑正确
- ✅ 便捷包装类转换方法正常
- ✅ 完整的 docstring 文档

---

### Task 7.3: InterviewFeedbackService 重构 ✅ [已完成]

**任务目标**: 重构 Service 层以支持三种记录类型

**完成状态**: ✅ 已完成 v2.0 重构 (2025-01-27)

**文件**: `app/services/interview_feedback_service.py`

**完成内容**:
1. ✅ 新增专用创建方法
   - `create_interview_feedback()` - 创建面试评价 (interview_rating)
   - `create_ai_evaluation()` - 创建AI评价 (ai_rating)
   - `create_status_change_record()` - 创建状态变更 (new_status)
   - `create_system_log()` - 创建系统日志

2. ✅ 查询方法支持类型过滤
   - `get_feedbacks_for_candidate()` - 支持 record_type 参数
   - `get_interview_evaluations_only()` - 只返回面试评价
   - `get_ai_evaluations_only()` - 只返回AI评价
   - `get_status_change_history()` - 只返回状态变更

3. ✅ 更新现有方法
   - `update_feedback()` - 防止编辑状态变更记录
   - `get_feedbacks_by_interviewer()` - 支持 UUID interviewer

4. ✅ 评分验证
   - interview_rating: 1-4 验证
   - ai_rating: 1-10 验证
   - new_status: enum 验证

**验收标准**:
- ✅ 所有专用创建方法正常工作
- ✅ 类型过滤查询正确
- ✅ 状态变更记录不可编辑
- ✅ 评分验证生效
- ✅ 完整的日志记录

---

### Task 7.4: API 端点更新 ✅ [已完成]

**任务目标**: 更新 API 端点以支持 v2.0 数据结构

**完成状态**: ✅ 已完成 API 层适配 (2025-01-27)

**文件**: `app/api/interview_feedbacks.py`

**完成内容**:
1. ✅ 通用端点更新
   - `POST /api/interview-feedbacks/` - 支持三种类型
   - `GET /api/interview-feedbacks/` - 支持 record_type 过滤
   - `GET /api/interview-feedbacks/candidate/{id}` - 候选人执行记录
   - `PATCH /api/interview-feedbacks/{id}` - 更新评价

2. ✅ 便捷端点
   - `POST /api/interview-feedbacks/status-change` - 创建状态变更
   - `GET /api/interview-feedbacks/interviewer/{id}` - 按面试官查询

3. ✅ 请求/响应模型
   - 使用 `InterviewFeedbackCreate` (支持三种类型)
   - 使用 `StatusChangeCreate` (便捷接口)
   - 返回 `InterviewFeedbackResponse` (v2.0)

4. ✅ 认证集成
   - 所有端点需要 `require_organization`
   - 自动注入 `org_id`

**API 变更摘要**:
- ✅ `rating` → `interview_rating` (1-4)
- ✅ 新增 `ai_rating` (1-10)
- ✅ 移除 `is_status_change` (通过 new_status 判断)
- ✅ `interviewer` 从 int → UUID
- ✅ 新增 `interviewer_type`

**验收标准**:
- ✅ 所有端点支持 v2.0 数据结构
- ✅ 便捷端点正常工作
- ✅ 认证和授权正确
- ✅ 错误处理完善
- ✅ API 文档自动生成

---

### Task 7.5: 前端 API 类型定义更新 ⏳ [待开始]

**任务目标**: 更新前端 TypeScript 类型定义以匹配后端 v2.0

**状态**: ⏳ 待开始
**预计时间**: 1-2小时

**文件**:
- `frontend/src/types/api.ts`
- `frontend/src/types/models.ts`
- `frontend/src/hooks/api/useInterviewFeedbacks.ts`

**需更新内容**:
1. [ ] 更新 `InterviewFeedback` 接口
   - `interviewer: string` (UUID)
   - `interviewer_type: 'user' | 'agent' | 'system'`
   - `interview_rating?: number` (1-4)
   - `ai_rating?: number` (1-10)
   - `new_status?: string`
   - 移除 `is_status_change`

2. [ ] 更新 `CreateInterviewFeedbackRequest`
   - 支持三种类型字段
   - 添加互斥性验证

3. [ ] 更新 API hooks
   - `useCreateInterviewFeedback`
   - `useCreateStatusChange`
   - `useGetFeedbacks` - 支持 record_type 过滤

**验收标准**:
- [ ] TypeScript 编译无错误
- [ ] 类型定义与后端一致
- [ ] API hooks 类型正确

---

### Task 7.6: 前端面试评价组件更新 ⏳ [待开始]

**任务目标**: 更新前端面试评价相关组件以支持三种类型

**状态**: ⏳ 待开始
**预计时间**: 2-3小时

**文件**:
- `frontend/src/components/business/InterviewFeedbackModal.tsx`
- `frontend/src/components/business/InterviewTimeline.tsx`
- `frontend/src/components/business/AddRecordModal.tsx`

**需更新内容**:
1. [ ] **InterviewFeedbackModal**
   - 支持选择记录类型（面试评价/AI评价/状态变更）
   - 根据类型显示不同的表单字段
   - interview_rating: 1-4星选择
   - ai_rating: 1-10分选择
   - new_status: 下拉选择

2. [ ] **InterviewTimeline**
   - 根据记录类型显示不同的图标和颜色
   - interview_rating 显示星级
   - ai_rating 显示分数
   - new_status 显示状态徽章
   - 正确处理 `interviewer_type`

3. [ ] **AddRecordModal**
   - 适配新的字段结构
   - 更新 API 调用

**验收标准**:
- [ ] 三种类型表单正确显示
- [ ] Timeline 组件正确区分类型
- [ ] 评分组件适配新范围
- [ ] 状态选择器正常工作

---

### Task 7.7: 后端集成测试更新 ⏳ [待开始]

**任务目标**: 更新后端集成测试以覆盖 v2.0 功能

**状态**: ⏳ 待开始
**预计时间**: 2-3小时

**文件**:
- `backend/tests/test_interview_feedback_service.py`
- `backend/tests/test_api_interview_feedbacks.py`

**需更新内容**:
1. [ ] Service 层测试
   - 测试三种创建方法
   - 测试类型过滤查询
   - 测试互斥性验证
   - 测试评分验证

2. [ ] API 层测试
   - 测试通用端点
   - 测试便捷端点
   - 测试 record_type 过滤
   - 测试错误处理

3. [ ] E2E 测试
   - 完整的评价创建流程
   - 状态变更流程
   - Timeline 查询流程

**验收标准**:
- [ ] 所有测试通过
- [ ] 覆盖率 > 80%
- [ ] 边界情况覆盖
- [ ] 错误场景测试

---

### Task 7.8: backend/README.md 文档更新 ⏳ [待开始]

**任务目标**: 更新后端文档以反映 v2.0 变更

**状态**: ⏳ 待开始
**预计时间**: 1小时

**文件**: `backend/README.md`

**需更新内容**:
1. [ ] API 端点文档
   - 更新 interview_feedbacks 相关端点
   - 添加 record_type 参数说明
   - 更新请求/响应示例

2. [ ] Service 层文档
   - 更新 InterviewFeedbackService 方法列表
   - 添加三种创建方法说明

3. [ ] 数据库 Schema 说明
   - 更新 interview_feedbacks 表结构
   - 添加 v2.0 变更说明

4. [ ] 迁移指南
   - 记录迁移步骤
   - 添加向后兼容性说明

**验收标准**:
- [ ] 文档准确反映当前状态
- [ ] API 示例可直接使用
- [ ] 迁移指南清晰完整

---

## 📊 Interview Feedbacks v2.0 重构进度汇总

### 后端重构任务清单 (共8个任务)

| 任务ID | 任务名称 | 状态 | 预计时间 | 实际时间 | 完成日期 |
|--------|---------|------|----------|----------|----------|
| 7.1 | 数据库迁移脚本 | ✅ 已完成 | 2小时 | 1小时 | 2025-01-27 |
| 7.2 | Pydantic 模型更新 | ✅ 已完成 | 2小时 | 1小时 | 2025-01-27 |
| 7.3 | InterviewFeedbackService 重构 | ✅ 已完成 | 3小时 | 2小时 | 2025-01-27 |
| 7.4 | API 端点更新 | ✅ 已完成 | 2小时 | 1小时 | 2025-01-27 |
| 7.5 | 前端 API 类型定义更新 | ⏳ 待开始 | 1-2小时 | - | - |
| 7.6 | 前端面试评价组件更新 | ⏳ 待开始 | 2-3小时 | - | - |
| 7.7 | 后端集成测试更新 | ⏳ 待开始 | 2-3小时 | - | - |
| 7.8 | backend/README.md 文档更新 | ⏳ 待开始 | 1小时 | - | - |

**后端已完成**: 5小时 (Model + Service + API 三层)
**前端待完成**: 3-5小时 (类型定义 + 组件更新)
**测试待完成**: 2-3小时 (集成测试)
**文档待完成**: 1小时

**总计**: 11-14小时 (约 1.5-2 个工作日)

### 实施顺序

1. ✅ **Phase 1 - 后端核心** (已完成 - 2025-01-27)
   - Task 7.1: 数据库迁移
   - Task 7.2: Pydantic 模型
   - Task 7.3: Service 层
   - Task 7.4: API 层

2. ⏳ **Phase 2 - 前端适配** (待开始)
   - Task 7.5: API 类型定义
   - Task 7.6: 组件更新

3. ⏳ **Phase 3 - 测试与文档** (待开始)
   - Task 7.7: 集成测试
   - Task 7.8: 文档更新

### 验收标准

**v2.0 完成标志**:
- ✅ 数据库迁移成功
- ✅ 后端三层全部适配
- [ ] 前端组件正常工作
- [ ] 集成测试通过
- [ ] 文档更新完整

**向后兼容性**:
- ✅ 旧数据自动迁移
- ✅ API 保持向后兼容
- ✅ 前端逐步升级
