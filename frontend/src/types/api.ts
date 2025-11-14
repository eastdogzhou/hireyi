/**
 * API Response Types
 * API 响应类型定义
 */

import type { Candidate, PositionCandidate } from './models'

/**
 * Generic Paginated Response
 * 分页响应通用类型
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

/**
 * API Error Response
 * API 错误响应
 */
export interface ApiError {
  error: string
  detail?: string
  status_code: number
}

/**
 * Upload Response
 * 文件上传响应
 */
export interface UploadResponse {
  file_url: string
  file_name: string
  file_size: number
  uploaded_at: string
}

/**
 * Resume Parse Response
 * 简历解析响应
 */
export interface ResumeParseResponse {
  candidate: Candidate
  /** Parsing confidence score (0-1) */
  confidence: number
  /** Fields that were successfully parsed */
  parsed_fields: string[]
  /** Fields that failed to parse or are missing */
  missing_fields: string[]
}

/**
 * Smart Screening Response
 * 智能筛选响应
 */
export interface SmartScreeningResponse {
  /** Number of candidates screened */
  total_screened: number
  /** Number of candidates matched */
  total_matched: number
  /** List of matched candidates with scores */
  matches: PositionCandidate[]
  /** Execution time in seconds */
  execution_time: number
}

/**
 * Candidate List Query Params
 * 候选人列表查询参数
 */
export interface CandidateListParams {
  page?: number
  page_size?: number
  /** Search by name (fuzzy) */
  name?: string
  /** Filter by skills (contains any) */
  skills?: string[]
  /** Filter by minimum score */
  min_score?: number
  /** Filter by created date range */
  created_after?: string
  created_before?: string
  /** Sort field */
  sort_by?: 'score' | 'created_at' | 'updated_at'
  /** Sort order */
  sort_order?: 'asc' | 'desc'
}

/**
 * Position List Query Params
 * 职位列表查询参数
 */
export interface PositionListParams {
  page?: number
  page_size?: number
  /** Search by title (fuzzy) */
  title?: string
  /** Filter by department */
  department?: string
  /** Filter by created date range */
  created_after?: string
  created_before?: string
  /** Sort field */
  sort_by?: 'created_at' | 'updated_at' | 'title'
  /** Sort order */
  sort_order?: 'asc' | 'desc'
}

/**
 * Position Candidate List Query Params
 * 职位候选人列表查询参数
 */
export interface PositionCandidateListParams {
  page?: number
  page_size?: number
  /** Filter by status */
  status?: string
  /** Search by candidate name */
  candidate_name?: string
  /** Sort field */
  sort_by?: 'overall_score_numeric' | 'created_at' | 'updated_at'
  /** Sort order */
  sort_order?: 'asc' | 'desc'
}

/**
 * Create Candidate Request
 * 创建候选人请求
 */
export interface CreateCandidateRequest {
  name: string
  phone: string
  email: string
  skills: string[]
  work_experience: any[]
  education_background: any[]
  highlights: string[]
  resume_file: string
  resume_md5: string
  score: number
}

/**
 * Update Candidate Request
 * 更新候选人请求
 */
export interface UpdateCandidateRequest {
  name?: string
  phone?: string
  email?: string
  skills?: string[]
  work_experience?: any[]
  education_background?: any[]
  highlights?: string[]
  score?: number
}

/**
 * Create Position Request
 * 创建职位请求
 */
export interface CreatePositionRequest {
  title: string
  department: string
  jd: string
  requirements: any[]
  salary_range?: string
  created_by: number
}

/**
 * Update Position Request
 * 更新职位请求
 */
export interface UpdatePositionRequest {
  title?: string
  department?: string
  jd?: string
  requirements?: any[]
  salary_range?: string
}

/**
 * Create Interview Feedback Request (v2.0 - Generic)
 * 创建面试反馈请求（通用，支持三种记录类型）
 *
 * Must specify exactly one of: interview_rating, ai_rating, or new_status
 */
