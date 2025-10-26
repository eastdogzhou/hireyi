/**
 * Edit Candidate Modal
 * 编辑候选人模态框 - 支持编辑候选人基本信息
 */

import { useState, useEffect } from 'react'
import { useUpdateCandidate } from '@/hooks/api'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/ui/components/common/Modal'
import { Button } from '@/ui/components/common/Button'
import { Input } from '@/ui/components/common/Input'
import { Badge } from '@/ui/components/common/Badge'
import { X } from 'lucide-react'
import type { Candidate } from '@/types'

export interface EditCandidateModalProps {
  /**
   * Modal open state
   */
  open: boolean

  /**
   * Close handler
   */
  onClose: () => void

  /**
   * Candidate to edit
   */
  candidate: Candidate

  /**
   * Success callback
   */
  onSuccess?: () => void
}

/**
 * Edit Candidate Modal Component
 */
export const EditCandidateModal: React.FC<EditCandidateModalProps> = ({
  open,
  onClose,
  candidate,
  onSuccess,
}) => {
  const updateMutation = useUpdateCandidate()

  // Helper to convert highlights to string
  const getHighlightsString = (highlights: string | string[] | null | undefined): string => {
    if (!highlights) return ''
    if (typeof highlights === 'string') return highlights
    return highlights.join('\n')
  }

  // Form state
  const [formData, setFormData] = useState({
    name: candidate.name || '',
    phone: candidate.phone || '',
    email: candidate.email || '',
    skills: candidate.skills || [],
    highlights: getHighlightsString(candidate.highlights),
    years_of_experience: candidate.years_of_experience || null,
    education_level: candidate.education_level || '',
    recent_company: candidate.recent_company || '',
    recent_position: candidate.recent_position || '',
  })

  const [skillInput, setSkillInput] = useState('')

  // Reset form when candidate changes
  useEffect(() => {
    if (open) {
      setFormData({
        name: candidate.name || '',
        phone: candidate.phone || '',
        email: candidate.email || '',
        skills: candidate.skills || [],
        highlights: getHighlightsString(candidate.highlights),
        years_of_experience: candidate.years_of_experience || null,
        education_level: candidate.education_level || '',
        recent_company: candidate.recent_company || '',
        recent_position: candidate.recent_position || '',
      })
      setSkillInput('')
    }
  }, [candidate, open])

  // Handle field change
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle add skill
  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }))
      setSkillInput('')
    }
  }

  // Handle remove skill
  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove),
    }))
  }

  // Handle submit
  const handleSubmit = async () => {
    try {
      // Only include non-empty fields
      const updateData: any = {}

      if (formData.name && formData.name.trim()) updateData.name = formData.name.trim()
      if (formData.phone && formData.phone.trim()) updateData.phone = formData.phone.trim()
      if (formData.email && formData.email.trim()) updateData.email = formData.email.trim()
      if (formData.skills && formData.skills.length > 0) updateData.skills = formData.skills
      if (formData.highlights && formData.highlights.trim()) updateData.highlights = formData.highlights.trim()
      if (formData.years_of_experience !== null) updateData.years_of_experience = formData.years_of_experience
      if (formData.education_level && formData.education_level.trim()) updateData.education_level = formData.education_level.trim()
      if (formData.recent_company && formData.recent_company.trim()) updateData.recent_company = formData.recent_company.trim()
      if (formData.recent_position && formData.recent_position.trim()) updateData.recent_position = formData.recent_position.trim()

      await updateMutation.mutateAsync({
        id: candidate.id,
        data: updateData,
      })

      // Success
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to update candidate:', error)
    }
  }

  // Handle close
  const handleClose = () => {
    if (!updateMutation.isPending) {
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={handleClose} size="lg">
      <ModalHeader>编辑候选人信息</ModalHeader>

      <ModalBody>
        <div className="space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">基本信息</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="姓名"
                name="name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('name', e.target.value)}
                required
              />

              <Input
                label="电话"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('phone', e.target.value)}
              />

              <Input
                label="邮箱"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('email', e.target.value)}
              />

              <Input
                label="工作年限"
                name="years_of_experience"
                type="number"
                min="0"
                max="50"
                value={formData.years_of_experience?.toString() || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleFieldChange(
                    'years_of_experience',
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
              />

              <Input
                label="学历"
                name="education_level"
                value={formData.education_level}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('education_level', e.target.value)}
                placeholder="例如：本科、硕士"
              />
            </div>
          </div>

          {/* Recent Work Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">最近工作</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="最近公司"
                name="recent_company"
                value={formData.recent_company}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('recent_company', e.target.value)}
              />

              <Input
                label="最近职位"
                name="recent_position"
                value={formData.recent_position}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('recent_position', e.target.value)}
              />
            </div>
          </div>

          {/* Skills Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">技能标签</h3>

            <div className="flex gap-2">
              <Input
                name="skill_input"
                value={skillInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSkillInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddSkill()
                  }
                }}
                placeholder="输入技能并按回车添加"
                className="flex-1"
              />
              <Button variant="secondary" onClick={handleAddSkill}>
                添加
              </Button>
            </div>

            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <Badge key={index} variant="default" size="md" className="flex items-center gap-2">
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-red-600"
                      type="button"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Highlights Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">个人亮点</h3>

            <textarea
              name="highlights"
              value={formData.highlights}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('highlights', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="输入候选人的个人亮点和优势..."
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
            disabled={updateMutation.isPending || !formData.name.trim()}
            loading={updateMutation.isPending}
          >
            {updateMutation.isPending ? '保存中...' : '保存'}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

EditCandidateModal.displayName = 'EditCandidateModal'
