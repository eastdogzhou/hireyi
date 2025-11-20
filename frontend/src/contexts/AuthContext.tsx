/**
 * Authentication Context
 * 认证上下文 - 全局认证状态管理
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  authService,
  type RegisterRequest,
  type LoginRequest,
  type AuthResponse,
  type CurrentUser,
} from '../services/auth.service'
import { organizationService } from '../services/organization.service'
import type { OrganizationWithRole } from '@/types'

/**
 * 认证上下文类型
 */
interface AuthContextType {
  // 认证状态
  user: AuthResponse['user'] | null
  currentUser: CurrentUser | null
  isAuthenticated: boolean
  isLoading: boolean

  // 组织状态
  organizations: OrganizationWithRole[]
  currentOrg: OrganizationWithRole | null

  // 认证操作
  register: (data: RegisterRequest) => Promise<void>
  login: (data: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>

  // 组织操作
  switchOrganization: (orgId: string) => void
  refreshOrganizations: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * 认证 Provider 组件
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [organizations, setOrganizations] = useState<OrganizationWithRole[]>([])
  const [currentOrg, setCurrentOrg] = useState<OrganizationWithRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()

  /**
   * 刷新用户信息
   */
  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.getCurrentUser()
      setCurrentUser(userData)

      // 同步更新 localStorage 中的用户信息（特别是 current_org_id）
      const storedUser = authService.getStoredUser()
      if (storedUser) {
        // 如果 current_org_id 发生变化，更新 localStorage
        if (userData.org_id !== storedUser.current_org_id) {
          const updatedUser = {
            ...storedUser,
            current_org_id: userData.org_id,
          }
          localStorage.setItem('user', JSON.stringify(updatedUser))
          setUser(updatedUser)
          console.log('Updated user current_org_id in localStorage:', userData.org_id)
        } else {
          setUser(storedUser)
        }
      }

      // 验证成功，设置为已认证
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      // 如果获取用户信息失败，清除所有认证状态
      // 注意：localStorage 已在 axios 拦截器中清除
      setUser(null)
      setCurrentUser(null)
      setOrganizations([])
      setCurrentOrg(null)
      setIsAuthenticated(false) // 设置为未认证
      throw error // 重新抛出错误，让调用方知道失败了
    }
  }, [])

  /**
   * 刷新组织列表
   */
  const refreshOrganizations = useCallback(async () => {
    try {
      const orgs = await organizationService.getUserOrganizations()
      setOrganizations(orgs)

      // 如果用户有当前组织，设置为当前组织
      if (currentUser?.org_id) {
        const org = orgs.find((o) => o.id === currentUser.org_id)
        if (org) {
          setCurrentOrg(org)
        }
      } else if (orgs.length > 0) {
        // 如果没有当前组织但有可用组织，选择第一个
        setCurrentOrg(orgs[0])
      }
    } catch (error) {
      console.error('Failed to refresh organizations:', error)
    }
  }, [currentUser?.org_id])

  /**
   * 初始化认证状态
   */
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)

      if (authService.isAuthenticated()) {
        // 从本地存储恢复用户信息（用于显示）
        const storedUser = authService.getStoredUser()
        if (storedUser) {
          setUser(storedUser)
        }

        // 从服务器验证 token 并获取最新的用户信息
        try {
          await refreshUser()
          await refreshOrganizations()
        } catch (error) {
          console.error('Failed to initialize auth:', error)
          // Token 验证失败（401），状态已在 refreshUser 中清除
          // 此时 isAuthenticated() 会返回 false（因为 localStorage 已清除）
          // ProtectedRoute 会重定向到登录页面
        }
      }

      setIsLoading(false)
    }

    initAuth()
  }, [refreshUser, refreshOrganizations])

  /**
   * 用户注册
   */
  const register = async (data: RegisterRequest) => {
    try {
      const response = await authService.register(data)
      setUser(response.user)
      setIsAuthenticated(true)

      // 获取完整的用户信息
      await refreshUser()
      await refreshOrganizations()

      // 注册成功后跳转
      if (response.user.current_org_id) {
        // 如果已有组织，跳转到首页
        navigate('/')
      } else {
        // 如果没有组织，跳转到组织创建/加入页面
        navigate('/onboarding')
      }
    } catch (error) {
      console.error('Registration failed:', error)
      setIsAuthenticated(false)
      throw error
    }
  }

  /**
   * 用户登录
   */
  const login = async (data: LoginRequest) => {
    try {
      const response = await authService.login(data)
      setUser(response.user)
      setIsAuthenticated(true)

      // 获取完整的用户信息
      await refreshUser()
      await refreshOrganizations()

      // 登录成功后跳转
      if (response.user.current_org_id) {
        // 如果已有组织，跳转到首页
        navigate('/')
      } else {
        // 如果没有组织，跳转到组织创建/加入页面
        navigate('/onboarding')
      }
    } catch (error) {
      console.error('Login failed:', error)
      setIsAuthenticated(false)
      throw error
    }
  }

  /**
   * 用户登出
   */
  const logout = async () => {
    try {
      await authService.logout()
    } finally {
      setUser(null)
      setCurrentUser(null)
      setOrganizations([])
      setCurrentOrg(null)
      setIsAuthenticated(false)
      navigate('/login')
    }
  }

  /**
   * 切换当前组织
   */
  const switchOrganization = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId)
    if (org) {
      setCurrentOrg(org)
      // TODO: 调用后端 API 更新用户的 current_org_id
    }
  }

  const value: AuthContextType = {
    user,
    currentUser,
    isAuthenticated,
    isLoading,
    organizations,
    currentOrg,
    register,
    login,
    logout,
    refreshUser,
    switchOrganization,
    refreshOrganizations,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * 使用认证上下文的 Hook
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
