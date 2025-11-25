/**
 * Candidate API Hooks
 * 候选人 API Hooks - 使用 React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CandidateListParams, CreateCandidateRequest, UpdateCandidateRequest } from '@/types'
import * as candidateApi from '@/services/candidateApi'

/**
 * Query key factory for candidates
 * 候选人查询键工厂
 */
export const candidateKeys = {
  all: ['candidates'] as const,
  lists: () => [...candidateKeys.all, 'list'] as const,
  list: (params: CandidateListParams) => [...candidateKeys.lists(), params] as const,
  details: () => [...candidateKeys.all, 'detail'] as const,
  detail: (id: number) => [...candidateKeys.details(), id] as const,
}

/**
 * Hook: Get paginated list of candidates
 * 获取候选人列表（分页）
 */
export function useCandidates(params: CandidateListParams = {}) {
  return useQuery({
    queryKey: candidateKeys.list(params),
    queryFn: () => candidateApi.getCandidates(params),
  })
}

/**
 * Hook: Get candidate by ID
 * 获取单个候选人详情
 */
export function useCandidate(id: number, enabled = true) {
  return useQuery({
    queryKey: candidateKeys.detail(id),
    queryFn: () => candidateApi.getCandidate(id),
    enabled,
  })
}

/**
 * Hook: Create new candidate
 * 创建候选人
 */
export function useCreateCandidate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCandidateRequest) => candidateApi.createCandidate(data),
    onSuccess: () => {
      // Invalidate candidate lists to refetch
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() })
    },
  })
}

/**
 * Hook: Update candidate
 * 更新候选人信息
 */
export function useUpdateCandidate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCandidateRequest }) =>
      candidateApi.updateCandidate(id, data),
    onSuccess: (_, variables) => {
      // Invalidate both the detail and lists
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() })
    },
  })
}

/**
 * Hook: Delete candidate
 * 删除候选人
 */
export function useDeleteCandidate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => candidateApi.deleteCandidate(id),
    onSuccess: () => {
      // Invalidate all candidate queries
      queryClient.invalidateQueries({ queryKey: candidateKeys.all })
    },
  })
}

/**
 * Hook: Upload single resume
 * 上传单个简历
 */
export function useUploadResume() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, positionId }: { file: File; positionId?: number }) =>
      candidateApi.uploadResume(file, positionId),
    onSuccess: () => {
      // Invalidate candidate lists
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() })
    },
  })
}

/**
 * Hook: Batch upload resumes
 * 批量上传简历
 */
export function useBatchUploadResumes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ files, positionId }: { files: File[]; positionId?: number }) =>
      candidateApi.batchUploadResumes(files, positionId),
    onSuccess: () => {
      // Invalidate candidate lists
      queryClient.invalidateQueries({ queryKey: candidateKeys.lists() })
    },
  })
}