export interface CreateInterviewFeedbackRequest {
  candidate_id: number
  position_id?: number  // Optional: allows candidate-level records
  interviewer: string   // UUID string (v2.0: changed from number)
  interviewer_type: 'user' | 'agent' | 'system'  // v2.0: new field
  interview_date?: string  // Optional, auto-filled by backend if not provided
  comments: string  // Required

  // Three mutually exclusive type fields (exactly one must be provided)
  interview_rating?: 1 | 2 | 3 | 4  // Interview evaluation (1-4 scale)
  ai_rating?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10  // AI evaluation (1-10 scale)
  new_status?: 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn'  // Status change
}

/**
 * Create Interview Evaluation Request (v2.0 - Convenience)
 * 创建面试评价请求（便捷类型）
 */
export interface CreateInterviewEvaluationRequest {
  candidate_id: number
  position_id?: number
  interviewer: string  // UUID string
  interviewer_type?: 'user'  // Default: 'user'
  interview_date: string  // Required for interview evaluations
  comments: string
  interview_rating: 1 | 2 | 3 | 4  // Required (1-4 scale)
}

/**
 * Create AI Evaluation Request (v2.0 - Convenience)
 * 创建 AI 评价请求（便捷类型）
 */
export interface CreateAIEvaluationRequest {
  candidate_id: number
  position_id?: number
  interviewer: string  // AI agent UUID
  interviewer_type?: 'agent'  // Default: 'agent'
  comments: string
  ai_rating: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10  // Required (1-10 scale)
}

/**
 * Create Status Change Request (v2.0 - Convenience)
 * 创建状态变更请求（便捷类型）
 */
export interface CreateStatusChangeRequest {
  candidate_id: number
  position_id?: number  // Optional: allows candidate-level status changes
  interviewer: string  // User UUID
  interviewer_type?: 'user' | 'system'  // Default: 'user'
  new_status: 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn'  // Required
  comments: string  // Reason for status change
}

/**
 * Update Interview Feedback Request (v2.0)
 * 更新面试反馈请求
 *
 * Note: Cannot change record type (interview/AI/status)
 * Only updates content within the same type
 */
export interface UpdateInterviewFeedbackRequest {
  interview_rating?: 1 | 2 | 3 | 4
  ai_rating?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  comments?: string
  interview_date?: string
}

/**
 * Feedback List Response (v2.0)
 * 面试反馈列表响应
 */
export interface FeedbackListResponse {
  feedbacks: import('./models').InterviewFeedback[]
  total: number
  limit: number
  offset: number
}

/**
 * Feedback Query Params (v2.0)
 * 面试反馈查询参数（支持类型筛选）
 */
export interface FeedbackQueryParams {
  candidate_id: number
  position_id?: number
  /** Filter by record type: 'interview', 'ai', 'status', or undefined (all) */
  record_type?: 'interview' | 'ai' | 'status'
  limit?: number
  offset?: number
}

/**
 * Smart Screening Request
 * 智能筛选请求
 */
export interface SmartScreeningRequest {
  position_id: number
  /** Maximum number of candidates to return */
  limit?: number
  /** Minimum overall score threshold (1-4) */
  min_score?: number
}

/**
 * Batch Upload Resume Request
 * 批量上传简历请求
 */
export interface BatchUploadResumeRequest {
  files: File[]
}

/**
 * Batch Upload Result
 * 批量上传结果
 */
export interface BatchUploadResult {
  total: number
  successful: number
  failed: number
  results: Array<{
    file_name: string
    status: string  // "success" | "failed"
    candidate?: Candidate
    error?: string
  }>
}

/**
 * Create Organization Request
 * 创建组织请求
 */
export interface CreateOrganizationRequest {
  name: string
  description?: string
}

/**
 * Join Organization Request
 * 加入组织请求
 */
export interface JoinOrganizationRequest {
  org_code: string
}

/**
 * Approval Request
 * 审批请求
 */
export interface ApprovalRequest {
  member_id: number
  action: 'approve' | 'reject'
}

/**
 * Role Update Request
 * 角色更新请求
 */
export interface RoleUpdateRequest {
  member_id: number
  new_role: 'owner' | 'admin' | 'member'
}
