/**
 * Edit Position Modal
 * 编辑职位模态框
 */

import { useState, useEffect } from 'react'
import { useUpdatePosition } from '@/hooks/api'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/ui/components/common/Modal'
import { Button } from '@/ui/components/common/Button'
import { Input } from '@/ui/components/common/Input'
import type { Position } from '@/types'

export interface EditPositionModalProps {
  /**
   * Modal open state
   */
  open: boolean

  /**
   * Position to edit
   */
  position: Position

  /**
   * Close handler
   */
  onClose: () => void

  /**
   * Success callback
   */
  onSuccess?: () => void
}

/**
 * Edit Position Modal Component
 */
export const EditPositionModal: React.FC<EditPositionModalProps> = ({
  open,
  position,
  onClose,
  onSuccess,
}) => {
  const updateMutation = useUpdatePosition()

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    jd: '',
    salary_range: '',
  })

  // Initialize form with position data when modal opens
  useEffect(() => {
    if (open && position) {
      setFormData({
        title: position.title || '',
        department: position.department || '',
        jd: position.jd || '',
        salary_range: position.salary_range || '',
      })
    }
  }, [open, position])

  // Handle field change
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle submit
  const handleSubmit = async () => {
    try {
      const submitData: any = {
        title: formData.title.trim(),
        department: formData.department.trim() || null,  // 空字符串转为 null
        jd: formData.jd.trim(),
        salary_range: formData.salary_range.trim() || null,  // 空字符串转为 null
      }

      await updateMutation.mutateAsync({
        id: position.id,
        data: submitData,
      })

      // Success
      alert('职位更新成功！')
      onSuccess?.()
      handleClose()
    } catch (error: any) {
      console.error('Failed to update position:', error)
      const errorMessage = error?.response?.data?.detail || error?.message || '更新失败，请重试'
      alert(`更新职位失败: ${errorMessage}`)
    }
  }

  // Handle close
  const handleClose = () => {
    if (!updateMutation.isPending) {
      onClose()
    }
  }

  // Check if form is valid
  const isFormValid = formData.title.trim() && formData.department.trim() && formData.jd.trim()

  return (
    <Modal open={open} onClose={handleClose} size="lg">
      <ModalHeader>编辑职位</ModalHeader>

      <ModalBody>
        <div className="space-y-4">
          <Input
            label="职位名称"
            name="title"
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('title', e.target.value)}
            required
            placeholder="例如：高级前端工程师"
          />

          <Input
            label="所属部门"
            name="department"
            value={formData.department}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('department', e.target.value)}
            required
            placeholder="例如：技术部"
          />

          <Input
            label="薪资范围"
            name="salary_range"
            value={formData.salary_range}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('salary_range', e.target.value)}
            placeholder="例如：20K-35K"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              职位描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              name="jd"
              value={formData.jd}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('jd', e.target.value)}
              rows={10}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="请输入详细的职位描述，包括：&#10;1. 工作职责&#10;2. 任职要求&#10;3. 加分项&#10;4. 福利待遇"
            />
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose} disabled={updateMutation.isPending}>
            取消
          </Button>

          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={updateMutation.isPending || !isFormValid}
            loading={updateMutation.isPending}
          >
            {updateMutation.isPending ? '更新中...' : '保存更改'}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

EditPositionModal.displayName = 'EditPositionModal'
