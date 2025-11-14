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
  // v2.0: Interview Feedback types
  InterviewerType,
  InterviewRating,
  AIRating,
  FeedbackStatus,
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
  // v2.0: Interview Feedback API types
  CreateInterviewEvaluationRequest,
  CreateAIEvaluationRequest,
  CreateStatusChangeRequest,
  FeedbackListResponse,
  FeedbackQueryParams,
} from './api'
