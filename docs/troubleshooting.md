# 故障排查指南

本文档记录了开发过程中遇到的常见问题及其解决方案。

---

## 目录

- [UUID 序列化问题](#uuid-序列化问题)
- [认证问题](#认证问题)
- [Position 创建问题](#position-创建问题)
- [表单验证问题](#表单验证问题)
- [常见错误FAQ](#常见错误faq)

---

## UUID 序列化问题

### 问题描述

在添加面试评价或状态变更时出现错误：
```
添加失败: Failed to create status change: Object of type UUID is not JSON serializable
```

### 根本原因

1. **前端**: `user.id` 虽然在 TypeScript 类型中定义为 `string`，但在某些情况下可能作为对象传递
2. **后端**: Pydantic v2 的 `model_dump()` 方法默认使用 Python 模式，UUID 对象不会自动序列化为字符串

### 解决方案

#### 前端修复

在所有使用 `user.id` 的地方显式转换为字符串：

```typescript
// ❌ 错误写法
const requestData = {
  interviewer: user.id,  // 可能是UUID对象
}

// ✅ 正确写法
const requestData = {
  interviewer: String(user.id),  // 确保是字符串
}
```

**相关文件**:
- `frontend/src/components/business/AddRecordModal.tsx` (第 127, 160 行)

#### 后端修复

在调用 `model_dump()` 时使用 JSON 序列化模式：

```python
# ❌ 错误写法
data = feedback_data.model_dump()  # 默认Python模式，UUID保持为对象

# ✅ 正确写法
data = feedback_data.model_dump(mode='json')  # JSON模式，UUID自动转为字符串
```

**相关文件**:
- `backend/app/api/interview_feedbacks.py` (第 86, 144 行)

### 技术说明

**Pydantic v2 model_dump() 模式**:
- `mode='python'` (默认): 返回 Python 原生对象，UUID 类型保持为 UUID 对象
- `mode='json'`: 返回可 JSON 序列化的对象，UUID 自动转换为字符串

**为什么前端也需要转换**:
1. 运行时类型检查不保证实际值类型
2. localStorage 读取或 JSON 解析可能导致类型不一致
3. 显式转换是防御性编程，确保 100% 兼容性

---

## 认证问题

### 问题描述

调用 interview 相关 API 时返回 401 Unauthorized 错误。

### 根本原因

`interviewApi.ts` 中的 API 函数直接使用原生 `fetch()`，没有自动添加 Authorization header。

### 解决方案

使用 `apiClient` 替代 `fetch()`，自动注入 JWT token：

```typescript
// ❌ 错误写法
const response = await fetch(`${API_BASE}/api/interview-feedbacks/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})

// ✅ 正确写法
import { apiClient } from './auth.service'

const response = await apiClient.post(`/api/interview-feedbacks/`, data)
return response.data
```

### apiClient 工作原理

```typescript
// auth.service.ts
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// 请求拦截器：自动添加 Authorization header
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：处理 401 错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期，清除本地存储
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
    }
    return Promise.reject(error)
  }
)
```

**受影响的函数** (frontend/src/services/interviewApi.ts):
- `getCandidateExecutionRecords`
- `getInterviewFeedbacks`
- `getInterviewFeedback`
- `getInterviewFeedbacksByInterviewer`
- `createInterviewFeedback`
- `createStatusChange`
- `createInterviewEvaluation`
- `createAIEvaluation`
- `updateInterviewFeedback`

---

## Position 创建问题

### 问题描述

创建职位时没有报错，但职位没有成功创建到数据库。

### 根本原因

前端发送的 `requirements: []` 是空数组，但后端 API 期望的类型是 `dict | null`，导致类型验证失败。

### 解决方案

将空数组改为 `null`，并确保空字符串也转为 `null`：

```typescript
// ❌ 错误写法
const submitData = {
  title: formData.title,
  department: formData.department,
  jd: formData.jd,
  requirements: [],  // 后端不接受空数组
}

// ✅ 正确写法
const submitData = {
  title: formData.title.trim(),
  department: formData.department.trim() || null,  // 空字符串 → null
  jd: formData.jd.trim(),
  requirements: null,  // 后端期望 dict 或 null
}
```

**相关文件**:
- `frontend/src/components/business/CreatePositionModal.tsx` (第 55-60 行)
- `frontend/src/components/business/EditPositionModal.tsx` (第 74-79 行)

### 后端类型定义

```python
# backend/app/models/position.py
class PositionCreate(CreateSchema):
    title: str
    department: str | None = None
    jd: str
    requirements: dict[str, Any] | None = None  # dict 或 null，不是 list
    salary_range: str | None = None
