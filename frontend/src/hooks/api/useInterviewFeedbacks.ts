/**
 * Interview Feedback API Hooks (v2.0)
 * 面试反馈 API Hooks - 使用 React Query
 *
 * v2.0 Changes:
 * - Support three record types: interview, ai, status
 * - Replace includeStatusChanges with recordType parameter
 * - interviewer field changed from number to UUID string
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  CreateInterviewFeedbackRequest,
  CreateInterviewEvaluationRequest,
  CreateAIEvaluationRequest,
  CreateStatusChangeRequest,
  UpdateInterviewFeedbackRequest,
} from '@/types'
import * as interviewApi from '@/services/interviewApi'

/**
 * Query key factory for interview feedbacks (v2.0)
 * 面试反馈查询键工厂
 */
export const interviewFeedbackKeys = {
  all: ['interview-feedbacks'] as const,
  lists: () => [...interviewFeedbackKeys.all, 'list'] as const,
  list: (candidateId: number, positionId: number, recordType?: 'interview' | 'ai' | 'status') =>
    [...interviewFeedbackKeys.lists(), { candidateId, positionId, recordType }] as const,
  candidateRecords: (candidateId: number, recordType?: 'interview' | 'ai' | 'status') =>
    [...interviewFeedbackKeys.all, 'candidate-records', { candidateId, recordType }] as const,
  details: () => [...interviewFeedbackKeys.all, 'detail'] as const,
  detail: (id: number) => [...interviewFeedbackKeys.details(), id] as const,
  byInterviewer: (interviewerId: string) =>  // v2.0: UUID string instead of number
    [...interviewFeedbackKeys.all, 'by-interviewer', interviewerId] as const,
}

/**
 * Hook: Get all execution records for a candidate (across all positions)
 * 获取候选人的所有执行记录（跨所有职位）
 *
 * @param candidateId - Candidate ID
 * @param recordType - Filter by type: 'interview', 'ai', 'status', or undefined (all)
 * @param enabled - Enable/disable query
 */
export function useCandidateExecutionRecords(
  candidateId: number,
  recordType?: 'interview' | 'ai' | 'status',
  enabled = true
) {
  return useQuery({
    queryKey: interviewFeedbackKeys.candidateRecords(candidateId, recordType),
    queryFn: () => interviewApi.getCandidateExecutionRecords(candidateId, recordType),
    enabled,
  })
}

/**
 * Hook: Get feedback records for candidate-position pair
 * 获取候选人-职位的反馈记录
 *
 * @param candidateId - Candidate ID
 * @param positionId - Position ID
 * @param recordType - Filter by type: 'interview', 'ai', 'status', or undefined (all)
 * @param enabled - Enable/disable query
 */
export function useInterviewFeedbacks(
  candidateId: number,
  positionId: number,
  recordType?: 'interview' | 'ai' | 'status',
  enabled = true
) {
  return useQuery({
    queryKey: interviewFeedbackKeys.list(candidateId, positionId, recordType),
    queryFn: () => interviewApi.getInterviewFeedbacks(candidateId, positionId, recordType),
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
 * Hook: Get feedbacks by interviewer (v2.0)
 * 根据面试官获取反馈列表
 *
 * @param interviewerId - Interviewer UUID (v2.0: string instead of number)
 * @param enabled - Enable/disable query
 */
export function useInterviewFeedbacksByInterviewer(interviewerId: string, enabled = true) {
  return useQuery({
    queryKey: interviewFeedbackKeys.byInterviewer(interviewerId),
    queryFn: () => interviewApi.getInterviewFeedbacksByInterviewer(interviewerId),
    enabled,
  })
}

/**
 * Hook: Create interview feedback (v2.0 - Generic)
 * 创建面试反馈（通用）
 *
 * For convenience, prefer using:
 * - useCreateInterviewEvaluation() for human interviews
 * - useCreateAIEvaluation() for AI evaluations
 * - useCreateStatusChange() for status updates
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
      if (variables.position_id) {
        queryClient.invalidateQueries({
          queryKey: ['positions', 'detail', variables.position_id, 'candidates'],
        })
      }
    },
  })
}

/**
 * Hook: Create interview evaluation (v2.0 - Convenience)
 * 创建面试评价（便捷方法，推荐使用）
 */
export function useCreateInterviewEvaluation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateInterviewEvaluationRequest) =>
      interviewApi.createInterviewEvaluation(data),
    onSuccess: (_, variables) => {
      // Invalidate feedback lists
      queryClient.invalidateQueries({
        queryKey: interviewFeedbackKeys.lists(),
      })
      // Invalidate position candidates list
      if (variables.position_id) {
        queryClient.invalidateQueries({
          queryKey: ['positions', 'detail', variables.position_id, 'candidates'],
        })
      }
    },
  })
}

/**
 * Hook: Create AI evaluation (v2.0 - Convenience)
 * 创建 AI 评价（便捷方法）
 */
export function useCreateAIEvaluation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAIEvaluationRequest) =>
      interviewApi.createAIEvaluation(data),
    onSuccess: (_, variables) => {
      // Invalidate feedback lists
      queryClient.invalidateQueries({
        queryKey: interviewFeedbackKeys.lists(),
      })
      // Invalidate position candidates list
      if (variables.position_id) {
        queryClient.invalidateQueries({
          queryKey: ['positions', 'detail', variables.position_id, 'candidates'],
        })
      }
    },
  })
}

/**
 * Hook: Create status change record (v2.0)
 * 创建状态变更记录
 */
export function useCreateStatusChange() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateStatusChangeRequest) =>
      interviewApi.createStatusChange(data),
    onSuccess: (_, variables) => {
      // Invalidate feedback lists
      queryClient.invalidateQueries({
        queryKey: interviewFeedbackKeys.lists(),
      })
      // Invalidate position candidates list (status changed)
      if (variables.position_id) {
        queryClient.invalidateQueries({
          queryKey: ['positions', 'detail', variables.position_id, 'candidates'],
        })
      }
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
