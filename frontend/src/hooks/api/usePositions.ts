/**
 * Position API Hooks
 * 职位 API Hooks - 使用 React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  PositionListParams,
  PositionCandidateListParams,
  CreatePositionRequest,
  UpdatePositionRequest,
  SmartScreeningRequest,
} from '@/types'
import * as positionApi from '@/services/positionApi'

/**
 * Query key factory for positions
 * 职位查询键工厂
 */
export const positionKeys = {
  all: ['positions'] as const,
  lists: () => [...positionKeys.all, 'list'] as const,
  list: (params: PositionListParams) => [...positionKeys.lists(), params] as const,
  details: () => [...positionKeys.all, 'detail'] as const,
  detail: (id: number) => [...positionKeys.details(), id] as const,
  candidates: (id: number) => [...positionKeys.detail(id), 'candidates'] as const,
  candidatesList: (id: number, params: PositionCandidateListParams) =>
    [...positionKeys.candidates(id), params] as const,
}

/**
 * Hook: Get paginated list of positions
 * 获取职位列表（分页）
 */
export function usePositions(params: PositionListParams = {}) {
  return useQuery({
    queryKey: positionKeys.list(params),
    queryFn: () => positionApi.getPositions(params),
  })
}

/**
 * Hook: Get position by ID
 * 获取单个职位详情
 */
export function usePosition(id: number, enabled = true) {
  return useQuery({
    queryKey: positionKeys.detail(id),
    queryFn: () => positionApi.getPosition(id),
    enabled,
  })
}

/**
 * Hook: Create new position
 * 创建职位
 */
export function useCreatePosition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePositionRequest) => positionApi.createPosition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: positionKeys.lists() })
    },
  })
}

/**
 * Hook: Update position
 * 更新职位信息
 */
export function useUpdatePosition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePositionRequest }) =>
      positionApi.updatePosition(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: positionKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: positionKeys.lists() })
    },
  })
}

/**
 * Hook: Update position status
 * 更新职位状态
 */
export function useUpdatePositionStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'open' | 'closed' }) =>
      positionApi.updatePositionStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: positionKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: positionKeys.lists() })
    },
  })
}

/**
 * Hook: Delete position
 * 删除职位
 */
export function useDeletePosition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => positionApi.deletePosition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: positionKeys.all })
    },
  })
}

/**
 * Hook: Get candidates for a position
 * 获取职位关联的候选人列表
 */
export function usePositionCandidates(id: number, params: PositionCandidateListParams = {}) {
  return useQuery({
    queryKey: positionKeys.candidatesList(id, params),
    queryFn: () => positionApi.getPositionCandidates(id, params),
  })
}

/**
 * Hook: Trigger smart screening
 * 触发智能筛选
 */
export function useSmartScreening() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ positionId, request }: { positionId: number; request: SmartScreeningRequest }) =>
      positionApi.smartScreening(positionId, request),
    onSuccess: (_, variables) => {
      // Invalidate position candidates list to show new matches
      queryClient.invalidateQueries({ queryKey: positionKeys.candidates(variables.positionId) })
    },
  })
}

/**
 * Hook: Recalculate scores for position candidates
 * 重新计算职位候选人分数
 */
export function useRecalculateScores() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (positionId: number) => positionApi.recalculateScores(positionId),
    onSuccess: (_, positionId) => {
      // Invalidate position candidates list to show updated scores
      queryClient.invalidateQueries({ queryKey: positionKeys.candidates(positionId) })
    },
  })
}
