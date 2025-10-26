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
  WorkExperience,
  EducationBackground,
  JobRequirement,
  CandidateStatus,
  CandidateScore,
  InterviewRound,
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
} from './api'
