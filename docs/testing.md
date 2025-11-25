# 测试指南

本文档提供了项目的测试策略、工具和最佳实践。

---

## 目录

- [测试概览](#测试概览)
- [后端测试](#后端测试)
- [前端测试](#前端测试)
- [E2E测试 (Playwright)](#e2e测试-playwright)
- [手动测试清单](#手动测试清单)
- [测试最佳实践](#测试最佳实践)

---

## 测试概览

### 测试金字塔

```
        ╱╲
       ╱  ╲      E2E Tests (Playwright)
      ╱────╲     - 覆盖关键用户流程
     ╱      ╲    - 运行较慢，数量较少
    ╱────────╲
   ╱          ╲  Integration Tests
  ╱────────────╲ - API集成测试
 ╱              ╲- 数据库操作测试
╱────────────────╲
   Unit Tests      - 单元测试
   - 业务逻辑
   - 工具函数
   - 组件逻辑
```

### 测试覆盖率目标

| 层级 | 目标覆盖率 | 当前状态 |
|------|-----------|---------|
| **Backend Unit Tests** | >80% | 78% |
| **Frontend Component Tests** | >70% | N/A (待实现) |
| **E2E Tests** | 核心流程100% | 12个测试通过 |

---

## 后端测试

### 快速开始

```bash
cd backend

# 运行所有测试
uv run pytest

# 运行特定测试文件
uv run pytest tests/test_candidates.py

# 运行特定测试函数
uv run pytest tests/test_candidates.py::test_create_candidate

# 详细输出
uv run pytest -v

# 显示覆盖率
uv run pytest --cov=app --cov-report=html

# 生成 HTML 覆盖率报告（在 htmlcov/index.html 查看）
uv run pytest --cov=app --cov-report=html
open htmlcov/index.html  # macOS
```

### 测试结构

```
backend/tests/
├── conftest.py           # pytest配置和fixtures
├── test_auth.py          # 认证测试
├── test_candidates.py    # 候选人CRUD测试
├── test_positions.py     # 职位CRUD测试
├── test_interview_feedbacks.py  # 面试反馈测试
├── test_organizations.py # 组织管理测试
└── test_services/        # 服务层测试
    ├── test_candidate_service.py
    ├── test_position_service.py
    └── test_interview_feedback_service.py
```

### 编写测试示例

#### 1. API端点测试

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_candidate(auth_headers):
    """测试创建候选人"""
    response = client.post(
        "/api/candidates/",
        json={
            "name": "张三",
            "phone": "13800138000",
            "email": "zhangsan@example.com",
            "skills": ["Python", "FastAPI"],
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "张三"
    assert "id" in data
```

#### 2. 服务层测试

```python
import pytest
from app.services.candidate_service import CandidateService

@pytest.mark.asyncio
async def test_candidate_service_create():
    """测试候选人服务创建逻辑"""
    service = CandidateService(org_id="test-org-id")

    candidate_data = {
        "name": "李四",
        "email": "lisi@example.com",
        "skills": ["JavaScript", "React"],
    }

    result = await service.create(candidate_data)
    assert result["name"] == "李四"
    assert result["org_id"] == "test-org-id"
```

### Fixtures

常用的 pytest fixtures (在 `conftest.py` 中定义):

```python
@pytest.fixture
def auth_headers():
    """返回认证header"""
    token = create_test_token()
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def test_user():
    """创建测试用户"""
    user = create_user("test@example.com", "test_org_id")
    yield user
    # cleanup
    delete_user(user.id)

@pytest.fixture
def test_candidate():
    """创建测试候选人"""
    candidate = create_candidate(name="Test", org_id="test_org")
    yield candidate
    # cleanup
    delete_candidate(candidate.id)
```

### 异步测试

使用 `pytest-asyncio`:

```python
import pytest

@pytest.mark.asyncio
async def test_async_function():
    """测试异步函数"""
    result = await some_async_function()
    assert result is not None
```

---

## 前端测试

### 单元测试 (Vitest)

```bash
cd frontend

# 运行单元测试
npm run test

# Watch 模式
npm run test:watch

# 覆盖率
npm run test:coverage
```

### 组件测试示例

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/ui/components/common/Button'

describe('Button Component', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when loading', () => {
    render(<Button loading>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

---

## E2E测试 (Playwright)

### 快速开始

```bash
cd frontend

# 安装 Playwright（首次运行）
npx playwright install

# 运行所有E2E测试
npx playwright test

# 运行特定测试文件
npx playwright test e2e/navigation.spec.ts

# UI模式（可视化运行）
npx playwright test --ui

# 调试模式
npx playwright test --debug

# 生成测试报告
npx playwright show-report
```

### 配置

Playwright 配置文件: `frontend/playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './e2e',              // 测试目录
  fullyParallel: false,           // 串行运行（避免并发问题）
  workers: 1,                     // 单个worker
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',  // 失败时截图
    video: 'retain-on-failure',     // 失败时录制视频
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,   // 复用已有服务器
  },
})
```

### E2E测试结构

```
frontend/e2e/
├── navigation.spec.ts        # 导航和侧边栏测试
├── candidates-list.spec.ts   # 候选人列表页测试
├── candidate-detail.spec.ts  # 候选人详情页测试
├── positions-list.spec.ts    # 职位列表页测试
└── position-detail.spec.ts   # 职位详情页测试
```

### 编写E2E测试示例

#### 1. 基本页面测试

```typescript
import { test, expect } from '@playwright/test'

test.describe('候选人列表页测试', () => {
  test('应该成功加载候选人列表页', async ({ page }) => {
    await page.goto('/candidates')

    // 等待页面加载
    await page.waitForLoadState('networkidle')

    // 检查标题
    await expect(page.locator('h1')).toContainText('候选人')

    // 检查"上传简历"按钮存在
    await expect(page.getByText('上传简历')).toBeVisible()
  })
})
```

#### 2. 表单交互测试

```typescript
test('应该能够创建新职位', async ({ page }) => {
  await page.goto('/positions')

  // 点击"新建职位"按钮
  await page.getByText('新建职位').click()

  // 填写表单
  await page.fill('input[name="title"]', '高级前端工程师')
  await page.fill('input[name="department"]', '技术部')
  await page.fill('textarea[name="jd"]', '负责前端开发工作...')

  // 提交表单
  await page.getByText('创建职位').click()

  // 等待成功提示
  await expect(page.getByText('职位创建成功！')).toBeVisible()
})
```

#### 3. 导航测试

```typescript
test('测试页面间导航流畅性', async ({ page }) => {
  await page.goto('/')

  // 导航到候选人页面
  await page.getByText('候选人').click()
  await expect(page).toHaveURL(/.*\/candidates/)

  // 导航到职位页面
  await page.getByText('职位').click()
  await expect(page).toHaveURL(/.*\/positions/)
})
```

### E2E测试覆盖范围

#### ✅ 已覆盖功能

**导航模块 (12个测试)**:
- ✅ 应用首页加载
- ✅ 侧边栏显示和切换
- ✅ 候选人/职位/组织导航链接
- ✅ 页面间导航流畅性
- ✅ 控制台无错误

**候选人模块**:
- ✅ 候选人列表页加载
- ✅ "上传简历"按钮显示和点击
- ✅ 候选人表格显示
- ✅ 进入详情页导航

**职位模块**:
- ✅ 职位列表页加载
- ✅ 职位详情页加载
- ✅ "智能筛选"按钮显示

#### ⏳ 待添加测试

- 用户登录流程
- 简历上传完整流程
- 面试评价添加流程
- 状态变更流程
- 智能筛选完整流程
- 组织成员管理

### E2E测试最佳实践

1. **使用数据测试ID**
   ```tsx
   // 组件中
   <button data-testid="create-position-btn">创建职位</button>

   // 测试中
   await page.getByTestId('create-position-btn').click()
   ```

2. **等待异步操作**
   ```typescript
   // 等待网络请求完成
   await page.waitForLoadState('networkidle')

   // 等待特定元素出现
   await page.waitForSelector('text=职位列表')

   // 等待API响应
   await page.waitForResponse(response =>
     response.url().includes('/api/positions') && response.status() === 200
   )
   ```

3. **截图和调试**
   ```typescript
   // 在测试中截图
   await page.screenshot({ path: 'screenshot.png' })

   // 暂停调试
   await page.pause()
   ```

---

## 手动测试清单

### 核心功能测试

#### 1. 用户认证

- [ ] 用户注册
  - [ ] 填写正确信息可以注册成功
  - [ ] 邮箱格式验证
  - [ ] 密码强度验证

- [ ] 用户登录
  - [ ] 正确凭据登录成功
  - [ ] 错误凭据提示错误
  - [ ] 记住登录状态

- [ ] 用户登出
  - [ ] 登出后清除token
  - [ ] 重定向到登录页

#### 2. 候选人管理

- [ ] 上传简历
  - [ ] 支持PDF格式
  - [ ] AI解析正确
  - [ ] 显示解析结果

- [ ] 查看候选人列表
  - [ ] 列表正常显示
  - [ ] 搜索功能正常
  - [ ] 筛选功能正常

- [ ] 编辑候选人信息
  - [ ] 可以成功编辑
  - [ ] 显示成功提示
  - [ ] 数据正确更新

#### 3. 职位管理

- [ ] 创建职位
  - [ ] 填写完整信息可创建
  - [ ] 必填字段验证
  - [ ] 创建成功提示

- [ ] 编辑职位  ✨ **新增功能**
  - [ ] 点击"编辑职位"按钮打开弹窗
  - [ ] 表单自动填充当前信息
  - [ ] 修改信息并保存成功
  - [ ] 显示成功提示并刷新页面

- [ ] 智能筛选
  - [ ] 筛选算法正确
  - [ ] 显示匹配候选人
  - [ ] 匹配度显示正确

#### 4. 面试评价

- [ ] 添加面试评价
  - [ ] 选择评分（1-4星）
  - [ ] 填写评价内容
  - [ ] 选择面试日期
  - [ ] 提交成功

- [ ] 添加状态变更
  - [ ] 选择新状态
  - [ ] 填写变更原因
  - [ ] 提交成功

- [ ] 查看执行记录
  - [ ] 按时间倒序显示
  - [ ] 显示所有记录类型
  - [ ] 滚动加载更多

### 浏览器兼容性测试

- [ ] Chrome (最新版本)
- [ ] Firefox (最新版本)
- [ ] Safari (最新版本)
- [ ] Edge (最新版本)

### 响应式测试

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### 性能测试

- [ ] 首次加载时间 < 3s
- [ ] 页面切换流畅
- [ ] 大列表滚动流畅
- [ ] API响应时间 < 1s

---

## 测试最佳实践

### 1. 测试命名

```typescript
// ✅ 好的测试名称（描述行为）
test('should create position when all required fields are filled')
test('should show error message when email is invalid')
test('should navigate to detail page when candidate is clicked')

// ❌ 不好的测试名称
test('test1')
test('createPosition')
test('error')
```

### 2. 测试隔离

每个测试应该独立运行，不依赖其他测试的状态：

```typescript
// ✅ 好的做法
test('test A', () => {
  const data = setupTestData()  // 每个测试自己准备数据
  // ... 测试代码
  cleanupTestData(data)  // 清理数据
})

// ❌ 不好的做法
let sharedData
test('test A', () => {
  sharedData = createData()  // 修改共享状态
})
test('test B', () => {
  useSharedData(sharedData)  // 依赖test A的状态
})
```

### 3. 断言清晰

```typescript
// ✅ 好的断言（明确具体）
expect(response.status).toBe(201)
expect(data.name).toBe('张三')
expect(data.skills).toContain('Python')

// ❌ 不好的断言（模糊）
expect(response).toBeTruthy()
expect(data).toBeDefined()
```

### 4. 测试边界情况

```typescript
describe('Candidate name validation', () => {
  it('accepts valid names', () => {
    expect(validateName('张三')).toBe(true)
  })

  it('rejects empty names', () => {
    expect(validateName('')).toBe(false)
  })

  it('rejects names longer than 50 characters', () => {
    const longName = 'a'.repeat(51)
    expect(validateName(longName)).toBe(false)
  })

  it('handles special characters', () => {
    expect(validateName('张三-李四')).toBe(true)
  })
})
```

### 5. 使用Mock谨慎

只 mock 外部依赖，不 mock 内部逻辑：

```typescript
// ✅ Mock外部API调用
jest.mock('./api', () => ({
  fetchCandidates: jest.fn(() => Promise.resolve([]))
}))

// ❌ 不要 mock 被测试的函数本身
jest.mock('./myFunction')  // 这样测试没意义
```

### 6. 测试覆盖率不是唯一目标

- 100%覆盖率 ≠ 100%正确
- 重点测试关键业务逻辑
- 关注测试质量，而非数量

---

## CI/CD集成

### GitHub Actions示例

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - name: Install uv
        run: curl -LsSf https://astral.sh/uv/install.sh | sh
      - name: Install dependencies
        run: cd backend && uv sync
      - name: Run tests
        run: cd backend && uv run pytest --cov

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: Install Playwright
        run: cd frontend && npx playwright install --with-deps
      - name: Run E2E tests
        run: cd frontend && npx playwright test
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: playwright-report
          path: frontend/playwright-report
```

---

## 常见问题

### Q: Playwright测试失败，提示"Element not found"

**A**: 可能是异步加载问题，添加等待：
```typescript
await page.waitForSelector('text=预期的文本')
await page.waitForLoadState('networkidle')
```

### Q: pytest运行很慢

**A**:
1. 使用 `-n auto` 并行运行：`uv run pytest -n auto`
2. 只运行修改相关的测试：`uv run pytest tests/test_candidates.py`
3. 使用测试数据库，避免真实API调用

### Q: 测试环境数据混乱

**A**:
1. 使用独立的测试数据库
2. 每个测试前后清理数据
3. 使用事务回滚（`pytest-django` 的 `transactional_db`）

---

**最后更新**: 2025-11-12
**维护者**: Development Team
