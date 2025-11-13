/**
 * Sidebar Component
 * 应用侧边栏导航
 */

import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Users, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react'

const navigation = [
  { name: '人才库', href: '/candidates', icon: Users },
  { name: '职位管理', href: '/positions', icon: Briefcase },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-orange-500 to-orange-600 text-white flex flex-col transition-all duration-300`}>
      {/* Logo */}
      <div className="px-4 py-6 border-b border-orange-400/30 flex items-center justify-between">
        {!collapsed && (
          <div>
            <h1 className="text-2xl font-bold">AI 简历筛选</h1>
            <p className="text-orange-100 text-sm mt-1">智能人才管理系统</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-2 hover:bg-orange-600 rounded-lg transition-colors ${collapsed ? 'mx-auto' : ''}`}
          title={collapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map(item => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-white/20 text-white font-medium shadow-sm'
                  : 'text-orange-100 hover:bg-white/10 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? item.name : undefined}
          >
            <item.icon className="w-5 h-5" />
            {!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-6 py-4 border-t border-orange-400/30">
          <div className="text-xs text-orange-100">
            <p>© 2025 AI Resume System</p>
            <p className="mt-1">Version 1.0.0</p>
          </div>
        </div>
      )}
    </div>
  )
}
