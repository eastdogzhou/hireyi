/**
 * Interview Feedback Modal
 * 面试评价模态框 - 添加或编辑面试反馈
 */

import { useState } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/ui/components/common/Modal'
import { Button } from '@/ui/components/common/Button'
import { SelectDropdown } from '@/ui/components/common/SelectDropdown'
import { FormField } from '@/ui/components/form/FormField'
import { Star, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface InterviewFeedbackModalProps {
  /**
   * Modal open state
   */
  open: boolean

  /**
   * Close handler
   */
  onClose: () => void

  /**
   * Candidate name
   */
  candidateName: string

  /**
   * Position title
   */
  positionTitle: string

  /**
   * Submit handler
   */
  onSubmit: (feedback: InterviewFeedbackFormData) => Promise<void>

  /**
   * Initial data for editing
   */
  initialData?: Partial<InterviewFeedbackFormData>
}

export interface InterviewFeedbackFormData {
  round: string
  rating: number
  comments: string
}

/**
 * Interview Feedback Modal Component
 */
export const InterviewFeedbackModal: React.FC<InterviewFeedbackModalProps> = ({
  open,
  onClose,
  candidateName,
  positionTitle,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<InterviewFeedbackFormData>({
    round: initialData?.round || '',
    rating: initialData?.rating || 0,
    comments: initialData?.comments || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Round options
  const roundOptions = [
    { value: 'phone', label: '📞 电话面试' },
    { value: 'technical', label: '💻 技术面试' },
    { value: 'manager', label: '👔 主管面试' },
    { value: 'hr', label: '🤝 HR面试' },
    { value: 'final', label: '🎯 终面' },
  ]

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.round) {
      newErrors.round = '请选择面试轮次'
    }

    if (formData.rating === 0) {
      newErrors.rating = '请选择评分'
    }

    if (!formData.comments.trim()) {
      newErrors.comments = '请填写面试评价'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async () => {
    if (!validate()) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      handleClose()
    } catch (error) {
      console.error('Submit failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle close
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        round: '',
        rating: 0,
        comments: '',
      })
      setErrors({})
      onClose()
    }
  }

  // Handle round change
  const handleRoundChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({ ...prev, round: value as string }))
    if (errors.round) {
      setErrors(prev => ({ ...prev, round: '' }))
    }
  }

  // Handle rating change
  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }))
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: '' }))
    }
  }

  // Handle comments change
  const handleCommentsChange = (value: string) => {
    setFormData(prev => ({ ...prev, comments: value }))
    if (errors.comments) {
      setErrors(prev => ({ ...prev, comments: '' }))
    }
  }

  return (
    <Modal open={open} onClose={handleClose} size="md">
      <ModalHeader>
        {initialData ? '编辑面试评价' : '添加面试评价'}
      </ModalHeader>

      <ModalBody>
        <div className="space-y-5">
          {/* Candidate Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm">
              <p className="text-gray-600">候选人</p>
              <p className="font-semibold text-gray-900 mt-1">{candidateName}</p>
              <p className="text-gray-600 mt-2">职位</p>
              <p className="font-medium text-gray-900 mt-1">{positionTitle}</p>
            </div>
          </div>

          {/* Round Selection */}
          <FormField
            label="面试轮次"
            name="round"
            error={errors.round}
            required
          >
            <SelectDropdown
              options={roundOptions}
              value={formData.round}
              onChange={handleRoundChange}
              placeholder="选择面试轮次"
            />
          </FormField>

          {/* Rating */}
          <FormField
            label="面试评分"
            name="rating"
            error={errors.rating}
            required
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map(value => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleRatingChange(value)}
                    className={cn(
                      'flex items-center justify-center w-12 h-12 rounded-full transition-all',
                      'border-2 focus:outline-none focus:ring-2 focus:ring-orange-500',
                      formData.rating >= value
                        ? 'bg-orange-500 border-orange-500 text-white scale-110'
                        : 'bg-white border-gray-300 text-gray-400 hover:border-orange-300'
                    )}
                  >
                    <Star className={cn('w-6 h-6', formData.rating >= value && 'fill-current')} />
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">1-2: 不推荐</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-orange-500 fill-current" />
                  <span className="text-gray-600">3: 合格</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-orange-500 fill-current" />
                  <span className="text-gray-600">4: 优秀</span>
                </div>
              </div>
            </div>
          </FormField>

          {/* Comments */}
          <FormField
            label="面试评价"
            name="comments"
            error={errors.comments}
            required
            helperText="请详细描述面试表现、技术能力、沟通能力等"
          >
            <div className="relative">
              <textarea
                value={formData.comments}
                onChange={e => handleCommentsChange(e.target.value)}
                placeholder="请填写面试评价..."
                rows={6}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg resize-none',
                  'focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                  'placeholder:text-gray-400',
                  errors.comments ? 'border-red-500' : 'border-gray-300'
                )}
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-gray-400">
                <MessageSquare className="w-3 h-3" />
                <span>{formData.comments.length} 字</span>
              </div>
            </div>
          </FormField>
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? '提交中...' : initialData ? '保存' : '提交'}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

InterviewFeedbackModal.displayName = 'InterviewFeedbackModal'
