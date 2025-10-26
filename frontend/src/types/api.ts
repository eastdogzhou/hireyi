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
 * Create Interview Feedback Request
 * 创建面试反馈请求
 */
export interface CreateInterviewFeedbackRequest {
  position_id: number
  candidate_id: number
  interviewer: number
  rating: number
  comments?: string
  interview_date?: string
}

/**
 * Update Interview Feedback Request
 * 更新面试反馈请求
 */
export interface UpdateInterviewFeedbackRequest {
  rating?: number
  comments?: string
  interview_date?: string
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
