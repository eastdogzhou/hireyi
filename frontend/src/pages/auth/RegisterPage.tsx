/**
 * Register Page
 * 注册页面
 */

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../ui/components/common/Button'
import { Input } from '../../ui/components/common/Input'
import { Alert } from '../../ui/components/common/Alert'

export default function RegisterPage() {
  const { register, isLoading: authLoading } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * 密码强度验证
   */
  const validatePasswordStrength = (password: string): string | null => {
    if (password.length < 8) {
      return '密码至少需要 8 个字符'
    }
    if (!/[A-Z]/.test(password)) {
      return '密码必须包含至少一个大写字母'
    }
    if (!/[a-z]/.test(password)) {
      return '密码必须包含至少一个小写字母'
    }
    if (!/[0-9]/.test(password)) {
      return '密码必须包含至少一个数字'
    }
    return null
  }

  /**
   * 表单验证
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // 验证姓名
    if (!formData.name.trim()) {
      newErrors.name = '请输入姓名'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '姓名至少需要 2 个字符'
    }

    // 验证邮箱
    if (!formData.email) {
      newErrors.email = '请输入邮箱'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址'
    }

    // 验证密码
    if (!formData.password) {
      newErrors.password = '请输入密码'
    } else {
      const passwordError = validatePasswordStrength(formData.password)
      if (passwordError) {
        newErrors.password = passwordError
      }
    }

    // 验证确认密码
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
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
      await register({
        name: formData.name.trim(),
        email: formData.email,
        password: formData.password,
      })
      // 注册成功后，AuthContext 会自动导航到相应页面
    } catch (error: any) {
      console.error('Registration error:', error)

      // 处理不同的错误类型
      if (error.response?.status === 400) {
        if (error.response.data?.detail?.includes('already registered')) {
          setSubmitError('该邮箱已被注册')
        } else if (error.response.data?.detail?.includes('invalid')) {
          setSubmitError('邮箱格式无效')
        } else {
          setSubmitError(error.response.data?.detail || '注册失败')
        }
      } else if (error.response?.data?.detail) {
        setSubmitError(error.response.data.detail)
      } else {
        setSubmitError('注册失败，请稍后重试')
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

    // 实时验证确认密码
    if (name === 'password' && formData.confirmPassword) {
      if (value !== formData.confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: '两次输入的密码不一致',
        }))
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.confirmPassword
          return newErrors
        })
      }
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
            创建您的新账户
          </p>
        </div>

        {/* 注册表单 */}
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

            {/* 姓名输入 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                姓名
              </label>
              <div className="mt-1">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  state={errors.name ? "error" : "default"}
                  errorMessage={errors.name}
                  placeholder="请输入您的姓名"
                  className="w-full"
                />
              </div>
            </div>

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
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  state={errors.password ? "error" : "default"}
                  errorMessage={errors.password}
                  placeholder="••••••••"
                  className="w-full"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                密码必须至少 8 个字符，包含大小写字母和数字
              </p>
            </div>

            {/* 确认密码输入 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                确认密码
              </label>
              <div className="mt-1">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  state={errors.confirmPassword ? "error" : "default"}
                  errorMessage={errors.confirmPassword}
                  placeholder="••••••••"
                  className="w-full"
                />
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
                {isSubmitting ? '注册中...' : '注册'}
              </Button>
            </div>
          </form>

          {/* 登录链接 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">已有账户？</span>
              </div>
            </div>

            <div className="mt-6">
              <Link to="/login">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  fullWidth
                >
                  返回登录
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 页脚 */}
        <div className="text-center text-sm text-gray-500">
          <p>注册即表示您同意我们的</p>
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
