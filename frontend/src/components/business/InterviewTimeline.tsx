/**
 * Interview Timeline Component
 * 面试时间线组件 - 展示面试评价历史
 */

import React from 'react'
import type { InterviewFeedback } from '@/types'
import { Badge } from '@/ui/components/common/Badge'
import { EmptyState } from '@/ui/components/common/EmptyState'
import { Star, MessageSquare, Calendar, User, Bot, Settings } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface InterviewTimelineProps {
  /**
   * Interview feedbacks
   */
  feedbacks: InterviewFeedback[]

  /**
   * Empty state message
   */
  emptyMessage?: string

  /**
   * Feedback click handler
   */
  onFeedbackClick?: (feedback: InterviewFeedback) => void

  /**
   * Custom className
   */
  className?: string
}

// v2.0: Interview rating labels (1-4 scale)
const interviewRatingLabels: Record<number, { label: string; color: string }> = {
  1: { label: '不推荐', color: 'text-red-600' },
  2: { label: '待定', color: 'text-yellow-600' },
  3: { label: '合格', color: 'text-green-600' },
  4: { label: '优秀', color: 'text-orange-600' },
}

// v2.0: AI rating labels (1-10 scale)
const aiRatingLabels: Record<number, { label: string; color: string }> = {
  1: { label: '非常不适合', color: 'text-red-700' },
  2: { label: '不适合', color: 'text-red-600' },
  3: { label: '较不适合', color: 'text-red-500' },
  4: { label: '偏低', color: 'text-yellow-700' },
  5: { label: '一般', color: 'text-yellow-600' },
  6: { label: '还行', color: 'text-yellow-500' },
  7: { label: '良好', color: 'text-green-600' },
  8: { label: '优秀', color: 'text-green-500' },
  9: { label: '非常优秀', color: 'text-green-400' },
  10: { label: '完美匹配', color: 'text-green-300' },
}

// v2.0: Interviewer type icons
const interviewerTypeIcons = {
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
 * Interview Timeline Component
 */
export const InterviewTimeline: React.FC<InterviewTimelineProps> = ({
  feedbacks,
  emptyMessage = '暂无面试记录',
  onFeedbackClick,
  className,
}) => {
  if (feedbacks.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          icon={<MessageSquare className="w-12 h-12" />}
          title={emptyMessage}
          description="还没有面试评价记录"
        />
      </div>
    )
  }

  // Sort by created_at descending (newest first)
  const sortedFeedbacks = [...feedbacks].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className={cn('relative', className)}>
      {/* Timeline Line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      {/* Timeline Items */}
      <div className="space-y-6">
        {sortedFeedbacks.map((feedback) => {
          // v2.0: Determine record type
          const recordType = getRecordType(feedback)

          // v2.0: Get rating info based on record type
          const interviewRatingInfo = feedback.interview_rating
            ? interviewRatingLabels[feedback.interview_rating] || interviewRatingLabels[2]
            : null
          const aiRatingInfo = feedback.ai_rating
            ? aiRatingLabels[feedback.ai_rating] || aiRatingLabels[5]
            : null

          // v2.0: Get interviewer icon
          const InterviewerIcon = feedback.interviewer_type
            ? interviewerTypeIcons[feedback.interviewer_type]
            : User

          return (
            <div
              key={feedback.id}
              className={cn(
                'relative flex items-start gap-4 group',
                onFeedbackClick && 'cursor-pointer'
              )}
              onClick={() => onFeedbackClick?.(feedback)}
            >
              {/* Timeline Dot */}
              <div
                className={cn(
                  'absolute left-4 w-2 h-2 rounded-full -translate-x-1/2 mt-2 z-10 group-hover:scale-150 transition-transform',
                  recordType === 'interview' && 'bg-orange-500',
                  recordType === 'ai' && 'bg-blue-500',
                  recordType === 'status' && 'bg-gray-400'
                )}
              />

              {/* Content Card */}
              <div className="ml-10 flex-1">
                <div
                  className={cn(
                    'bg-white rounded-lg border p-4 transition-all',
                    onFeedbackClick
                      ? 'border-gray-200 hover:border-orange-300 hover:shadow-md'
                      : 'border-gray-200'
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* v2.0: Record Type Badge */}
                      {recordType === 'interview' && (
                        <Badge variant="default" size="md">
                          {feedback.interview_date ? `面试日期: ${feedback.interview_date}` : '面试评价'}
                        </Badge>
                      )}
                      {recordType === 'ai' && (
                        <Badge variant="secondary" size="md">
                          <Bot className="w-3 h-3 mr-1" />
                          AI 评价
                        </Badge>
                      )}
                      {recordType === 'status' && feedback.new_status && (
                        <Badge variant="outline" size="md">
                          状态变更: {feedback.new_status}
                        </Badge>
                      )}

                      {/* v2.0: Interview Rating (1-4 stars) */}
                      {recordType === 'interview' && feedback.interview_rating && interviewRatingInfo && (
                        <div className="flex items-center gap-1">
                          {[...Array(feedback.interview_rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-orange-500 fill-current" />
                          ))}
                          <span className={cn('ml-1 text-sm font-medium', interviewRatingInfo.color)}>
                            {interviewRatingInfo.label}
                          </span>
                        </div>
                      )}

                      {/* v2.0: AI Rating (1-10 score) */}
                      {recordType === 'ai' && feedback.ai_rating && aiRatingInfo && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span className={cn('text-lg font-bold', aiRatingInfo.color)}>
                              {feedback.ai_rating}
                            </span>
                            <span className="text-xs text-gray-500">/10</span>
                          </div>
                          <span className={cn('text-sm font-medium', aiRatingInfo.color)}>
                            {aiRatingInfo.label}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(feedback.created_at).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>

                  {/* Comments */}
                  {feedback.comments && (
                    <div className="mb-3">
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{feedback.comments}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    {/* v2.0: Interviewer with type icon */}
                    {feedback.interviewer_info && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <InterviewerIcon className="w-3 h-3" />
                        <span>{feedback.interviewer_info.name}</span>
                        {feedback.interviewer_type && feedback.interviewer_type !== 'user' && (
                          <span className="text-gray-400">({feedback.interviewer_type})</span>
                        )}
                      </div>
                    )}

                    {/* Time */}
                    <span className="text-xs text-gray-400">
                      {new Date(feedback.created_at).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

InterviewTimeline.displayName = 'InterviewTimeline'
