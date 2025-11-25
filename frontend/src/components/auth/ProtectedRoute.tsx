/**
 * Protected Route Component
 * 路由保护组件 - 确保只有已认证的用户才能访问受保护的页面
 */

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireOrg?: boolean // 是否要求用户必须属于组织
}

/**
 * ProtectedRoute 组件
 *
 * 功能：
 * 1. 检查用户是否已登录
 * 2. 如果未登录，重定向到登录页面
 * 3. 如果 requireOrg=true，检查用户是否属于组织
 * 4. 如果用户已登录但没有组织，重定向到组织引导页面
 */
export function ProtectedRoute({ children, requireOrg = true }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, currentUser } = useAuth()
  const location = useLocation()

  // 加载中状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  // 未登录，重定向到登录页面
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 需要组织但用户没有组织，重定向到组织引导页面
  if (requireOrg && !currentUser?.org_id) {
    return <Navigate to="/onboarding" replace />
  }

  // 已认证且满足组织要求，渲染受保护的内容
  return <>{children}</>
}
