/**
 * RequireRole Component
 * 角色权限守卫组件 - 根据用户角色控制路由访问
 */

import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface RequireRoleProps {
  children: React.ReactNode
  /**
   * 允许访问的角色列表
   * - creator: 组织创建者
   * - admin: 管理员（HR）
   * - interviewer: 面试官
   */
  allowedRoles: ('creator' | 'admin' | 'interviewer')[]
  /**
   * 当权限不足时的重定向路径（默认: /candidates）
   */
  redirectTo?: string
}

/**
 * RequireRole - 基于角色的路由保护组件
 *
 * 使用示例:
 * ```tsx
 * // 只允许 creator 和 admin 访问
 * <RequireRole allowedRoles={['creator', 'admin']}>
 *   <OrganizationSettings />
 * </RequireRole>
 *
 * // 只允许 creator 访问
 * <RequireRole allowedRoles={['creator']}>
 *   <DeleteOrganization />
 * </RequireRole>
 * ```
 */
export default function RequireRole({
  children,
  allowedRoles,
  redirectTo = '/candidates',
}: RequireRoleProps) {
  const { currentUser, isLoading } = useAuth()

  // 加载中状态
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  // 未登录或无组织 - 重定向到登录
  if (!currentUser || !currentUser.org_id) {
    return <Navigate to="/login" replace />
  }

  // 获取用户在当前组织的角色
  const userRole = currentUser.org_role

  // 无角色信息（pending状态或未加入组织）
  if (!userRole || userRole === 'pending') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">权限不足</h3>
              <div className="mt-2 text-sm text-yellow-700">
                您的账户正在等待审批，暂时无法访问此页面。请联系管理员。
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 检查角色权限
  if (!allowedRoles.includes(userRole as any)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">访问受限</h3>
              <div className="mt-2 text-sm text-red-700">
                您没有权限访问此页面。如需帮助，请联系组织管理员。
              </div>
              <div className="mt-4">
                <a href={redirectTo} className="text-sm font-medium text-red-600 hover:text-red-500">
                  返回首页 →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 权限验证通过，渲染子组件
  return <>{children}</>
}
