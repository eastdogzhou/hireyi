/**
 * Create Position Modal
 * 创建职位模态框
 */

import { useState } from 'react'
import { useCreatePosition } from '@/hooks/api'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/ui/components/common/Modal'
import { Button } from '@/ui/components/common/Button'
import { Input } from '@/ui/components/common/Input'

export interface CreatePositionModalProps {
  /**
   * Modal open state
   */
  open: boolean

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
 * Create Position Modal Component
 */
export const CreatePositionModal: React.FC<CreatePositionModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const createMutation = useCreatePosition()

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    jd: '',
    salary_range: '',
  })

  // Handle field change
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle submit
  const handleSubmit = async () => {
    try {
      const submitData: any = {
        title: formData.title.trim(),
        department: formData.department.trim(),
        jd: formData.jd.trim(),
        requirements: [], // Empty array for now, can be enhanced later
      }

      if (formData.salary_range && formData.salary_range.trim()) {
        submitData.salary_range = formData.salary_range.trim()
      }

      await createMutation.mutateAsync(submitData)

      // Success
      onSuccess?.()
      handleClose()

      // Reset form
      setFormData({
        title: '',
        department: '',
        jd: '',
        salary_range: '',
      })
    } catch (error) {
      console.error('Failed to create position:', error)
    }
  }

  // Handle close
  const handleClose = () => {
    if (!createMutation.isPending) {
      onClose()
    }
  }

  // Check if form is valid
  const isFormValid = formData.title.trim() && formData.department.trim() && formData.jd.trim()

  return (
    <Modal open={open} onClose={handleClose} size="lg">
      <ModalHeader>新建职位</ModalHeader>

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
          <Button variant="secondary" onClick={handleClose} disabled={createMutation.isPending}>
            取消
          </Button>

          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={createMutation.isPending || !isFormValid}
            loading={createMutation.isPending}
          >
            {createMutation.isPending ? '创建中...' : '创建职位'}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

CreatePositionModal.displayName = 'CreatePositionModal'
