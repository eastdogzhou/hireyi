/**
 * App Component
 * 前端应用主入口 - 准备重构
 */

import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          AI Resume Scanning System
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          前端正在重构中...
        </p>
        <div className="bg-white rounded-lg shadow-md p-6 text-left">
          <h2 className="text-2xl font-semibold mb-4">可用的基础组件库：</h2>
          <ul className="space-y-2 text-gray-700">
            <li>✅ Button - 按钮组件</li>
            <li>✅ Input - 输入框组件</li>
            <li>✅ Modal - 模态框组件</li>
            <li>✅ Table - 表格组件</li>
            <li>✅ Card - 卡片组件</li>
            <li>✅ Badge - 徽章组件</li>
            <li>✅ Loading - 加载组件</li>
            <li>✅ Toast - 提示组件</li>
            <li>✅ Alert - 警告组件</li>
            <li>✅ EmptyState - 空状态组件</li>
            <li>✅ Pagination - 分页组件</li>
            <li>✅ SearchBar - 搜索栏组件</li>
            <li>✅ Dropdown - 下拉菜单组件</li>
            <li>✅ Tooltip - 工具提示组件</li>
            <li>✅ Tabs - 标签页组件</li>
            <li>✅ ErrorBoundary - 错误边界组件</li>
          </ul>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              所有组件位于: <code className="bg-gray-100 px-2 py-1 rounded">src/ui/components/common/</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
