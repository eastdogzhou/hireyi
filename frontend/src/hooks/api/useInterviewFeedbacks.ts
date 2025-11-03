/**
 * Interview Feedback API Hooks
 * 面试反馈 API Hooks - 使用 React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  CreateInterviewFeedbackRequest,
  UpdateInterviewFeedbackRequest,
} from '@/types'
import * as interviewApi from '@/services/interviewApi'

/**
 * Query key factory for interview feedbacks
 * 面试反馈查询键工厂
 */
export const interviewFeedbackKeys = {
  all: ['interview-feedbacks'] as const,
  lists: () => [...interviewFeedbackKeys.all, 'list'] as const,
  list: (candidateId: number, positionId: number, includeStatusChanges: boolean) =>
    [...interviewFeedbackKeys.lists(), { candidateId, positionId, includeStatusChanges }] as const,
  candidateRecords: (candidateId: number, includeStatusChanges: boolean) =>
    [...interviewFeedbackKeys.all, 'candidate-records', { candidateId, includeStatusChanges }] as const,
  details: () => [...interviewFeedbackKeys.all, 'detail'] as const,
  detail: (id: number) => [...interviewFeedbackKeys.details(), id] as const,
  byInterviewer: (interviewerId: number) =>
    [...interviewFeedbackKeys.all, 'by-interviewer', interviewerId] as const,
}

/**
 * Hook: Get all execution records for a candidate (across all positions)
 * 获取候选人的所有执行记录（跨所有职位）
 */
export function useCandidateExecutionRecords(
  candidateId: number,
  includeStatusChanges = true,
  enabled = true
) {
  return useQuery({
    queryKey: interviewFeedbackKeys.candidateRecords(candidateId, includeStatusChanges),
    queryFn: () => interviewApi.getCandidateExecutionRecords(candidateId, includeStatusChanges),
    enabled,
  })
}

/**
 * Hook: Get feedback records for candidate-position pair
 * 获取候选人-职位的反馈记录
 */
export function useInterviewFeedbacks(
  candidateId: number,
  positionId: number,
  includeStatusChanges = true,
  enabled = true
) {
  return useQuery({
    queryKey: interviewFeedbackKeys.list(candidateId, positionId, includeStatusChanges),
    queryFn: () => interviewApi.getInterviewFeedbacks(candidateId, positionId, includeStatusChanges),
    enabled,
  })
}

/**
 * Hook: Get feedback by ID
 * 获取单个反馈详情
 */
export function useInterviewFeedback(id: number, enabled = true) {
  return useQuery({
    queryKey: interviewFeedbackKeys.detail(id),
    queryFn: () => interviewApi.getInterviewFeedback(id),
    enabled,
  })
}

/**
 * Hook: Get feedbacks by interviewer
 * 根据面试官获取反馈列表
 */
export function useInterviewFeedbacksByInterviewer(interviewerId: number, enabled = true) {
  return useQuery({
    queryKey: interviewFeedbackKeys.byInterviewer(interviewerId),
    queryFn: () => interviewApi.getInterviewFeedbacksByInterviewer(interviewerId),
    enabled,
  })
}

/**
 * Hook: Create interview feedback
 * 创建面试反馈
 */
export function useCreateInterviewFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateInterviewFeedbackRequest) =>
      interviewApi.createInterviewFeedback(data),
    onSuccess: (_, variables) => {
      // Invalidate the feedback list for this candidate-position pair
      queryClient.invalidateQueries({
        queryKey: interviewFeedbackKeys.lists(),
      })
      // Also invalidate position candidates list (status may have changed)
      queryClient.invalidateQueries({
        queryKey: ['positions', 'detail', variables.position_id, 'candidates'],
      })
    },
  })
}

/**
 * Hook: Create status change record
 * 创建状态变更记录
 */
export function useCreateStatusChange() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      candidate_id: number
      position_id?: number  // Optional: allows candidate-level status changes
      interviewer: number
      new_status: string
      comments: string
    }) => interviewApi.createStatusChange(data),
    onSuccess: (_, variables) => {
      // Invalidate feedback lists
      queryClient.invalidateQueries({
        queryKey: interviewFeedbackKeys.lists(),
      })
      // Invalidate position candidates list (status changed)
      queryClient.invalidateQueries({
        queryKey: ['positions', 'detail', variables.position_id, 'candidates'],
      })
      // Invalidate candidate detail (global status may have changed)
      queryClient.invalidateQueries({
        queryKey: ['candidates', 'detail', variables.candidate_id],
      })
    },
  })
}

/**
 * Hook: Update interview feedback
 * 更新面试反馈
 */
export function useUpdateInterviewFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateInterviewFeedbackRequest }) =>
      interviewApi.updateInterviewFeedback(id, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific feedback detail
      queryClient.invalidateQueries({
        queryKey: interviewFeedbackKeys.detail(variables.id),
      })
      // Invalidate feedback lists
      queryClient.invalidateQueries({
        queryKey: interviewFeedbackKeys.lists(),
      })
    },
  })
}
