/**
 * Position API Service
 * 职位 API 服务层
 */

import { apiClient } from './auth.service'
import type {
  Position,
  PositionListParams,
  PositionCandidate,
  PositionCandidateListParams,
  PaginatedResponse,
  CreatePositionRequest,
  UpdatePositionRequest,
  SmartScreeningRequest,
  SmartScreeningResponse,
} from '@/types'

/**
 * Get paginated list of positions with filters
 * 获取职位列表（带分页和筛选）
 */
export async function getPositions(
  params: PositionListParams = {}
): Promise<PaginatedResponse<Position>> {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.append('offset', String((params.page - 1) * (params.page_size || 20)))
  if (params.page_size) searchParams.append('limit', String(params.page_size))
  if (params.title) searchParams.append('title', params.title)
  if (params.department) searchParams.append('department', params.department)
  if (params.created_after) searchParams.append('created_after', params.created_after)
  if (params.created_before) searchParams.append('created_before', params.created_before)

  const response = await apiClient.get(`/api/positions/?${searchParams}`)
  const data = response.data

  return {
    data: data.positions,
    total: data.total,
    page: params.page || 1,
    page_size: params.page_size || 20,
    total_pages: Math.ceil(data.total / (params.page_size || 20)),
  }
}

/**
 * Get position by ID
 * 根据 ID 获取职位详情
 */
export async function getPosition(id: number): Promise<Position> {
  const response = await apiClient.get(`/api/positions/${id}`)
  return response.data
}

/**
 * Create new position
 * 创建职位
 */
export async function createPosition(data: CreatePositionRequest): Promise<Position> {
  const response = await apiClient.post(`/api/positions/`, data)
  return response.data
}

/**
 * Update position information
 * 更新职位信息
 */
export async function updatePosition(
  id: number,
  data: UpdatePositionRequest
): Promise<Position> {
  const response = await apiClient.patch(`/api/positions/${id}`, data)
  return response.data
}

/**
 * Update position status
 * 更新职位状态
 */
export async function updatePositionStatus(
  id: number,
  status: 'open' | 'closed'
): Promise<Position> {
  const response = await apiClient.patch(`/api/positions/${id}/status`, { status })
  return response.data
}

/**
 * Delete position (soft delete)
 * 删除职位（软删除）
 */
export async function deletePosition(id: number): Promise<void> {
  await apiClient.delete(`/api/positions/${id}`)
}

/**
 * Get candidates for a position
 * 获取职位关联的候选人列表
 */
export async function getPositionCandidates(
  positionId: number,
  params: PositionCandidateListParams = {}
): Promise<PaginatedResponse<PositionCandidate>> {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.append('offset', String((params.page - 1) * (params.page_size || 20)))
  if (params.page_size) searchParams.append('limit', String(params.page_size))
  if (params.status) searchParams.append('status', params.status)
  if (params.candidate_name) searchParams.append('candidate_name', params.candidate_name)
  if (params.sort_by) searchParams.append('sort_by', params.sort_by)
  if (params.sort_order) searchParams.append('sort_order', params.sort_order)

  const response = await apiClient.get(`/api/positions/${positionId}/candidates?${searchParams}`)
  const data = response.data

  return {
    data: data.candidates,
    total: data.total,
    page: params.page || 1,
    page_size: params.page_size || 20,
    total_pages: Math.ceil(data.total / (params.page_size || 20)),
  }
}

/**
 * Trigger smart screening for a position
 * 触发智能筛选
 */
export async function smartScreening(
  positionId: number,
  request: SmartScreeningRequest
): Promise<SmartScreeningResponse> {
  const searchParams = new URLSearchParams()
  if (request.limit) searchParams.append('max_candidates', String(request.limit))
  if (request.min_score) searchParams.append('min_score', String(request.min_score))

  const response = await apiClient.post(
    `/api/positions/${positionId}/smart-screening?${searchParams}`
  )

  return response.data
}

/**
 * Recalculate scores for all candidates in a position
 * 重新计算职位所有候选人的分数
 */
export async function recalculateScores(
  positionId: number
): Promise<{ status: string; position_id: number; scores_updated: number; message: string }> {
  const response = await apiClient.post(`/api/positions/${positionId}/recalculate-scores`)
  return response.data
}
