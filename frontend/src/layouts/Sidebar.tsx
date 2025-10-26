/**
 * Sidebar Component
 * 应用侧边栏导航
 */

import { NavLink } from 'react-router-dom'
import { Users, Briefcase } from 'lucide-react'

const navigation = [
  { name: '人才库', href: '/candidates', icon: Users },
  { name: '职位管理', href: '/positions', icon: Briefcase },
]

export default function Sidebar() {
  return (
    <div className="w-64 bg-gradient-to-b from-orange-500 to-orange-600 text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-orange-400/30">
        <h1 className="text-2xl font-bold">AI 简历筛选</h1>
        <p className="text-orange-100 text-sm mt-1">智能人才管理系统</p>
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
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-orange-400/30">
        <div className="text-xs text-orange-100">
          <p>© 2025 AI Resume System</p>
          <p className="mt-1">Version 1.0.0</p>
        </div>
      </div>
    </div>
  )
}
