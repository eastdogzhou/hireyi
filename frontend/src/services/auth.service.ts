/**
 * Authentication Service
 * 认证服务 - 封装所有认证相关的 API 调用
 */

import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// 配置 axios 实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：自动添加 Authorization header
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：处理 401 错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期或无效，清除本地存储
      // 注意：不在这里重定向，让调用方（AuthContext）处理重定向
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      localStorage.removeItem('token_expires_at')
    }
    return Promise.reject(error)
  }
)

/**
 * 用户注册请求
 */
export interface RegisterRequest {
  email: string
  password: string
  name: string
  org_id?: string
}

/**
 * 用户登录请求
 */
export interface LoginRequest {
  email: string
  password: string
}

/**
 * 认证响应
 */
export interface AuthResponse {
  token: {
    access_token: string
    token_type: string
    expires_in: number
    refresh_token: string | null
  }
  user: {
    id: string
    email: string
    name: string
    current_org_id: string | null
    created_at: string
  }
}

/**
 * 当前用户信息
 */
export interface CurrentUser {
  user_id: string
  email: string
  name: string
  org_id: string | null
  org_role: 'admin' | 'member' | null
  is_admin: boolean
}

/**
 * 密码重置请求
 */
export interface ResetPasswordRequest {
  email: string
}

/**
 * 认证服务类
 */
class AuthService {
  /**
   * 用户注册
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', data)

    // 注册成功后保存 token 和用户信息
    if (response.data.token) {
      this.saveAuthData(response.data)
    }

    return response.data
  }

  /**
   * 用户登录
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', data)

    // 登录成功后保存 token 和用户信息
    if (response.data.token) {
      this.saveAuthData(response.data)
    }

    return response.data
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<CurrentUser> {
    const response = await apiClient.get<CurrentUser>('/api/auth/me')
    return response.data
  }

  /**
   * 退出登录
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout')
    } finally {
      // 无论请求是否成功，都清除本地存储
      this.clearAuthData()
    }
  }

  /**
   * 请求密码重置
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await apiClient.post('/api/auth/reset-password', data)
  }

  /**
   * 保存认证数据到本地存储
   */
  private saveAuthData(authResponse: AuthResponse): void {
    localStorage.setItem('auth_token', authResponse.token.access_token)
    localStorage.setItem('user', JSON.stringify(authResponse.user))

    // 保存 token 过期时间
    const expiresAt = Date.now() + authResponse.token.expires_in * 1000
    localStorage.setItem('token_expires_at', expiresAt.toString())
  }

  /**
   * 清除认证数据
   */
  private clearAuthData(): void {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    localStorage.removeItem('token_expires_at')
  }

  /**
   * 检查是否已登录
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token')
    const expiresAt = localStorage.getItem('token_expires_at')

    if (!token || !expiresAt) {
      return false
    }

    // 检查 token 是否过期
    const now = Date.now()
    if (now >= parseInt(expiresAt)) {
      this.clearAuthData()
      return false
    }

    return true
  }

  /**
   * 获取本地存储的用户信息
   */
  getStoredUser(): AuthResponse['user'] | null {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null

    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }

  /**
   * 获取认证 token
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token')
  }
}

// 导出单例实例
export const authService = new AuthService()

// 导出 axios 实例供其他服务使用
export { apiClient }
