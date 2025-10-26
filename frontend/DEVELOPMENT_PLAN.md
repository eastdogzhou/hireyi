# 前端开发计划 - AI Resume Scanning System

## 项目概述

基于 React + TypeScript + TailwindCSS 的智能简历筛选系统前端应用，采用 Domain-Driven Design 架构，橙色主题设计风格。

## 技术栈

- **框架**: React 18 + TypeScript 5
- **构建工具**: Vite
- **样式**: TailwindCSS 3 (橙色主题)
- **路由**: React Router v6
- **状态管理**: Zustand + React Query
- **表单**: React Hook Form + Zod
- **UI组件**: 自定义组件 + Radix UI
- **API通信**: Supabase Client SDK
- **测试**: Vitest + Testing Library
- **文档**: Storybook

## 架构设计 (Domain-Driven Design)

```
frontend/
├── src/
│   ├── domain/                 # 领域层
│   │   ├── models/             # 领域模型 ✅
│   │   │   ├── candidate.ts
│   │   │   ├── position.ts
│   │   │   ├── interview.ts
│   │   │   └── index.ts
│   │   ├── services/           # 领域服务
│   │   └── repositories/       # 仓储接口
│   │
│   ├── infrastructure/         # 基础设施层
│   │   ├── api/               # API实现
│   │   │   ├── supabase.ts
│   │   │   ├── candidateApi.ts
│   │   │   ├── positionApi.ts
│   │   │   └── interviewApi.ts
│   │   └── storage/           # 文件存储
│   │       └── ossStorage.ts
│   │
│   ├── application/            # 应用层
│   │   ├── hooks/             # 自定义Hooks
│   │   │   ├── useCandidates.ts
│   │   │   ├── usePositions.ts
│   │   │   └── useInterviews.ts
│   │   └── stores/            # 状态管理
│   │       ├── authStore.ts
│   │       └── uiStore.ts
│   │
│   ├── ui/                    # 表现层
│   │   ├── components/        # UI组件
│   │   │   ├── common/        # 通用组件
│   │   │   ├── candidates/    # 候选人组件
│   │   │   ├── positions/     # 职位组件
│   │   │   └── interviews/    # 面试组件
│   │   ├── layouts/           # 布局组件
│   │   └── pages/            # 页面组件
│   │
│   └── lib/                   # 工具库
│       ├── utils/             # 工具函数
│       └── validations/       # 验证逻辑
```

## 开发任务列表

### Phase 1: 基础架构 (Week 1) ✅ 部分完成

#### ✅ 已完成
- [x] 项目初始化 (React + TypeScript + Vite)
- [x] TailwindCSS 配置与橙色主题设计
- [x] 领域模型定义 (Candidate, Position, Interview)
- [x] 项目目录结构创建

#### 🚧 待完成
- [ ] Supabase 客户端配置
- [ ] 环境变量配置 (.env)
- [ ] 路由配置 (React Router)
- [ ] 全局状态管理配置 (Zustand)
- [ ] API 层基础架构
- [ ] 错误处理机制

### Phase 2: 核心组件库 (Week 1-2)

#### 通用组件
- [ ] Button (Primary, Secondary, Ghost)
- [ ] Input (Text, Number, Select, Textarea)
- [ ] Card (基础卡片, 悬浮效果)
- [ ] Badge (状态标签)
- [ ] Modal (对话框)
- [ ] Toast (通知提示)
- [ ] Loading (加载状态)
- [ ] Pagination (分页)
- [ ] SearchBar (搜索框)
- [ ] Table (数据表格)
- [ ] EmptyState (空状态)
- [ ] ErrorBoundary (错误边界)

#### 布局组件
- [ ] AppLayout (应用主布局)
- [ ] Header (顶部导航)
- [ ] Sidebar (侧边栏)
- [ ] Footer (页脚)

### Phase 3: 候选人管理功能 (Week 2)

#### 页面开发
- [ ] `/candidates` - 候选人列表页
  - [ ] 搜索筛选功能
  - [ ] 分页
  - [ ] 批量操作
- [ ] `/candidates/:id` - 候选人详情页
  - [ ] 基本信息展示
  - [ ] 技能标签
  - [ ] 关联职位列表
  - [ ] 面试评价时间线
  - [ ] 状态管理

#### 功能实现
- [ ] 简历上传 (单个/批量)
- [ ] AI 简历解析
- [ ] 候选人 CRUD 操作
- [ ] 搜索与筛选
- [ ] 导出功能

### Phase 4: 职位管理功能 (Week 2-3)

#### 页面开发
- [ ] `/positions` - 职位列表页
- [ ] `/positions/new` - 创建职位
- [ ] `/positions/:id` - 职位详情页
  - [ ] JD 展示
  - [ ] 关联候选人列表
  - [ ] 智能筛选功能
  - [ ] 批量操作
- [ ] `/positions/:id/edit` - 编辑职位

