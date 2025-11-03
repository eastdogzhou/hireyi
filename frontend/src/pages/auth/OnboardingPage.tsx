/**
 * Onboarding Page
 * 组织引导页面 - 新用户创建或加入组织
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { organizationService } from '../../services/organization.service'
import { Button } from '../../ui/components/common/Button'
import { Input } from '../../ui/components/common/Input'
import { Alert } from '../../ui/components/common/Alert'
import { Card } from '../../ui/components/common/Card'

type OnboardingMode = 'select' | 'create' | 'join'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { refreshOrganizations, refreshUser } = useAuth()

  const [mode, setMode] = useState<OnboardingMode>('select')
  const [createData, setCreateData] = useState({ name: '' })
  const [joinData, setJoinData] = useState({ orgCode: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * 验证创建组织表单
   */
  const validateCreateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!createData.name.trim()) {
      newErrors.name = '请输入组织名称'
    } else if (createData.name.trim().length < 2) {
      newErrors.name = '组织名称至少需要 2 个字符'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * 验证加入组织表单
   */
  const validateJoinForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!joinData.orgCode.trim()) {
      newErrors.orgCode = '请输入组织代码'
    } else if (joinData.orgCode.trim().length !== 6) {
      newErrors.orgCode = '组织代码应为 6 位字符'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * 处理创建组织
   */
  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')

    if (!validateCreateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await organizationService.createOrganization({
        name: createData.name.trim(),
      })

      // 刷新用户信息和组织列表
      await refreshUser()
      await refreshOrganizations()

      // 跳转到主页
      navigate('/')
    } catch (error: any) {
      console.error('Create organization error:', error)

      if (error.response?.data?.detail) {
        setSubmitError(error.response.data.detail)
      } else {
        setSubmitError('创建组织失败，请稍后重试')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * 处理加入组织
   */
  const handleJoinOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')

    if (!validateJoinForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await organizationService.joinOrganization({
        org_code: joinData.orgCode.trim().toUpperCase(),
      })

      // 刷新用户信息和组织列表
      await refreshUser()
      await refreshOrganizations()

      // 跳转到主页
      navigate('/')
    } catch (error: any) {
      console.error('Join organization error:', error)

      if (error.response?.status === 404) {
        setSubmitError('组织代码不存在，请检查后重试')
      } else if (error.response?.status === 400) {
        setSubmitError(error.response.data?.detail || '无法加入该组织')
      } else if (error.response?.data?.detail) {
        setSubmitError(error.response.data.detail)
      } else {
        setSubmitError('加入组织失败，请稍后重试')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * 处理输入变化
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, formType: 'create' | 'join') => {
    const { name, value } = e.target

    if (formType === 'create') {
      setCreateData((prev) => ({ ...prev, [name]: value }))
    } else {
      setJoinData((prev) => ({ ...prev, [name]: value }))
    }

    // 清除对应字段的错误
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Logo 和标题 */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            欢迎加入 hireyi
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            创建新组织或加入现有组织以开始使用
          </p>
        </div>

        {/* 错误提示 */}
        {submitError && (
          <Alert variant="error" onClose={() => setSubmitError('')}>
            {submitError}
          </Alert>
        )}

        {/* 选择模式 */}
        {mode === 'select' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 创建组织卡片 */}
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setMode('create')}>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">创建新组织</h3>
                <p className="text-gray-600 text-sm">
                  创建一个新的组织，您将成为管理员
                </p>
              </div>
            </Card>

            {/* 加入组织卡片 */}
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setMode('join')}>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">加入现有组织</h3>
                <p className="text-gray-600 text-sm">
                  使用组织代码加入已有的组织
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* 创建组织表单 */}
        {mode === 'create' && (
          <Card className="p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900">创建新组织</h3>
              <p className="mt-2 text-sm text-gray-600">
                创建后您将获得一个唯一的组织代码，可分享给团队成员
              </p>
            </div>

            <form onSubmit={handleCreateOrganization} className="space-y-6">
              <div>
                <Input
                  label="组织名称"
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={createData.name}
                  onChange={(e) => handleChange(e, 'create')}
                  state={errors.name ? 'error' : 'default'}
                  errorMessage={errors.name}
                  placeholder="例如：科技有限公司"
                  helperText="组织名称将显示给所有成员"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setMode('select')
                    setCreateData({ name: '' })
                    setErrors({})
                    setSubmitError('')
                  }}
                  disabled={isSubmitting}
                >
                  返回
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '创建中...' : '创建组织'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* 加入组织表单 */}
        {mode === 'join' && (
          <Card className="p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900">加入现有组织</h3>
              <p className="mt-2 text-sm text-gray-600">
                输入组织管理员提供的 6 位组织代码
              </p>
            </div>

            <form onSubmit={handleJoinOrganization} className="space-y-6">
              <div>
                <Input
                  label="组织代码"
                  id="orgCode"
                  name="orgCode"
                  type="text"
                  required
                  value={joinData.orgCode}
                  onChange={(e) => handleChange(e, 'join')}
                  state={errors.orgCode ? 'error' : 'default'}
                  errorMessage={errors.orgCode}
                  placeholder="例如：ABC123"
                  helperText="组织代码不区分大小写"
                  maxLength={6}
                  className="uppercase"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setMode('select')
                    setJoinData({ orgCode: '' })
                    setErrors({})
                    setSubmitError('')
                  }}
                  disabled={isSubmitting}
                >
                  返回
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '加入中...' : '加入组织'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* 页脚提示 */}
        <div className="text-center text-sm text-gray-500">
          <p>创建或加入组织后，您将能够访问候选人管理、职位管理等功能</p>
        </div>
      </div>
    </div>
  )
}
