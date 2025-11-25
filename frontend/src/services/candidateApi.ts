/**
 * Candidate API Service
 * 候选人 API 服务层
 */

import { apiClient } from './auth.service'
import type {
  Candidate,
  CandidateListParams,
  PaginatedResponse,
  CreateCandidateRequest,
  UpdateCandidateRequest,
  BatchUploadResult,
} from '@/types'

/**
 * Get paginated list of candidates with filters
 * 获取候选人列表（带分页和筛选）
 */
export async function getCandidates(
  params: CandidateListParams = {}
): Promise<PaginatedResponse<Candidate>> {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.append('offset', String((params.page - 1) * (params.page_size || 20)))
  if (params.page_size) searchParams.append('limit', String(params.page_size))
  if (params.name) searchParams.append('name', params.name)
  if (params.skills) params.skills.forEach(skill => searchParams.append('skills', skill))
  if (params.min_score) searchParams.append('min_score', String(params.min_score))
  if (params.created_after) searchParams.append('created_after', params.created_after)
  if (params.created_before) searchParams.append('created_before', params.created_before)

  const response = await apiClient.get(`/api/candidates/?${searchParams}`)
  const data = response.data

  // Backend returns {candidates, total, limit, offset}
  // Transform to {data, total, page, page_size, total_pages}
  return {
    data: data.candidates,
    total: data.total,
    page: params.page || 1,
    page_size: params.page_size || 20,
    total_pages: Math.ceil(data.total / (params.page_size || 20)),
  }
}

/**
 * Get candidate by ID
 * 根据 ID 获取候选人详情
 */
export async function getCandidate(id: number): Promise<Candidate> {
  const response = await apiClient.get(`/api/candidates/${id}`)
  return response.data
}

/**
 * Create new candidate manually
 * 手动创建候选人
 */
export async function createCandidate(data: CreateCandidateRequest): Promise<Candidate> {
  const response = await apiClient.post(`/api/candidates/`, data)
  return response.data
}

/**
 * Update candidate information
 * 更新候选人信息
 */
export async function updateCandidate(
  id: number,
  data: UpdateCandidateRequest
): Promise<Candidate> {
  const response = await apiClient.patch(`/api/candidates/${id}`, data)
  return response.data
}

/**
 * Delete candidate (soft delete)
 * 删除候选人（软删除）
 */
export async function deleteCandidate(id: number): Promise<void> {
  await apiClient.delete(`/api/candidates/${id}`)
}

/**
 * Upload single resume file
 * 上传单个简历文件
 */
export async function uploadResume(
  file: File,
  positionId?: number
): Promise<{ status: string; candidate?: Candidate; file_url: string; parse_error?: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const url = positionId
    ? `/api/candidates/upload?position_id=${positionId}`
    : `/api/candidates/upload`

  const response = await apiClient.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

/**
 * Batch upload multiple resume files
 * 批量上传简历文件
 */
export async function batchUploadResumes(
  files: File[],
  positionId?: number
): Promise<BatchUploadResult> {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))

  const url = positionId
    ? `/api/candidates/batch-upload?position_id=${positionId}`
    : `/api/candidates/batch-upload`

  const response = await apiClient.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}
