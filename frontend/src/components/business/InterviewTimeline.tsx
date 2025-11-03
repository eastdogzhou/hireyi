/**
 * Interview Timeline Component
 * 面试时间线组件 - 展示面试评价历史
 */

import React from 'react'
import type { InterviewFeedback } from '@/types'
import { Badge } from '@/ui/components/common/Badge'
import { EmptyState } from '@/ui/components/common/EmptyState'
import { Star, MessageSquare, Calendar, User } from 'lucide-react'
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

// Rating labels
const ratingLabels: Record<number, { label: string; color: string }> = {
  1: { label: '不推荐', color: 'text-red-600' },
  2: { label: '待定', color: 'text-yellow-600' },
  3: { label: '合格', color: 'text-green-600' },
  4: { label: '优秀', color: 'text-orange-600' },
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
          const ratingInfo = feedback.rating ? ratingLabels[feedback.rating] || ratingLabels[2] : ratingLabels[2]

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
              <div className="absolute left-4 w-2 h-2 bg-orange-500 rounded-full -translate-x-1/2 mt-2 z-10 group-hover:scale-150 transition-transform" />

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
                      <Badge variant="default" size="md">
                        {feedback.interview_date ? `面试日期: ${feedback.interview_date}` : '面试评价'}
                      </Badge>
                      {feedback.rating && (
                        <div className="flex items-center gap-1">
                          {[...Array(feedback.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-orange-500 fill-current" />
                          ))}
                          <span className={cn('ml-1 text-sm font-medium', ratingInfo.color)}>
                            {ratingInfo.label}
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
                  <div className="mb-3">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{feedback.comments}</p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    {/* Interviewer */}
                    {feedback.interviewer_info && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <User className="w-3 h-3" />
                        <span>{feedback.interviewer_info.name}</span>
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
