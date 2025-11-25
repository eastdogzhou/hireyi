/**
 * RequireRole Component
 * 角色权限守卫组件 - 根据用户角色控制路由访问
 */

import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Alert, Spin } from 'antd'

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
        <Spin size="large" tip="加载中..." />
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
        <Alert
          message="权限不足"
          description="您的账户正在等待审批，暂时无法访问此页面。请联系管理员。"
          type="warning"
          showIcon
        />
      </div>
    )
  }

  // 检查角色权限
  if (!allowedRoles.includes(userRole as any)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Alert
          message="访问受限"
          description="您没有权限访问此页面。如需帮助，请联系组织管理员。"
          type="error"
          showIcon
          action={
            <a href={redirectTo} className="text-blue-600 hover:underline">
              返回首页
            </a>
          }
        />
      </div>
    )
  }

  // 权限验证通过，渲染子组件
  return <>{children}</>
}
