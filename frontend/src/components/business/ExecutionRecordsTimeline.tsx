/**
 * Execution Records Timeline Component
 * 执行记录时间线组件 - 展示候选人的面试评价和状态变更记录
 */

import { Badge } from '@/ui/components/common/Badge'
import { MessageSquare, GitBranch, Star, Calendar, User } from 'lucide-react'
import type { InterviewFeedback, CandidateStatus } from '@/types'
import { formatDate } from '@/utils/date'

interface ExecutionRecordsTimelineProps {
  records: InterviewFeedback[]
}

// 状态配置映射
const STATUS_CONFIG: Record<CandidateStatus, { variant: 'default' | 'warning' | 'success' | 'error'; label: string }> = {
  screening: { variant: 'default', label: '筛选中' },
  interview: { variant: 'warning', label: '面试中' },
  offer: { variant: 'success', label: '已Offer' },
  hired: { variant: 'success', label: '已入职' },
  rejected: { variant: 'error', label: '已拒绝' },
  withdrawn: { variant: 'default', label: '已撤回' },
}

/**
 * 评分星级展示组件 (4分制)
 */
const RatingStars = ({ rating }: { rating: number }) => {
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
      {records.map((record: InterviewFeedback, index: number) => (
        <div key={record.id} className="relative">
          {/* 时间线连接线 */}
          {index !== records.length - 1 && (
            <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200" />
          )}

          <div className="flex gap-3">
            {/* 图标 */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              record.is_status_change ? 'bg-blue-100' : 'bg-orange-100'
            }`}>
              {record.is_status_change ? (
                <GitBranch className="w-5 h-5 text-blue-600" />
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
                    {record.is_status_change ? '状态变更' : '面试评价'}
                  </h3>
                  {record.new_status && (
                    <Badge variant={STATUS_CONFIG[record.new_status as CandidateStatus].variant}>
                      {STATUS_CONFIG[record.new_status as CandidateStatus].label}
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {formatDate(record.created_at)}
                </span>
              </div>

              {/* 面试评价内容 */}
              {!record.is_status_change && (
                <div className="space-y-1.5">
                  {/* 评分 */}
                  {record.rating && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">评分：</span>
                      <RatingStars rating={record.rating} />
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

              {/* 状态变更内容 */}
              {record.is_status_change && record.comments && (
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

              {/* 面试官信息 */}
              {record.interviewer_info && (
                <div className="mt-1.5 flex items-center gap-2 text-sm text-gray-500">
                  <User className="w-4 h-4" />
                  <span>操作人：{record.interviewer_info.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
