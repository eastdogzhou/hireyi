/**
 * Position Detail Page
 * 职位详情页 - 展示职位信息和关联候选人
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { usePosition, usePositionCandidates, positionKeys } from '@/hooks/api'
import type { PositionCandidateListParams } from '@/types'
import {
  Card,
  Button,
  Badge,
  LoadingSpinner,
  EmptyState,
  TabsOld as Tabs,
  SearchBar,
  SelectDropdown,
} from '@/ui/components/common'
import { UploadResumeModal, SmartScreeningModal } from '@/components/business'
import { formatDate } from '@/lib/utils/format'
import {
  ArrowLeft,
  Edit,
  FileText,
  Briefcase,
  Users,
  TrendingUp,
  Upload,
  Zap,
  UserPlus,
  Calendar,
} from 'lucide-react'

export default function PositionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const positionId = parseInt(id || '0')

  // Search and filter state for candidates
  const [candidateParams, setCandidateParams] = useState<PositionCandidateListParams>({
    page: 1,
    page_size: 20,
    candidate_name: '',
    status: undefined,
    sort_by: 'overall_score_numeric',
    sort_order: 'desc',
  })

  // Modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [screeningModalOpen, setScreeningModalOpen] = useState(false)

  // Fetch position data
  const { data: position, isLoading: positionLoading, error: positionError } = usePosition(positionId)

  // Fetch position candidates
  const {
    data: candidatesData,
    isLoading: candidatesLoading,
    error: candidatesError,
  } = usePositionCandidates(positionId, candidateParams)

  // Handle candidate search
  const handleCandidateSearch = (value: string) => {
    setCandidateParams(prev => ({ ...prev, candidate_name: value, page: 1 }))
  }

  // Handle status filter
  const handleStatusFilter = (value: string | number | (string | number)[]) => {
    const status = value as string
    setCandidateParams(prev => ({
      ...prev,
      status: status || undefined,
      page: 1,
    }))
  }

  // Handle sort change
  const handleSortChange = (value: string | number | (string | number)[]) => {
    const sortBy = value as 'overall_score_numeric' | 'created_at' | 'updated_at'
    setCandidateParams(prev => ({
      ...prev,
      sort_by: sortBy,
      page: 1,
    }))
  }

  // Navigate to candidate detail
  const handleCandidateClick = (candidateId: number) => {
    navigate(`/candidates/${candidateId}`)
  }

  // Handle upload success
  const handleUploadSuccess = () => {
    // Invalidate position candidates query to refresh the list
    queryClient.invalidateQueries({ queryKey: positionKeys.candidates(positionId) })
  }

  // Handle screening success
  const handleScreeningSuccess = () => {
    // Invalidate position candidates query to refresh the list
    queryClient.invalidateQueries({ queryKey: positionKeys.candidates(positionId) })
  }

  // Status options
  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'screening', label: '筛选中' },
    { value: 'interview', label: '面试中' },
    { value: 'offer', label: 'Offer' },
    { value: 'hired', label: '已入职' },
    { value: 'rejected', label: '已拒绝' },
    { value: 'withdrawn', label: '已撤回' },
  ]

  // Sort options
  const sortOptions = [
    { value: 'overall_score_numeric', label: '按匹配度排序' },
    { value: 'created_at', label: '按添加时间排序' },
    { value: 'updated_at', label: '按更新时间排序' },
  ]

  // Get status badge variant
  const getStatusVariant = (status: string): 'success' | 'warning' | 'default' | 'gray' => {
    const variants: Record<string, 'success' | 'warning' | 'default' | 'gray'> = {
      screening: 'default',
      interview: 'warning',
      offer: 'success',
      hired: 'success',
      rejected: 'gray',
      withdrawn: 'gray',
    }
    return variants[status] || 'default'
  }

  // Get status label
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      screening: '筛选中',
      interview: '面试中',
      offer: 'Offer',
      hired: '已入职',
      rejected: '已拒绝',
      withdrawn: '已撤回',
    }
    return labels[status] || status
  }

  // Handle loading state
  if (positionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Handle error state
  if (positionError || !position) {
    return (
      <div className="p-8">
        <EmptyState title="职位不存在" description="未找到该职位信息，请检查链接是否正确" />
        <div className="flex justify-center mt-6">
          <Button variant="secondary" onClick={() => navigate('/positions')}>
            返回职位列表
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/positions')}
        >
          返回
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{position.title}</h1>
          <p className="text-gray-600 mt-1">{position.department}</p>
        </div>
        <Button variant="secondary" icon={<Edit className="w-4 h-4" />}>
          编辑职位
        </Button>
      </div>

      {/* Position Info Card */}
      <Card>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="success" size="lg">
                  招聘中
                </Badge>
                {position.salary_range && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium">{position.salary_range}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  <span>{position.department}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{candidatesData?.total || 0} 候选人</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>发布于 {formatDate(position.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Position Details Tabs */}
          <Tabs
            defaultActiveKey="jd"
            items={[
              {
                key: 'jd',
                label: '职位描述',
                icon: <FileText className="w-4 h-4" />,
                content: (
                  <div className="p-6">
                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">{position.jd || '暂无职位描述'}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: 'requirements',
                label: '任职要求',
                icon: <Briefcase className="w-4 h-4" />,
                content: (
                  <div className="p-6">
                    {position.requirements && position.requirements.length > 0 ? (
                      <div className="space-y-4">
                        {/* Group by category */}
                        {['skill', 'experience', 'education', 'other'].map(category => {
                          const categoryReqs = position.requirements.filter(r => r.category === category)
                          if (categoryReqs.length === 0) return null

                          const categoryLabels: Record<string, string> = {
                            skill: '技能要求',
                            experience: '工作经验',
                            education: '学历要求',
                            other: '其他要求',
                          }

                          return (
                            <div key={category}>
                              <h3 className="font-semibold text-gray-900 mb-2">{categoryLabels[category]}</h3>
                              <ul className="space-y-2">
                                {categoryReqs.map((req, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <span className={`mt-1 ${req.required ? 'text-orange-500' : 'text-gray-400'}`}>
                                      {req.required ? '●' : '○'}
                                    </span>
                                    <span className="text-gray-700">{req.description}</span>
                                    {req.required && (
                                      <Badge variant="warning" size="sm">
                                        必需
                                      </Badge>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <EmptyState title="暂无任职要求" description="该职位尚未添加任职要求" />
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Card>

      {/* Candidate Management Section */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">候选人管理</h2>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              icon={<Upload className="w-4 h-4" />}
              onClick={() => setUploadModalOpen(true)}
            >
              上传简历
            </Button>
            <Button
              variant="primary"
              icon={<Zap className="w-4 h-4" />}
              onClick={() => setScreeningModalOpen(true)}
            >
              智能筛选
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <Card>
          <div className="p-4 flex flex-wrap gap-3">
            <div className="flex-1 min-w-[300px]">
              <SearchBar
                placeholder="搜索候选人姓名..."
                value={candidateParams.candidate_name}
                onChange={handleCandidateSearch}
              />
            </div>
            <div className="w-[150px]">
              <SelectDropdown
                options={statusOptions}
                value={candidateParams.status}
                onChange={handleStatusFilter}
                placeholder="状态筛选"
              />
            </div>
            <div className="w-[180px]">
              <SelectDropdown
                options={sortOptions}
                value={candidateParams.sort_by}
                onChange={handleSortChange}
                placeholder="排序方式"
              />
            </div>
          </div>
        </Card>

        {/* Candidates List */}
        <Card>
          {candidatesLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : candidatesError ? (
            <div className="p-8">
              <EmptyState title="加载失败" description="无法加载候选人列表，请稍后重试" />
            </div>
          ) : !candidatesData || candidatesData.data.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<UserPlus className="w-12 h-12" />}
                title="暂无候选人"
                description="还没有候选人与该职位关联，点击上方按钮开始添加"
              />
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {candidatesData.data.map(match => {
                const { candidate } = match
                if (!candidate) return null

                return (
                  <div
                    key={match.id}
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleCandidateClick(candidate.id)}
                  >
                    <div className="flex items-start gap-6">
                      {/* Match Score Circle */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-20 h-20 rounded-full border-4 border-orange-500 flex items-center justify-center">
                          <span className="text-2xl font-bold text-orange-600">{match.overall_score_numeric}</span>
                        </div>
                        <span className="text-xs text-gray-500 mt-2">匹配度</span>
                        <div className="flex gap-1 mt-1">
                          {[...Array(match.overall_score)].map((_, i) => (
                            <span key={i} className="text-orange-500">
                              ⭐
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Candidate Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
                            {candidate.work_experience && Array.isArray(candidate.work_experience) && candidate.work_experience.length > 0 && (
                              <p className="text-gray-600 mt-1">
                                {candidate.work_experience[0].position} @ {candidate.work_experience[0].company}
                              </p>
                            )}
                          </div>
                          <Badge variant={getStatusVariant(match.current_status)} className="ml-2 flex-shrink-0">
                            {getStatusLabel(match.current_status)}
                          </Badge>
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {candidate.skills.slice(0, 5).map((skill, index) => (
                            <Badge key={index} variant="default" size="sm">
                              {skill}
                            </Badge>
                          ))}
                          {candidate.skills.length > 5 && (
                            <Badge variant="gray" size="sm">
                              +{candidate.skills.length - 5}
                            </Badge>
                          )}
                        </div>

                        {/* Match Details */}
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <span>技能匹配:</span>
                            <div className="flex gap-0.5">
                              {[...Array(match.relevance_score)].map((_, i) => (
                                <span key={i} className="text-orange-500">
                                  ⭐
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>经验匹配:</span>
                            <div className="flex gap-0.5">
                              {[...Array(match.fit_score)].map((_, i) => (
                                <span key={i} className="text-orange-500">
                                  ⭐
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="text-gray-400">|</span>
                          <span>添加于 {formatDate(match.created_at)}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation()
                              handleCandidateClick(candidate.id)
                            }}
                          >
                            查看详情
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation()
                              console.log('Schedule interview')
                            }}
                          >
                            安排面试
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation()
                              console.log('Update status')
                            }}
                          >
                            更新状态
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Summary */}
          {candidatesData && candidatesData.data.length > 0 && (
            <div className="p-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-600">
              <span>共找到 {candidatesData.total} 个候选人</span>
              {candidatesData.total > candidateParams.page_size! && (
                <span>
                  显示 {(candidateParams.page! - 1) * candidateParams.page_size! + 1} -{' '}
                  {Math.min(candidateParams.page! * candidateParams.page_size!, candidatesData.total)} 条
                </span>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Upload Resume Modal */}
      <UploadResumeModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        positionId={positionId}
        onSuccess={handleUploadSuccess}
      />

      {/* Smart Screening Modal */}
      <SmartScreeningModal
        open={screeningModalOpen}
        onClose={() => setScreeningModalOpen(false)}
        positionId={positionId}
        positionTitle={position.title}
        onSuccess={handleScreeningSuccess}
      />
    </div>
  )
}