```

---

## 表单验证问题

### 问题描述

提交面试评价时，后端提示缺少必填字段。

### 解决方案

在前端添加严格的表单验证：

```typescript
// 验证评分
if (rating === 0) {
  alert('请选择评分')
  return
}

// 验证评价内容（去除空白后检查）
const trimmedComments = comments.trim()
if (!trimmedComments) {
  alert('请填写评价内容')
  return
}

// 验证面试日期
if (!interviewDate) {
  alert('请选择面试日期')
  return
}
```

**最佳实践**:
1. 使用 `trim()` 去除首尾空白
2. 检查 trim 后的值是否为空
3. 提供清晰的用户友好提示
4. 在 UI 层标记必填字段（`<span class="text-red-500">*</span>`）

---

## 常见错误FAQ

### 1. "Failed to resolve import"

**错误信息**: `Failed to resolve import "@/hooks/useAuth"`

**原因**: 导入路径错误或文件不存在

**解决**:
- 检查文件是否存在于正确路径
- 检查 TypeScript 路径别名配置 (`tsconfig.json` 中的 `paths`)
- 确认导出语句正确 (`export { useAuth }`)

### 2. "Network Error" 或 "CORS Error"

**原因**:
- 后端服务未启动
- CORS 配置错误
- API 基础 URL 配置错误

**解决**:
1. 确认后端运行在 http://localhost:8000
2. 检查 `frontend/.env` 中的 `VITE_API_BASE_URL`
3. 检查后端 CORS 配置 (`backend/app/main.py`)

### 3. "Token expired" 或持续 401 错误

**原因**: JWT token 过期或被清除

**解决**:
1. 重新登录获取新 token
2. 检查 token 有效期配置 (`backend/app/middleware/auth.py`)
3. 确认 `localStorage` 中有 `auth_token`

### 4. "Position candidates is empty" 但确实有数据

**原因**:
- API 返回数据格式不匹配
- 分页参数错误
- org_id 隔离导致数据不可见

**解决**:
1. 打开浏览器 Network 标签检查 API 响应
2. 确认当前用户的 org_id
3. 检查数据库中的 org_id 字段

### 5. "Soft delete" 相关问题

**说明**: 所有删除操作使用软删除（`is_deleted = true`），不会物理删除数据。

**如果需要查看已删除数据**:
```sql
-- 数据库查询
SELECT * FROM candidates WHERE is_deleted = true;
```

**如果误删需要恢复**:
```sql
-- 恢复数据
UPDATE candidates SET is_deleted = false WHERE id = <candidate_id>;
```

---

## 调试技巧

### 前端调试

1. **使用浏览器开发者工具**
   - Console: 查看错误日志
   - Network: 检查 API 请求和响应
   - Application: 查看 localStorage (auth_token, user)

2. **添加调试日志** (开发时)
   ```typescript
   console.log('Request data:', requestData)
   console.error('Error:', error)  // 保留错误日志
   ```

3. **React Query DevTools**
   - 查看查询缓存状态
   - 手动触发重新获取
   - 检查 mutation 状态

### 后端调试

1. **查看日志输出**
   ```bash
   cd backend
   uv run uvicorn app.main:app --reload --log-level=debug
   ```

2. **使用 Python debugger**
   ```python
   import pdb; pdb.set_trace()
   ```

3. **Swagger UI 测试 API**
   - 访问 http://localhost:8000/docs
   - 点击 "Authorize" 输入 JWT token
   - 直接测试 API 端点

### 数据库调试

1. **Supabase SQL Editor**
   - 在 Supabase 控制台运行 SQL 查询
   - 检查数据完整性

2. **常用调试查询**
   ```sql
   -- 检查用户和组织关系
   SELECT u.*, om.*
   FROM users u
   LEFT JOIN org_members om ON u.id = om.user_id;

   -- 检查 Interview Feedbacks
   SELECT * FROM interview_feedbacks
   WHERE candidate_id = <id>
   ORDER BY created_at DESC;
   ```

---

## 获取帮助

如果遇到本文档未覆盖的问题：

1. **查看相关文档**
   - `backend/README.md` - 后端 API 完整文档
   - `docs/testing.md` - 测试指南
   - `docs/frontend_task_plan.md` - 前端开发进度

2. **检查 Git 历史**
   ```bash
   git log --oneline --grep="fix"  # 查看修复历史
   git blame <file>  # 查看文件修改历史
   ```

3. **运行测试**
   ```bash
   # 后端测试
   cd backend && uv run pytest

   # 前端测试
   cd frontend && npx playwright test
   ```

---

**最后更新**: 2025-11-12
**维护者**: Development Team
