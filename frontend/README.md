# Frontend - AI Resume Scanning System

> 当前状态: 前端重置后 - 基础组件库已就绪，等待架构重新设计  
> 更新时间: 2025-01-17

## 📊 当前状态

### ✅ 已完成 (10%)
- 基础组件库 (16个通用组件)
- 工具函数和样式系统
- 开发环境配置

### ❌ 已清除
- 所有业务页面
- 所有业务组件
- API 集成层
- 数据 Hooks
- 路由配置
- 状态管理

### 🔄 待完成
- 前端架构设计
- 技术选型决策
- 页面开发
- 业务功能实现

## 🎨 可用组件库

所有组件位于 `src/ui/components/common/` 目录。

### 基础组件

#### Button - 按钮组件
\`\`\`tsx
import { Button } from '@/ui/components/common/Button';

<Button variant="primary" size="md">
  主要按钮
</Button>
\`\`\`

**变体 (variant)**:
- \`primary\` - 主要按钮 (蓝色)
- \`secondary\` - 次要按钮 (灰色)
- \`danger\` - 危险按钮 (红色)
- \`ghost\` - 幽灵按钮 (透明)

**尺寸 (size)**: \`sm\` | \`md\` | \`lg\`

**其他属性**: \`disabled\`, \`loading\`, \`fullWidth\`

#### Input - 输入框组件
\`\`\`tsx
import { Input, TextArea } from '@/ui/components/common/Input';

<Input
  label="候选人姓名"
  placeholder="请输入姓名"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

<TextArea
  label="职位描述"
  rows={4}
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>
\`\`\`

**属性**: \`label\`, \`error\`, \`helperText\`, \`required\`, \`disabled\`, \`fullWidth\`

#### Modal - 模态框组件
\`\`\`tsx
import { Modal } from '@/ui/components/common/Modal';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="创建职位"
  size="md"
>
  <div>模态框内容</div>
</Modal>
\`\`\`

**尺寸**: \`sm\` (400px) | \`md\` (600px) | \`lg\` (800px) | \`xl\` (1000px)

### 数据展示组件

#### Table - 表格组件

**方式一：数据驱动表格 (推荐用于简单列表)**
\`\`\`tsx
import { Table } from '@/ui/components/common/Table';

const columns = [
  { key: 'name', header: '姓名' },
  { key: 'email', header: '邮箱' },
];

const data = [
  { name: '张三', email: 'zhang@example.com' },
  { name: '李四', email: 'li@example.com' },
];

<Table columns={columns} data={data} hoverable />
\`\`\`

**方式二：组合式表格 (推荐用于复杂布局)**
\`\`\`tsx
import { TableHead, TableBody, TableRow, TableCell } from '@/ui/components/common/TablePrimitives';

<div className="w-full overflow-x-auto rounded-lg border border-gray-200">
  <table className="w-full border-collapse">
    <TableHead>
      <TableRow>
        <TableCell header>姓名</TableCell>
        <TableCell header>邮箱</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      <TableRow>
        <TableCell>张三</TableCell>
        <TableCell>zhang@example.com</TableCell>
      </TableRow>
    </TableBody>
  </table>
</div>
\`\`\`

#### Card - 卡片组件
\`\`\`tsx
import { Card } from '@/ui/components/common/Card';

<Card
  title="候选人信息"
  footer={<Button>查看详情</Button>}
>
  <p>卡片内容</p>
</Card>
\`\`\`

#### Badge - 徽章组件
\`\`\`tsx
import { Badge } from '@/ui/components/common/Badge';

<Badge variant="success" size="md">已通过</Badge>
\`\`\`

**变体**: \`default\` | \`success\` | \`warning\` | \`danger\` | \`info\`

**尺寸**: \`sm\` | \`md\` | \`lg\`

### 反馈组件

#### Loading - 加载状态组件
\`\`\`tsx
import { Spinner, LoadingDots, LoadingOverlay, Skeleton } from '@/ui/components/common/Loading';

// 旋转加载器
<Spinner size="md" />

// 点状加载器
<LoadingDots />

// 全屏遮罩
<LoadingOverlay message="正在加载数据..." />

// 骨架屏
<Skeleton width="100%" height="20px" />
\`\`\`

#### Toast - 提示消息组件
\`\`\`tsx
import { toast } from '@/ui/components/common/Toast';

// 成功提示
toast.success('保存成功');

// 错误提示
toast.error('保存失败');

// 警告提示
toast.warning('请检查输入');

// 信息提示
toast.info('处理中...');
\`\`\`

**使用前需要在 App.tsx 中添加 ToastContainer**:
\`\`\`tsx
import { ToastContainer } from '@/ui/components/common/Toast';

function App() {
  return (
    <>
      <YourApp />
      <ToastContainer />
    </>
  );
}
\`\`\`

#### Alert - 警告组件
\`\`\`tsx
import { Alert } from '@/ui/components/common/Alert';

<Alert variant="warning" title="注意">
  请确认您的操作
</Alert>
\`\`\`

**变体**: \`info\` | \`success\` | \`warning\` | \`error\`

#### EmptyState - 空状态组件
\`\`\`tsx
import { EmptyState } from '@/ui/components/common/EmptyState';

<EmptyState
  icon={<Icon />}
  title="暂无数据"
  description="开始创建您的第一个职位"
  action={<Button>创建职位</Button>}
/>
\`\`\`

### 导航和交互组件

#### Pagination - 分页组件
\`\`\`tsx
import { Pagination } from '@/ui/components/common/Pagination';

<Pagination
  currentPage={1}
  totalPages={10}
  onPageChange={(page) => setPage(page)}
/>
\`\`\`

#### SearchBar - 搜索栏组件
\`\`\`tsx
import { SearchBar } from '@/ui/components/common/SearchBar';

<SearchBar
  value={searchTerm}
  onChange={(value) => setSearchTerm(value)}
  placeholder="搜索候选人..."
  onClear={() => setSearchTerm('')}
/>
\`\`\`

#### Dropdown - 下拉菜单组件
\`\`\`tsx
import { Dropdown } from '@/ui/components/common/Dropdown';

<Dropdown
  trigger={<Button>操作</Button>}
  items={[
    { label: '编辑', onClick: handleEdit },
    { label: '删除', onClick: handleDelete, danger: true },
  ]}
/>
\`\`\`

#### Tooltip - 工具提示组件
\`\`\`tsx
import { Tooltip } from '@/ui/components/common/Tooltip';

<Tooltip content="这是提示信息" position="top">
  <button>悬停查看</button>
</Tooltip>
\`\`\`

**位置**: \`top\` | \`right\` | \`bottom\` | \`left\`

#### Tabs - 标签页组件

**方式一：数据驱动 (推荐)**
\`\`\`tsx
import { Tabs } from '@/ui/components/common/Tabs';

<Tabs
  tabs={[
    { id: 'tab1', label: '基本信息', content: <div>内容1</div> },
    { id: 'tab2', label: '工作经历', content: <div>内容2</div> },
  ]}
  defaultTab="tab1"
/>
\`\`\`

**方式二：组合式**
\`\`\`tsx
import { TabList, Tab, TabPanel, TabPanels } from '@/ui/components/common/TabsPrimitives';

<TabList>
  <Tab id="tab1">基本信息</Tab>
  <Tab id="tab2">工作经历</Tab>
</TabList>
<TabPanels>
  <TabPanel id="tab1">内容1</TabPanel>
  <TabPanel id="tab2">内容2</TabPanel>
</TabPanels>
\`\`\`

### 错误处理

#### ErrorBoundary - 错误边界组件
\`\`\`tsx
import { ErrorBoundary } from '@/ui/components/common/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
\`\`\`

## 🛠️ 工具函数

### cn() - Tailwind CSS 类名合并
\`\`\`tsx
import { cn } from '@/lib/utils/cn';

// 合并类名，后面的会覆盖前面的
const className = cn(
  'px-4 py-2',
  isActive && 'bg-blue-500',
  'hover:bg-blue-600'
);
\`\`\`

### 格式化工具
\`\`\`tsx
import { formatDate, formatNumber, formatCurrency } from '@/lib/utils/format';

// 日期格式化
formatDate(new Date(), 'YYYY-MM-DD'); // 2025-01-17
formatDate(new Date(), 'YYYY年MM月DD日'); // 2025年01月17日

// 数字格式化
formatNumber(1234567.89); // 1,234,567.89

// 货币格式化
formatCurrency(12345); // ¥12,345.00
\`\`\`

## 🎨 样式系统

### 全局样式
- 位于 \`src/index.css\`
- 基于 TailwindCSS
- 包含自定义颜色、字体、间距配置

### TailwindCSS 配置
- 配置文件: \`tailwind.config.js\`
- 内容路径: \`src/**/*.{js,ts,jsx,tsx}\`
- 已集成 \`@tailwindcss/forms\` 插件

### 主题颜色
\`\`\`css
/* 主色调 */
--color-primary: #3b82f6; /* blue-500 */

/* 成功 */
--color-success: #10b981; /* green-500 */

/* 警告 */
--color-warning: #f59e0b; /* amber-500 */

/* 危险 */
--color-danger: #ef4444; /* red-500 */

/* 中性色 */
--color-gray-50 到 --color-gray-900
\`\`\`

## 📦 技术栈

- **框架**: React 19
- **语言**: TypeScript
- **样式**: TailwindCSS
- **构建工具**: Vite
- **包管理**: npm

## 🚀 开发命令

\`\`\`bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 类型检查
npm run type-check

# Lint 检查
npm run lint
\`\`\`

## 📂 当前目录结构

\`\`\`
frontend/
├── src/
│   ├── ui/
│   │   └── components/
│   │       └── common/          # 基础组件库 (16个组件)
│   │           ├── Button.tsx
│   │           ├── Input.tsx
│   │           ├── Modal.tsx
│   │           ├── Table.tsx
│   │           ├── TablePrimitives.tsx
│   │           ├── Card.tsx
│   │           ├── Badge.tsx
│   │           ├── Loading.tsx
│   │           ├── Toast.tsx
│   │           ├── Alert.tsx
│   │           ├── EmptyState.tsx
│   │           ├── Pagination.tsx
│   │           ├── SearchBar.tsx
│   │           ├── Dropdown.tsx
│   │           ├── Tooltip.tsx
│   │           ├── Tabs.tsx
│   │           ├── TabsPrimitives.tsx
│   │           └── ErrorBoundary.tsx
│   ├── lib/
│   │   └── utils/               # 工具函数
│   │       ├── cn.ts            # 类名合并工具
│   │       └── format.ts        # 格式化工具
│   ├── index.css                # 全局样式
│   ├── App.tsx                  # 应用入口 (占位页面)
│   ├── main.tsx                 # 渲染入口
│   └── vite-env.d.ts            # Vite 类型定义
├── public/                      # 静态资源
├── .env                         # 环境变量
├── .env.example                 # 环境变量示例
├── package.json                 # 依赖配置
├── tsconfig.json                # TypeScript 配置
├── tailwind.config.js           # TailwindCSS 配置
├── vite.config.ts               # Vite 配置
└── README.md                    # 本文档
\`\`\`

## 🔧 环境变量

创建 \`.env\` 文件并配置以下变量:

\`\`\`bash
# Supabase 配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 阿里云 OSS 配置
VITE_OSS_REGION=oss-cn-shanghai
VITE_OSS_BUCKET=your-bucket-name
\`\`\`

## 📋 下一步计划

### 架构设计阶段
1. **技术选型**
   - [ ] 状态管理: React Query? Zustand? Context?
   - [ ] 路由管理: React Router? TanStack Router?
   - [ ] 表单处理: React Hook Form? Formik?
   - [ ] API 客户端: Supabase Client? Axios?

2. **架构设计**
   - [ ] 目录结构规划
   - [ ] 数据流设计
   - [ ] 组件分层策略
   - [ ] 类型定义策略

3. **基础设施**
   - [ ] 路由配置
   - [ ] API 客户端封装
   - [ ] 数据转换层 (snake_case ↔ camelCase)
   - [ ] 错误处理机制
   - [ ] Loading 状态管理

### 开发阶段
1. **核心页面**
   - [ ] Dashboard 页面
   - [ ] 候选人列表页
   - [ ] 候选人详情页
   - [ ] 职位列表页
   - [ ] 职位详情页

2. **业务功能**
   - [ ] 简历上传
   - [ ] 智能筛选
   - [ ] 面试评价
   - [ ] 候选人时间线

## 🎯 设计原则

在重新开发前端时，请遵循以下原则:

1. **组件复用**: 优先使用现有的基础组件库
2. **类型安全**: 所有组件和函数必须有完整的 TypeScript 类型
3. **无障碍性**: 必须符合 WCAG 2.1 AA 标准
4. **响应式**: 支持移动端、平板、桌面端
5. **性能优化**: 懒加载、虚拟滚动、代码分割
6. **可测试性**: 便于编写单元测试和E2E测试

## 📚 相关文档

- [前端任务计划](../docs/frontend_task_plan.md) - 前端开发任务、进度和状态跟踪
- [后端任务计划](../docs/backend_task_plan.md) - 后端开发任务、进度和状态跟踪
- [产品需求文档](../docs/ai_resume_prd.md) - 完整产品规格说明
- [开发规范](../docs/rule.md) - 编码标准、工具和约定

---

**最后更新**: 2025-01-17 (前端重置)  
**当前状态**: 等待架构设计  
**负责人**: AI Resume Team
