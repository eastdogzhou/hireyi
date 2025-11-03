/**
 * Collapsible Sidebar Navigation
 * 可收缩侧边栏导航
 */

import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  Users,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Building2,
  Shield,
} from 'lucide-react'

interface NavItem {
  name: string
  path: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    name: '人才库',
    path: '/candidates',
    icon: <Users className="w-5 h-5" />,
  },
  {
    name: '职位',
    path: '/positions',
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    name: '组织管理',
    path: '/organizations/members',
    icon: <Shield className="w-5 h-5" />,
  },
]

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { user, organizations, logout } = useAuth()
  const navigate = useNavigate()

  const currentOrg = organizations?.[0]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full bg-gradient-to-b from-orange-500 to-orange-600 text-white
        transition-all duration-300 ease-in-out z-50 shadow-xl
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Header / Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-orange-400">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="hireyi"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                // Fallback to icon if logo not found
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
            />
            <Building2 className="w-6 h-6 hidden" />
            <h1 className="text-lg font-bold">hireyi</h1>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-orange-600 rounded-lg transition-colors ml-auto"
          title={collapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `
              flex items-center gap-3 px-4 py-3 mx-2 rounded-lg
              transition-colors duration-200
              ${
                isActive
                  ? 'bg-orange-600 text-white'
                  : 'text-orange-50 hover:bg-orange-600 hover:text-white'
              }
              ${collapsed ? 'justify-center' : ''}
            `
            }
            title={collapsed ? item.name : undefined}
          >
            {item.icon}
            {!collapsed && <span className="font-medium">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section: Organization & User Info */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-orange-400">
        {/* Organization Info */}
        {currentOrg && !collapsed && (
          <div className="px-4 py-3 border-b border-orange-400">
            <div className="text-xs text-orange-200 mb-1">当前组织</div>
            <div className="font-medium text-sm truncate">{currentOrg.name}</div>
            <div className="text-xs text-orange-200 mt-1">
              代码: {currentOrg.org_code}
            </div>
          </div>
        )}

        {/* User Info */}
        <div className="px-4 py-3 border-b border-orange-400">
          <div className="flex items-center gap-3">
            <div
              className={`
              flex-shrink-0 w-10 h-10 rounded-full bg-orange-700 flex items-center justify-center
              ${collapsed ? 'mx-auto' : ''}
            `}
            >
              <User className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{user?.name}</div>
                <div className="text-xs text-orange-200 truncate">
                  {user?.email}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center gap-3 px-4 py-3
            hover:bg-orange-600 transition-colors
            ${collapsed ? 'justify-center' : ''}
          `}
          title={collapsed ? '退出登录' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="font-medium">退出登录</span>}
        </button>
      </div>
    </aside>
  )
}
