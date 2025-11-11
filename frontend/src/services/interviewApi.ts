/**
 * Interview Feedback API Service (v2.0)
 * 面试反馈 API 服务层
 *
 * v2.0 Changes:
 * - Support three record types: interview, ai, status
 * - interviewer field changed from number to UUID string
 * - Added record_type filtering
 */

import type {
  InterviewFeedback,
  PaginatedResponse,
  CreateInterviewFeedbackRequest,
  CreateInterviewEvaluationRequest,
  CreateAIEvaluationRequest,
  CreateStatusChangeRequest,
  UpdateInterviewFeedbackRequest,
  FeedbackQueryParams,
} from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * Get all execution records for a candidate (across all positions)
 * 获取候选人的所有执行记录（跨所有职位）
 *
 * @param candidateId - Candidate ID
 * @param recordType - Filter by type: 'interview', 'ai', 'status', or undefined (all)
 * @param limit - Maximum number of results
 * @param offset - Number of records to skip
 */
export async function getCandidateExecutionRecords(
  candidateId: number,
  recordType?: 'interview' | 'ai' | 'status',
  limit = 100,
  offset = 0
): Promise<PaginatedResponse<InterviewFeedback>> {
  const searchParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  })

  // v2.0: Use record_type instead of include_status_changes
  if (recordType) {
    searchParams.append('record_type', recordType)
  }

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
 *
 * @param candidateId - Candidate ID
 * @param positionId - Position ID
 * @param recordType - Filter by type: 'interview', 'ai', 'status', or undefined (all)
 * @param limit - Maximum number of results
 * @param offset - Number of records to skip
 */
export async function getInterviewFeedbacks(
  candidateId: number,
  positionId: number,
  recordType?: 'interview' | 'ai' | 'status',
  limit = 100,
  offset = 0
): Promise<PaginatedResponse<InterviewFeedback>> {
  const searchParams = new URLSearchParams({
    candidate_id: String(candidateId),
    position_id: String(positionId),
    limit: String(limit),
    offset: String(offset),
  })

  // v2.0: Use record_type instead of include_status_changes
  if (recordType) {
    searchParams.append('record_type', recordType)
  }

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
 *
 * @param interviewerId - Interviewer UUID (v2.0: changed from number to string)
 * @param limit - Maximum number of results
 * @param offset - Number of records to skip
 */
export async function getInterviewFeedbacksByInterviewer(
  interviewerId: string,  // v2.0: UUID string instead of number
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
 * Create status change record (v2.0)
 * 创建状态变更记录
 *
 * @param data - Status change data
 * @returns Created interview feedback record
 */
export async function createStatusChange(
  data: CreateStatusChangeRequest
): Promise<InterviewFeedback> {
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
 * Create interview evaluation (v2.0 - Convenience)
 * 创建面试评价（便捷方法）
 *
 * @param data - Interview evaluation data
 * @returns Created interview feedback record
 */
export async function createInterviewEvaluation(
  data: CreateInterviewEvaluationRequest
): Promise<InterviewFeedback> {
  // Convert to generic CreateInterviewFeedbackRequest
  const requestData: CreateInterviewFeedbackRequest = {
    ...data,
    interviewer_type: data.interviewer_type || 'user',
  }

  const response = await fetch(`${API_BASE}/api/interview-feedbacks/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData),
  })
  if (!response.ok) {
    if (response.status === 400) throw new Error('Validation error')
    throw new Error('Failed to create interview evaluation')
  }
  return response.json()
}

/**
 * Create AI evaluation (v2.0 - Convenience)
 * 创建 AI 评价（便捷方法）
 *
 * @param data - AI evaluation data
 * @returns Created interview feedback record
 */
export async function createAIEvaluation(
  data: CreateAIEvaluationRequest
): Promise<InterviewFeedback> {
  // Convert to generic CreateInterviewFeedbackRequest
  const requestData: CreateInterviewFeedbackRequest = {
    ...data,
    interviewer_type: data.interviewer_type || 'agent',
  }

  const response = await fetch(`${API_BASE}/api/interview-feedbacks/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData),
  })
  if (!response.ok) {
    if (response.status === 400) throw new Error('Validation error')
    throw new Error('Failed to create AI evaluation')
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
