/**
 * API Hooks Index
 * 统一导出所有 API Hooks
 */

// Candidate hooks
export {
  useCandidates,
  useCandidate,
  useCreateCandidate,
  useUpdateCandidate,
  useDeleteCandidate,
  useUploadResume,
  useBatchUploadResumes,
  candidateKeys,
} from './useCandidates'

// Position hooks
export {
  usePositions,
  usePosition,
  useCreatePosition,
  useUpdatePosition,
  useUpdatePositionStatus,
  useDeletePosition,
  usePositionCandidates,
  useSmartScreening,
  useRecalculateScores,
  positionKeys,
} from './usePositions'

// Interview feedback hooks
export {
  useInterviewFeedbacks,
  useInterviewFeedback,
  useInterviewFeedbacksByInterviewer,
  useCreateInterviewFeedback,
  useCreateStatusChange,
  useUpdateInterviewFeedback,
  interviewFeedbackKeys,
} from './useInterviewFeedbacks'

// Organization hooks
export {
  useMyOrganizations,
  useOrganizationMembers,
  useCreateOrganization,
  useJoinOrganization,
  useApproveMember,
  useUpdateMemberRole,
  useRemoveMember,
  organizationKeys,
} from './useOrganizations'
