/**
 * Interview Feedback API Service
 * 面试反馈 API 服务层
 */

import type {
  InterviewFeedback,
  PaginatedResponse,
  CreateInterviewFeedbackRequest,
  UpdateInterviewFeedbackRequest,
} from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * Get all execution records for a candidate (across all positions)
 * 获取候选人的所有执行记录（跨所有职位）
 */
export async function getCandidateExecutionRecords(
  candidateId: number,
  includeStatusChanges = true,
  limit = 100,
  offset = 0
): Promise<PaginatedResponse<InterviewFeedback>> {
  const searchParams = new URLSearchParams({
    include_status_changes: String(includeStatusChanges),
    limit: String(limit),
    offset: String(offset),
  })

  const response = await fetch(
    `${API_BASE}/api/interview-feedbacks/candidate/${candidateId}?${searchParams}`
  )
  if (!response.ok) throw new Error('Failed to fetch execution records')

  const data = await response.json()

  return {
    data: data.feedbacks,
    total: data.total,
    page: Math.floor(offset / limit) + 1,
    page_size: limit,
    total_pages: Math.ceil(data.total / limit),
  }
}

/**
 * Get all feedback records for a candidate-position pair
 * 获取候选人-职位的所有反馈记录
 */
export async function getInterviewFeedbacks(
  candidateId: number,
  positionId: number,
  includeStatusChanges = true,
  limit = 100,
  offset = 0
): Promise<PaginatedResponse<InterviewFeedback>> {
  const searchParams = new URLSearchParams({
    candidate_id: String(candidateId),
    position_id: String(positionId),
    include_status_changes: String(includeStatusChanges),
    limit: String(limit),
    offset: String(offset),
  })

  const response = await fetch(`${API_BASE}/api/interview-feedbacks/?${searchParams}`)
  if (!response.ok) throw new Error('Failed to fetch interview feedbacks')

  const data = await response.json()

  return {
    data: data.feedbacks,
    total: data.total,
    page: Math.floor(offset / limit) + 1,
    page_size: limit,
    total_pages: Math.ceil(data.total / limit),
  }
}

/**
 * Get feedback by ID
 * 根据 ID 获取反馈详情
 */
export async function getInterviewFeedback(id: number): Promise<InterviewFeedback> {
  const response = await fetch(`${API_BASE}/api/interview-feedbacks/${id}`)
  if (!response.ok) {
    if (response.status === 404) throw new Error('Feedback not found')
    throw new Error('Failed to fetch feedback')
  }
  return response.json()
}

/**
 * Get all feedbacks by interviewer
 * 根据面试官获取所有反馈
 */
export async function getInterviewFeedbacksByInterviewer(
  interviewerId: number,
  limit = 100,
  offset = 0
): Promise<PaginatedResponse<InterviewFeedback>> {
  const searchParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  })

  const response = await fetch(
    `${API_BASE}/api/interview-feedbacks/interviewer/${interviewerId}?${searchParams}`
  )
  if (!response.ok) throw new Error('Failed to fetch interviewer feedbacks')

  const data = await response.json()

  return {
    data: data.feedbacks,
    total: data.total,
    page: Math.floor(offset / limit) + 1,
    page_size: limit,
    total_pages: Math.ceil(data.total / limit),
  }
}

/**
 * Create interview feedback
 * 创建面试反馈
 */
export async function createInterviewFeedback(
  data: CreateInterviewFeedbackRequest
): Promise<InterviewFeedback> {
  const response = await fetch(`${API_BASE}/api/interview-feedbacks/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    if (response.status === 400) throw new Error('Validation error')
    throw new Error('Failed to create interview feedback')
  }
  return response.json()
}

/**
 * Create status change record
 * 创建状态变更记录
 */
export async function createStatusChange(data: {
  candidate_id: number
  position_id: number
  interviewer: number
  new_status: string
  reason: string
}): Promise<InterviewFeedback> {
  const response = await fetch(`${API_BASE}/api/interview-feedbacks/status-change`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    if (response.status === 400) throw new Error('Validation error')
    throw new Error('Failed to create status change')
  }
  return response.json()
}

/**
 * Update interview feedback
 * 更新面试反馈（仅适用于非状态变更记录）
 */
export async function updateInterviewFeedback(
  id: number,
  data: UpdateInterviewFeedbackRequest
): Promise<InterviewFeedback> {
  const response = await fetch(`${API_BASE}/api/interview-feedbacks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    if (response.status === 404) throw new Error('Feedback not found')
    if (response.status === 400) throw new Error('Cannot edit status change record')
    throw new Error('Failed to update interview feedback')
  }
  return response.json()
}
