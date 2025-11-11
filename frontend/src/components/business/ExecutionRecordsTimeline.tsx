/**
 * Execution Records Timeline Component
 * 执行记录时间线组件 - 展示候选人的面试评价和状态变更记录
 */

import { Badge } from '@/ui/components/common/Badge'
import { MessageSquare, GitBranch, Star, Calendar, User, Bot, Settings } from 'lucide-react'
import type { InterviewFeedback, CandidateStatus } from '@/types'
import { formatDate } from '@/utils/date'

interface ExecutionRecordsTimelineProps {
  records: InterviewFeedback[]
}

// 状态配置映射
const STATUS_CONFIG: Record<CandidateStatus, { variant: 'default' | 'warning' | 'success' | 'danger'; label: string }> = {
  screening: { variant: 'default', label: '筛选中' },
  interview: { variant: 'warning', label: '面试中' },
  offer: { variant: 'success', label: '已Offer' },
  hired: { variant: 'success', label: '已入职' },
  rejected: { variant: 'danger', label: '已拒绝' },
  withdrawn: { variant: 'default', label: '已撤回' },
}

// v2.0: Interviewer type icons
const INTERVIEWER_TYPE_ICONS = {
  user: User,
  agent: Bot,
  system: Settings,
}

// v2.0: Helper function to determine record type
const getRecordType = (feedback: InterviewFeedback): 'interview' | 'ai' | 'status' => {
  if (feedback.interview_rating !== null && feedback.interview_rating !== undefined) {
    return 'interview'
  }
  if (feedback.ai_rating !== null && feedback.ai_rating !== undefined) {
    return 'ai'
  }
  return 'status'
}

/**
 * v2.0: 面试评分星级展示组件 (1-4 星)
 */
const InterviewRatingStars = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? 'fill-orange-500 text-orange-500' : 'text-gray-300'
          }`}
        />
      ))}
      <span className="ml-1 text-sm text-gray-600">{rating}/4</span>
    </div>
  )
}

/**
 * v2.0: AI 评分展示组件 (1-10 分)
 */
const AIRatingScore = ({ rating }: { rating: number }) => {
  // 根据分数确定颜色
  const getColor = (score: number) => {
    if (score <= 3) return 'text-red-600'
    if (score <= 6) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <span className={`text-lg font-bold ${getColor(rating)}`}>{rating}</span>
        <span className="text-sm text-gray-500">/10</span>
      </div>
      {/* 进度条 */}
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
        <div
          className={`h-full ${
            rating <= 3 ? 'bg-red-500' : rating <= 6 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${(rating / 10) * 100}%` }}
        />
      </div>
    </div>
  )
}

/**
 * 执行记录时间线
 */
export function ExecutionRecordsTimeline({ records }: ExecutionRecordsTimelineProps) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <MessageSquare className="w-12 h-12 mb-2" />
        <p>暂无执行记录</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {records.map((record: InterviewFeedback, index: number) => {
        // v2.0: Determine record type
        const recordType = getRecordType(record)

        // v2.0: Get interviewer icon
        const InterviewerIcon = record.interviewer_type
          ? INTERVIEWER_TYPE_ICONS[record.interviewer_type]
          : User

        return (
          <div key={record.id} className="relative">
            {/* 时间线连接线 */}
            {index !== records.length - 1 && (
              <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200" />
            )}

            <div className="flex gap-3">
              {/* v2.0: 图标（根据记录类型） */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                recordType === 'status' ? 'bg-blue-100' :
                recordType === 'ai' ? 'bg-purple-100' :
                'bg-orange-100'
              }`}>
                {recordType === 'status' ? (
                  <GitBranch className="w-5 h-5 text-blue-600" />
                ) : recordType === 'ai' ? (
                  <Bot className="w-5 h-5 text-purple-600" />
                ) : (
                  <MessageSquare className="w-5 h-5 text-orange-600" />
                )}
              </div>

              {/* 内容卡片 */}
              <div className="flex-1 bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                {/* 头部 */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-900">
                      {recordType === 'status' ? '状态变更' :
                       recordType === 'ai' ? 'AI 评价' :
                       '面试评价'}
                    </h3>
                    {/* v2.0: 状态 Badge */}
                    {record.new_status && recordType === 'status' && (
                      <Badge variant={STATUS_CONFIG[record.new_status as CandidateStatus].variant}>
                        {STATUS_CONFIG[record.new_status as CandidateStatus].label}
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(record.created_at)}
                  </span>
                </div>

                {/* v2.0: 面试评价内容 */}
                {recordType === 'interview' && (
                  <div className="space-y-1.5">
                    {/* 评分 (1-4 星) */}
                    {record.interview_rating && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">评分：</span>
                        <InterviewRatingStars rating={record.interview_rating} />
                      </div>
                    )}

                    {/* 面试日期 */}
                    {record.interview_date && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>面试日期：{formatDate(record.interview_date)}</span>
                      </div>
                    )}

                    {/* 评价内容 */}
                    {record.comments && (
                      <div className="mt-1.5 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        {record.comments}
                      </div>
                    )}
                  </div>
                )}

                {/* v2.0: AI 评价内容 */}
                {recordType === 'ai' && (
                  <div className="space-y-1.5">
                    {/* AI 评分 (1-10 分) */}
                    {record.ai_rating && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">AI 评分：</span>
                        <AIRatingScore rating={record.ai_rating} />
                      </div>
                    )}

                    {/* AI 评价内容 */}
                    {record.comments && (
                      <div className="mt-1.5 text-sm text-gray-700 bg-purple-50 p-2 rounded border border-purple-100">
                        <div className="flex items-start gap-2">
                          <Bot className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                          <span>{record.comments}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* v2.0: 状态变更内容 */}
                {recordType === 'status' && record.comments && (
                  <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    <span className="font-medium">变更原因：</span>
                    {record.comments}
                  </div>
                )}

                {/* 职位信息 */}
                {record.position && (
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
                    <span>职位：{record.position.title}</span>
                    {record.position.department && (
                      <span>· {record.position.department}</span>
                    )}
                  </div>
                )}

                {/* v2.0: 面试官信息（带类型图标） */}
                {record.interviewer_info && (
                  <div className="mt-1.5 flex items-center gap-2 text-sm text-gray-500">
                    <InterviewerIcon className="w-4 h-4" />
                    <span>
                      {recordType === 'ai' ? 'AI 系统' : '操作人'}：{record.interviewer_info.name}
                    </span>
                    {record.interviewer_type && record.interviewer_type !== 'user' && (
                      <span className="text-gray-400">({record.interviewer_type})</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
