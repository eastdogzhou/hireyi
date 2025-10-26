/**
 * Domain Models
 * 领域模型类型定义 - 与后端数据库 schema 对应
 */

/**
 * Candidate Status (Global)
 * 候选人全局状态
 */
export type CandidateStatus = 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn'

/**
 * Candidate Score (4-tier rating)
 * 候选人评分 (1-4分)
 */
export type CandidateScore = 1 | 2 | 3 | 4

/**
 * Interview Round
 * 面试轮次
 */
export type InterviewRound = 'phone' | 'technical' | 'manager' | 'hr' | 'final'

/**
 * Candidate Interface
 * 候选人信息
 */
export interface Candidate {
  id: number
  name: string
  phone: string | null
  email: string | null
  /** Skills array extracted from resume */
  skills: string[]
  /** Work experience - can be structured array or formatted text string */
  work_experience?: WorkExperience[] | string | null
  /** Education background - can be structured array or formatted text string */
  education_background?: EducationBackground[] | string | null
  /** Key highlights/achievements - can be string or array */
  highlights?: string | string[] | null
  /** Years of experience */
  years_of_experience?: number | null
  /** Education level (本科, 硕士, etc.) */
  education_level?: string | null
  /** Most recent company */
  recent_company?: string | null
  /** Most recent position */
  recent_position?: string | null
  /** Full resume text content extracted by PyMuPDF (for search) */
  resume_text?: string | null
  /** Resume file URL in Aliyun OSS */
  resume_file: string
  /** MD5 hash of resume file for deduplication */
  resume_md5: string
  /** Candidate overall score (1-4) */
  score: CandidateScore | null
  created_at: string
  updated_at: string
  is_deleted?: boolean
}

/**
 * Work Experience Item
 * 工作经历条目
 */
export interface WorkExperience {
  company: string
  position: string
  start_date: string
  end_date: string | null // null means current job
  description: string
  achievements?: string[]
}

/**
 * Education Background Item
 * 教育背景条目
 */
export interface EducationBackground {
  school: string
  degree: string
  major: string
  start_date: string
  end_date: string
  gpa?: string
}

/**
 * Position Interface
 * 职位信息
 */
export interface Position {
  id: number
  title: string
  department: string
  /** Job description (full text) */
  jd: string
  /** Job requirements (structured) */
  requirements: JobRequirement[]
  /** Salary range (optional) */
  salary_range?: string
  /** Creator user ID */
  created_by: number
  created_at: string
  updated_at: string
  is_deleted: boolean
}

/**
 * Job Requirement Item
 * 职位要求条目
 */
export interface JobRequirement {
  category: 'skill' | 'experience' | 'education' | 'other'
  description: string
  required: boolean // true = must-have, false = nice-to-have
}

/**
 * Position-Candidate Association
 * 职位-候选人关联关系 (含评分)
 */
export interface PositionCandidate {
  id: number
  position_id: number
  candidate_id: number
  /** Skill relevance score (1-4) */
  relevance_score: CandidateScore
  /** Experience fit score (1-4) */
  fit_score: CandidateScore
  /** Overall match score for display (1-4) */
  overall_score: CandidateScore
  /** Precise numeric score for sorting (0-100) */
  overall_score_numeric: number
  /** Current status in this position's pipeline */
  current_status: CandidateStatus
  /** When candidate was associated with this position */
  created_at: string
  /** When association was last updated */
  updated_at: string
  is_deleted: boolean

  // Populated fields (from joins)
  candidate?: Candidate
  position?: Position
}

/**
 * Interview Feedback
 * 执行记录 - 双重用途：面试评价 + 状态变更记录
 */
export interface InterviewFeedback {
  id: number
  position_id: number
  candidate_id: number
  /** Interviewer/operator user ID */
  interviewer: number
  /** Interview rating (1-5), NULL for status changes */
  rating?: number | null
  /** Feedback comments or status change reason */
  comments?: string | null
  /** Interview date, NULL for status changes */
  interview_date?: string | null
  /** New status for status change records */
  new_status?: string | null
  /** True if this is a status change record */
  is_status_change: boolean
  /** Soft delete flag */
  is_deleted: boolean
  created_at: string

  // Populated fields (from joins)
  candidate?: Candidate
  position?: Position
  interviewer_info?: User
}

/**
 * User Interface
 * 用户信息 (MVP: 仅基础字段)
 */
export interface User {
  id: number
  name: string
  email: string
  role: string
  created_at: string
  updated_at: string
}
