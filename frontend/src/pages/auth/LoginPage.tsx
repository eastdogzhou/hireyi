/**
 * Login Page
 * 登录页面
 */

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../ui/components/common/Button'
import { Input } from '../../ui/components/common/Input'
import { Alert } from '../../ui/components/common/Alert'

export function LoginPage() {
  const { login, isLoading: authLoading } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * 表单验证
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // 验证邮箱
    if (!formData.email) {
      newErrors.email = '请输入邮箱'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址'
    }

    // 验证密码
    if (!formData.password) {
      newErrors.password = '请输入密码'
    } else if (formData.password.length < 8) {
      newErrors.password = '密码至少需要 8 个字符'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await login(formData)
      // 登录成功后，AuthContext 会自动导航到相应页面
    } catch (error: any) {
      console.error('Login error:', error)

      // 处理不同的错误类型
      if (error.response?.data?.detail) {
        // 优先显示后端返回的详细错误信息
        const detail = error.response.data.detail

        // 将英文错误信息转换为中文
        if (detail.includes('Email not confirmed')) {
          setSubmitError('邮箱未验证。请检查您的邮箱并点击验证链接，或联系管理员。')
        } else if (detail.includes('Invalid email or password')) {
          setSubmitError('邮箱或密码错误')
        } else {
          setSubmitError(detail)
        }
      } else if (error.response?.status === 401) {
        setSubmitError('邮箱或密码错误')
      } else {
        setSubmitError('登录失败，请稍后重试')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * 处理输入变化
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // 清除对应字段的错误
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo 和标题 */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/logo.png"
              alt="hireyi"
              className="h-16 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            hireyi
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            登录您的账户
          </p>
        </div>

        {/* 登录表单 */}
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 错误提示 */}
            {submitError && (
              <Alert
                variant="error"
                onClose={() => setSubmitError('')}
              >
                {submitError}
              </Alert>
            )}

            {/* 邮箱输入 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                邮箱地址
              </label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  state={errors.email ? "error" : "default"}
                  errorMessage={errors.email}
                  placeholder="your@email.com"
                  className="w-full"
                />
              </div>
            </div>

            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  state={errors.password ? "error" : "default"}
                  errorMessage={errors.password}
                  placeholder="••••••••"
                  className="w-full"
                />
              </div>
            </div>

            {/* 记住我 & 忘记密码 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  记住我
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  忘记密码？
                </Link>
              </div>
            </div>

            {/* 提交按钮 */}
            <div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? '登录中...' : '登录'}
              </Button>
            </div>
          </form>

          {/* 注册链接 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">还没有账户？</span>
              </div>
            </div>

            <div className="mt-6">
              <Link to="/register">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  fullWidth
                >
                  注册新账户
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 页脚 */}
        <div className="text-center text-sm text-gray-500">
          <p>登录即表示您同意我们的</p>
          <p className="mt-1">
            <Link to="/terms" className="text-blue-600 hover:text-blue-500">
              服务条款
            </Link>
            {' 和 '}
            <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
              隐私政策
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