#### 功能实现
- [ ] 职位 CRUD 操作
- [ ] 智能筛选候选人
- [ ] 候选人打分排序
- [ ] 批量关联候选人
- [ ] 职位状态管理

### Phase 5: 面试评价系统 (Week 3)

#### 功能实现
- [ ] 面试评价录入
- [ ] 评价时间线展示
- [ ] 状态变更记录
- [ ] 多轮面试管理
- [ ] 评价统计分析

### Phase 6: 高级功能 (Week 3-4)

#### 数据可视化
- [ ] 仪表盘首页
- [ ] 招聘漏斗图
- [ ] 候选人来源分析
- [ ] 职位填充率统计

#### 协作功能
- [ ] 评论系统
- [ ] 操作日志
- [ ] 导出报表

### Phase 7: 测试与优化 (Week 4)

#### 测试
- [ ] 单元测试 (Vitest)
- [ ] 组件测试 (Testing Library)
- [ ] E2E 测试 (Playwright)
- [ ] 性能测试

#### 优化
- [ ] 代码分割
- [ ] 懒加载
- [ ] SEO 优化
- [ ] 无障碍支持 (WCAG 2.1 AA)

#### 文档
- [ ] Storybook 组件文档
- [ ] API 文档
- [ ] 用户使用指南

## 设计规范

### 颜色系统
```css
/* 主色调 - 橙色 */
--primary-500: #FF6B35;  /* 主橙色 */
--primary-600: #F7931E;  /* 深橙色 */

/* 辅助色 */
--secondary-500: #FFD93D; /* 黄橙色 */

/* 背景色 */
--bg-light: #FFF5F0;     /* 浅橙背景 */
```

### 组件设计原则
1. **原子设计**: 从最小单元开始构建
2. **响应式**: 移动优先，适配所有设备
3. **无障碍**: 符合 WCAG 2.1 AA 标准
4. **主题化**: 支持深色模式
5. **国际化**: 预留多语言支持

### 命名规范
- 组件: PascalCase (e.g., `CandidateCard`)
- 函数: camelCase (e.g., `handleSubmit`)
- 常量: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- CSS类: kebab-case (e.g., `candidate-card`)
- 文件: camelCase.tsx (e.g., `candidateCard.tsx`)

## 关键技术实现

### 1. Supabase 集成
```typescript
// infrastructure/api/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### 2. React Query 数据管理
```typescript
// application/hooks/useCandidates.ts
import { useQuery, useMutation } from '@tanstack/react-query';

export function useCandidates() {
  return useQuery({
    queryKey: ['candidates'],
    queryFn: fetchCandidates,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### 3. 表单验证 (Zod + React Hook Form)
```typescript
// lib/validations/candidate.ts
import { z } from 'zod';

export const candidateSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  email: z.string().email('邮箱格式不正确').optional(),
  phone: z.string().regex(/^1\d{10}$/, '手机号格式不正确').optional(),
});
```

### 4. 状态管理 (Zustand)
```typescript
// application/stores/uiStore.ts
import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({
    sidebarOpen: !state.sidebarOpen
  })),
}));
```

## NPM Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src --ext ts,tsx",
    "format": "prettier --write src/**/*.{ts,tsx,css}",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

## 环境配置

创建 `.env` 文件：
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# API
VITE_API_URL=http://localhost:8000

# Aliyun OSS
VITE_OSS_REGION=oss-cn-hangzhou
VITE_OSS_BUCKET=resume-screening

# Feature Flags
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_EXPORT=true
```

## 部署策略

### 开发环境
- 本地开发: `npm run dev`
- API Mock: MSW (Mock Service Worker)

### 测试环境
- 部署平台: Vercel/Netlify
- API: Staging Backend

### 生产环境
- 部署平台: Vercel/AWS/阿里云
- CDN: CloudFlare
- 监控: Sentry

## 性能目标

- **首屏加载**: < 3s
- **交互响应**: < 100ms
- **页面切换**: < 200ms
- **Lighthouse分数**: > 90
- **Bundle Size**: < 200KB (gzipped)

## 里程碑

### MVP (2周)
- ✅ 基础架构搭建
- [ ] 核心功能实现
- [ ] 基本UI完成

### Beta (3周)
- [ ] 所有功能完成
- [ ] 测试覆盖80%
- [ ] 性能优化

### Release (4周)
- [ ] 生产环境部署
- [ ] 文档完善
- [ ] 用户培训

## 风险与挑战

1. **NPM权限问题**: 需要修复 npm cache 权限
2. **API延迟**: 需要实现乐观更新
3. **大文件上传**: 需要分片上传
4. **实时协作**: 未来需要 WebSocket

## 下一步行动

1. 修复 NPM 权限问题:
```bash
sudo chown -R $(whoami) ~/.npm
```

2. 安装剩余依赖:
```bash
npm install
```

3. 启动开发服务器:
```bash
npm run dev
```

4. 开始实现 API 层和核心组件

---

**更新时间**: 2024-01-16
**版本**: v0.1.0
**作者**: AI Resume Scanning Team
