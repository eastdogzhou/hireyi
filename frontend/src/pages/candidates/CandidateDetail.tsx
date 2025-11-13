/**
 * Candidate Detail Page
 * 候选人详情页 - 展示候选人完整信息
 */

import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useCandidate } from '@/hooks/api'
import { useCandidateExecutionRecords } from '@/hooks/api/useInterviewFeedbacks'
import { EditCandidateModal } from '@/components/business/EditCandidateModal'
import { ExecutionRecordsTimeline } from '@/components/business/ExecutionRecordsTimeline'
import { AddRecordModal } from '@/components/business/AddRecordModal'
import {
  Card,
  Button,
  Badge,
  LoadingSpinner,
  EmptyState,
  TabsOld as Tabs,
} from '@/ui/components/common'
import {
  Mail,
  Phone,
  Download,
  Edit,
  ArrowLeft,
  Briefcase,
  GraduationCap,
  FileText,
  Building,
  Plus,
} from 'lucide-react'

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const candidateId = parseInt(id || '0')
  const positionId = searchParams.get('positionId') ? parseInt(searchParams.get('positionId')!) : undefined

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false)
  // Add record modal state
  const [showAddRecordModal, setShowAddRecordModal] = useState(false)

  // Fetch candidate data
  const { data: candidate, isLoading, error, refetch } = useCandidate(candidateId)

  // Fetch execution records for this candidate (across all positions)
  const {
    data: executionRecordsData,
    isLoading: recordsLoading,
    refetch: refetchRecords,
  } = useCandidateExecutionRecords(
    candidateId,
    undefined, // Get all types of records (interview, ai, status)
    true // enabled
  )

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Handle error state
  if (error || !candidate) {
    return (
      <div className="p-8">
        <EmptyState
          title="候选人不存在"
          description="未找到该候选人信息，请检查链接是否正确"
        />
        <div className="flex justify-center mt-6">
          <Button variant="secondary" onClick={() => navigate('/candidates')}>
            返回候选人列表
          </Button>
        </div>
      </div>
    )
  }

  // Handle edit candidate
  const handleEditCandidate = () => {
    setShowEditModal(true)
  }

  // Handle edit success
  const handleEditSuccess = () => {
    refetch()
    setShowEditModal(false)
  }

  // Helper to parse work experience/education text format
  // Format: Line 1 = time + company/school + position/degree
  //         Line 2 = summary/achievements
  //         Empty line = separator
  const parseTextEntries = (text: string | null | undefined): Array<{ line1: string; line2: string }> => {
    if (!text) return []

    const entries: Array<{ line1: string; line2: string }> = []
    const blocks = text.trim().split('\n\n')  // Split by empty lines

    for (const block of blocks) {
      const lines = block.trim().split('\n')
      if (lines.length >= 2) {
        entries.push({
          line1: lines[0].trim(),
          line2: lines[1].trim(),
        })
      } else if (lines.length === 1 && lines[0].trim()) {
        // Single line entry (fallback)
        entries.push({
          line1: lines[0].trim(),
          line2: '',
        })
      }
    }

    return entries
  }

  // Score display configuration
  const scoreConfig = {
    4: { label: '优秀', variant: 'success' as const, stars: '⭐⭐⭐⭐' },
    3: { label: '良好', variant: 'success' as const, stars: '⭐⭐⭐' },
    2: { label: '一般', variant: 'warning' as const, stars: '⭐⭐' },
    1: { label: '较差', variant: 'default' as const, stars: '⭐' },
  }

  // Handle null/undefined score
  const hasScore = candidate.score !== null && candidate.score !== undefined
  const scoreInfo = hasScore
    ? scoreConfig[candidate.score as keyof typeof scoreConfig] || {
        label: 'N/A',
        variant: 'default' as const,
        stars: '',
      }
    : {
        label: '未评分',
        variant: 'default' as const,
        stars: '',
      }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/candidates')}
        >
          返回
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{candidate.name}</h1>
          <p className="text-gray-600 mt-1">候选人详细信息</p>
        </div>
        <Button
          variant="secondary"
          icon={<Edit className="w-4 h-4" />}
          onClick={handleEditCandidate}
        >
          编辑信息
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <Card>
            <div className="p-6">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-3xl font-bold flex-shrink-0">
                  {candidate.name?.charAt(0) || '?'}
                </div>

                {/* Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{candidate.name}</h2>
                    <p className="text-gray-600 mt-1">
                      {candidate.recent_position && candidate.recent_company
                        ? `${candidate.recent_position} @ ${candidate.recent_company}`
                        : candidate.recent_position || candidate.recent_company || '暂无职位信息'}
                    </p>
                  </div>

                  {/* Contact Info & Basic Stats */}
                  <div className="flex flex-wrap gap-4">
                    {candidate.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{candidate.email}</span>
                      </div>
                    )}
                    {candidate.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{candidate.phone}</span>
                      </div>
                    )}
                    {candidate.years_of_experience !== null && candidate.years_of_experience !== undefined && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Briefcase className="w-4 h-4" />
                        <span>{candidate.years_of_experience}年经验</span>
                      </div>
                    )}
                    {candidate.education_level && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <GraduationCap className="w-4 h-4" />
                        <span>{candidate.education_level}</span>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">技能标签</h3>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills && candidate.skills.length > 0 ? (
                        candidate.skills.map((skill, index) => (
                          <Badge key={index} variant="default" size="md">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500">暂无技能信息</span>
                      )}
                    </div>
                  </div>

                  {/* Highlights */}
                  {candidate.highlights && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">个人亮点</h3>
                      <div className="space-y-2">
                        {(typeof candidate.highlights === 'string'
                          ? candidate.highlights.split('\n').filter(Boolean)
                          : candidate.highlights
                        ).map((highlight: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                            <p className="text-gray-600">{highlight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Detailed Info Tabs */}
          <Card>
            <Tabs
              defaultActiveKey="experience"
              items={[
                {
                  key: 'experience',
                  label: '工作经历',
                  icon: <Briefcase className="w-4 h-4" />,
                  content: (
                    <div className="p-6">
                      {(() => {
                        // Handle both string format (new) and array format (legacy)
                        if (typeof candidate.work_experience === 'string') {
                          const entries = parseTextEntries(candidate.work_experience)
                          if (entries.length > 0) {
                            return (
                              <div className="space-y-6">
                                {entries.map((entry, index) => (
                                  <div key={index} className="relative pl-8 pb-6 border-l-2 border-gray-200 last:border-l-0 last:pb-0">
                                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-orange-500" />
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-gray-900 text-base">{entry.line1}</h4>
                                      {entry.line2 && (
                                        <p className="text-gray-600 text-sm">{entry.line2}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                          }
                        } else if (Array.isArray(candidate.work_experience) && candidate.work_experience.length > 0) {
                          // Legacy array format
                          return (
                            <div className="space-y-6">
                              {candidate.work_experience.map((exp: any, index: number) => (
                                <div key={index} className="relative pl-8 pb-6 border-l-2 border-gray-200 last:border-l-0 last:pb-0">
                                  <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-orange-500" />
                                  <div className="space-y-2">
                                    <div>
                                      <h4 className="font-semibold text-gray-900 text-base">{exp.position || '职位'}</h4>
                                      <p className="text-gray-600 flex items-center gap-2">
                                        <Building className="w-4 h-4" />
                                        {exp.company || '公司'}
                                      </p>
                                      {exp.duration && (
                                        <p className="text-sm text-gray-500 mt-1">{exp.duration}</p>
                                      )}
                                    </div>
                                    {exp.description && (
                                      <p className="text-gray-600 text-sm">{exp.description}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        }

                        return (
                          <EmptyState
                            title="暂无工作经历"
                            description="该候选人尚未添加工作经历信息"
                          />
                        )
                      })()}
                    </div>
                  ),
                },
                {
                  key: 'education',
                  label: '教育背景',
                  icon: <GraduationCap className="w-4 h-4" />,
                  content: (
                    <div className="p-6">
                      {(() => {
                        // Handle both string format (new) and array format (legacy)
                        if (typeof candidate.education_background === 'string') {
                          const entries = parseTextEntries(candidate.education_background)
                          if (entries.length > 0) {
                            return (
                              <div className="space-y-6">
                                {entries.map((entry, index) => (
                                  <div key={index} className="relative pl-8 pb-6 border-l-2 border-gray-200 last:border-l-0 last:pb-0">
                                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-orange-500" />
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-gray-900 text-base">{entry.line1}</h4>
                                      {entry.line2 && (
                                        <p className="text-gray-600 text-sm">{entry.line2}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                          }
                        } else if (Array.isArray(candidate.education_background) && candidate.education_background.length > 0) {
                          // Legacy array format
                          return (
                            <div className="space-y-6">
                              {candidate.education_background.map((edu: any, index: number) => (
                                <div key={index} className="relative pl-8 pb-6 border-l-2 border-gray-200 last:border-l-0 last:pb-0">
                                  <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-orange-500" />
                                  <div className="space-y-2">
                                    <div>
                                      <h4 className="font-semibold text-gray-900 text-base">{edu.school || '学校'}</h4>
                                      <p className="text-gray-600">{edu.degree || '学位'} - {edu.major || '专业'}</p>
                                      {edu.duration && (
                                        <p className="text-sm text-gray-500 mt-1">{edu.duration}</p>
                                      )}
                                    </div>
                                    {edu.gpa && (
                                      <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        }

                        return (
                          <EmptyState
                            title="暂无教育背景"
                            description="该候选人尚未添加教育背景信息"
                          />
                        )
                      })()}
                    </div>
                  ),
                },
                {
                  key: 'interviews',
                  label: '执行记录',
                  icon: <FileText className="w-4 h-4" />,
                  content: (
                    <div className="p-6">
                      {/* Header with Add Button */}
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">执行记录</h3>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Plus className="w-4 h-4" />}
                          onClick={() => setShowAddRecordModal(true)}
                        >
                          添加记录
                        </Button>
                      </div>

                      {/* Timeline */}
                      {recordsLoading ? (
                        <div className="flex justify-center py-12">
                          <LoadingSpinner size="md" />
                        </div>
                      ) : (
                        <ExecutionRecordsTimeline
                          records={executionRecordsData?.data || []}
                        />
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </div>

        {/* Right Column - Sidebar (1/3) */}
        <div className="space-y-6">
          {/* Score Card */}
          <Card>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">综合评分</h3>
              <div className="flex flex-col items-center">
                <div className={`w-24 h-24 rounded-full border-4 ${hasScore ? 'border-orange-500' : 'border-gray-300'} flex items-center justify-center mb-4`}>
                  <span className={`text-3xl font-bold ${hasScore ? 'text-orange-600' : 'text-gray-400'}`}>
                    {hasScore ? candidate.score : '-'}
                  </span>
                </div>
                <Badge variant={scoreInfo.variant} size="lg" className="mb-2">
                  {scoreInfo.label}
                </Badge>
                {hasScore && <span className="text-2xl">{scoreInfo.stars}</span>}
                {!hasScore && <p className="text-sm text-gray-500 text-center mt-2">该候选人尚未评分</p>}
              </div>
            </div>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <div className="p-6 space-y-3">
              <h3 className="text-sm font-medium text-gray-700 mb-4">快速操作</h3>
              <Button
                variant="primary"
                className="w-full"
                icon={<Download className="w-4 h-4" />}
                onClick={() => {
                  if (candidate.resume_file) {
                    window.open(candidate.resume_file, '_blank')
                  }
                }}
              >
                下载简历
              </Button>
              <Button variant="secondary" className="w-full">
                安排面试
              </Button>
              <Button variant="secondary" className="w-full">
                推荐职位
              </Button>
            </div>
          </Card>

          {/* Metadata Card */}
          <Card>
            <div className="p-6 space-y-3">
              <h3 className="text-sm font-medium text-gray-700 mb-4">时间信息</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">创建时间</span>
                  <span className="font-medium text-gray-900">
                    {new Date(candidate.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">更新时间</span>
                  <span className="font-medium text-gray-900">
                    {new Date(candidate.updated_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Candidate Modal */}
      <EditCandidateModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        candidate={candidate}
        onSuccess={handleEditSuccess}
      />

      {/* Add Record Modal */}
      <AddRecordModal
        open={showAddRecordModal}
        onClose={() => setShowAddRecordModal(false)}
        candidateId={candidateId}
        positionId={positionId || undefined}
        onSuccess={() => {
          refetchRecords()
          setShowAddRecordModal(false)
        }}
      />
    </div>
  )
}
