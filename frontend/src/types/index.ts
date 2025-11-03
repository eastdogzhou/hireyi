/**
 * Types Index
 * 统一导出所有类型定义
 */

// Export all domain models
export type {
  Candidate,
  Position,
  PositionCandidate,
  InterviewFeedback,
  User,
  Organization,
  OrganizationWithRole,
  OrganizationMember,
  WorkExperience,
  EducationBackground,
  JobRequirement,
  CandidateStatus,
  CandidateScore,
  InterviewRound,
  MemberStatus,
  MemberRole,
} from './models'

// Export all API types
export type {
  PaginatedResponse,
  ApiError,
  UploadResponse,
  ResumeParseResponse,
  SmartScreeningResponse,
  CandidateListParams,
  PositionListParams,
  PositionCandidateListParams,
  CreateCandidateRequest,
  UpdateCandidateRequest,
  CreatePositionRequest,
  UpdatePositionRequest,
  CreateInterviewFeedbackRequest,
  UpdateInterviewFeedbackRequest,
  SmartScreeningRequest,
  BatchUploadResumeRequest,
  BatchUploadResult,
  CreateOrganizationRequest,
  JoinOrganizationRequest,
  ApprovalRequest,
  RoleUpdateRequest,
} from './api'
