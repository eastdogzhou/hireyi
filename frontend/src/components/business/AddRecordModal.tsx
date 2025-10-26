/**
 * Add Record Modal Component
 * 添加执行记录弹窗 - 支持添加面试评价和状态变更
 */

import { useState } from 'react'
import { Modal, ModalFooter } from '@/ui/components/common/Modal'
import { Tabs, type TabItem } from '@/ui/components/common/Tabs'
import { SelectDropdown, type SelectOption } from '@/ui/components/common/SelectDropdown'
import { Button } from '@/ui/components/common/Button'
import { Star, MessageSquare, GitBranch } from 'lucide-react'
import { useCreateInterviewFeedback, useCreateStatusChange } from '@/hooks/api/useInterviewFeedbacks'

interface AddRecordModalProps {
  open: boolean
  onClose: () => void
  candidateId: number
  positionId?: number
  onSuccess?: () => void
}

// 状态选项
const STATUS_OPTIONS: SelectOption[] = [
  { value: 'screening', label: '筛选中' },
  { value: 'interview', label: '面试中' },
  { value: 'offer', label: '已Offer' },
  { value: 'hired', label: '已入职' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'withdrawn', label: '已撤回' },
]

/**
 * 评分星级选择器
 */
const RatingSelector = ({ value, onChange }: { value: number; onChange: (rating: number) => void }) => {
  const [hoverRating, setHoverRating] = useState(0)

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4].map((rating) => (
        <button
          key={rating}
          type="button"
          onMouseEnter={() => setHoverRating(rating)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => onChange(rating)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 ${
              rating <= (hoverRating || value)
                ? 'fill-orange-500 text-orange-500'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-600">{value > 0 ? `${value}/4` : '请选择评分'}</span>
    </div>
  )
}

export function AddRecordModal({ open, onClose, candidateId, positionId, onSuccess }: AddRecordModalProps) {
  const [activeTab, setActiveTab] = useState<'interview' | 'status'>('interview')

  // 面试评价表单
  const [rating, setRating] = useState(0)
  const [comments, setComments] = useState('')
  const [interviewDate, setInterviewDate] = useState('')

  // 状态变更表单
  const [newStatus, setNewStatus] = useState<string>('')
  const [statusReason, setStatusReason] = useState('')

  const createInterviewFeedback = useCreateInterviewFeedback()
  const createStatusChange = useCreateStatusChange()

  const resetForm = () => {
    setRating(0)
    setComments('')
    setInterviewDate('')
    setNewStatus('')
    setStatusReason('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    if (activeTab === 'interview') {
      // 验证面试评价表单
      if (rating === 0) {
        alert('请选择评分')
        return
      }

      try {
        await createInterviewFeedback.mutateAsync({
          candidate_id: candidateId,
          position_id: positionId || undefined,
          interviewer: 1, // MVP: 硬编码为 1
          rating,
          comments: comments || undefined,
          interview_date: interviewDate || undefined,
        })
        alert('面试评价添加成功')
        onSuccess?.()
        handleClose()
      } catch (error) {
        console.error('Failed to create interview feedback:', error)
        alert('添加失败，请重试')
      }
    } else {
      // 验证状态变更表单
      if (!newStatus) {
        alert('请选择新状态')
        return
      }
      if (!statusReason.trim()) {
        alert('请填写变更原因')
        return
      }

      try {
        await createStatusChange.mutateAsync({
          candidate_id: candidateId,
          position_id: positionId || undefined,
          interviewer: 1, // MVP: 硬编码为 1
          new_status: newStatus,
          comments: statusReason,
        })
        alert('状态变更添加成功')
        onSuccess?.()
        handleClose()
      } catch (error) {
        console.error('Failed to create status change:', error)
        alert('添加失败，请重试')
      }
    }
  }

  const isLoading = createInterviewFeedback.isPending || createStatusChange.isPending

  const tabItems: TabItem[] = [
    {
      key: 'interview',
      label: '面试评价',
      icon: <MessageSquare className="w-4 h-4" />,
      content: (
        <div className="space-y-4 mt-4">
          {/* 评分 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              评分 <span className="text-red-500">*</span>
            </label>
            <RatingSelector value={rating} onChange={setRating} />
          </div>

          {/* 面试日期 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              面试日期
            </label>
            <input
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* 评价内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              评价内容
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="请输入面试评价..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: '状态变更',
      icon: <GitBranch className="w-4 h-4" />,
      content: (
        <div className="space-y-4 mt-4">
          {/* 新状态 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              新状态 <span className="text-red-500">*</span>
            </label>
            <SelectDropdown
              options={STATUS_OPTIONS}
              value={newStatus}
              onChange={(value) => setNewStatus(value as string)}
              placeholder="请选择状态"
              fullWidth
            />
          </div>

          {/* 变更原因 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              变更原因 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="请输入状态变更原因..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      ),
    },
  ]

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="添加执行记录"
      size="md"
    >
      <Tabs
        items={tabItems}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'interview' | 'status')}
        variant="card"
      />

      <ModalFooter className="mt-6">
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={isLoading}
        >
          取消
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? '提交中...' : '提交'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
