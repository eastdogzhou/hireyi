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
 * Interviewer Type (v2.0)
 * 面试官/操作者类型
 */
export type InterviewerType = 'user' | 'agent' | 'system'

/**
 * Interview Rating (v2.0)
 * 面试评分 (1-4 scale)
 */
export type InterviewRating = 1 | 2 | 3 | 4

/**
 * AI Rating (v2.0)
 * AI 评分 (1-10 scale)
 */
export type AIRating = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

/**
 * Feedback Status (v2.0)
 * 状态枚举 (用于状态变更记录)
 */
export type FeedbackStatus =
  | 'screening'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn'

/**
 * Interview Feedback (v2.0)
 * 执行记录 - 支持三种互斥记录类型：
 *   1. 面试评价 (interview_rating 非空)
 *   2. AI 评价 (ai_rating 非空)
 *   3. 状态变更 (new_status 非空)
 */
export interface InterviewFeedback {
  id: number
  /** Position ID (nullable: 支持候选人级别的记录) */
  position_id: number | null
  candidate_id: number
  /** Interviewer UUID (v2.0: changed from number to UUID string) */
  interviewer: string
  /** Interviewer type (v2.0: new field) */
  interviewer_type: InterviewerType
  /** Interview date (required in v2.0) */
  interview_date: string
  /** Feedback comments or status change reason (required in v2.0) */
  comments: string

  // Three mutually exclusive record types (exactly one must be non-null)
  /** Interview rating (1-4), null for non-interview records */
  interview_rating: InterviewRating | null
  /** AI rating (1-10), null for non-AI records */
  ai_rating: AIRating | null
  /** New status for status change records, null for non-status records */
  new_status: FeedbackStatus | null

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

/**
 * Member Role
 * 成员角色 - 匹配后端 role-based 系统
 */
export type MemberRole = 'creator' | 'admin' | 'interviewer' | 'pending'

/**
 * Organization Interface
 * 组织信息
 */
export interface Organization {
  id: string
  name: string
  org_code: string
  description?: string | null
  created_by: string
  created_at: string
  updated_at: string

  // Populated fields
  role?: MemberRole
}

/**
 * Organization With Role Interface
 * 组织信息（包含用户角色）
 */
export interface OrganizationWithRole {
  id: string
  name: string
  org_code: string
  my_role: MemberRole
  created_at: string
}

/**
 * Organization Member Interface
 * 组织成员信息（匹配后端 OrganizationMemberInfo）
 */
export interface OrganizationMember {
  id: number
  org_id: string
  user_id: string
  user_name: string
  user_email: string
  role: MemberRole
  requested_at: string  // When member requested to join
  approved_at?: string | null  // When member was approved
  approved_by?: string | null  // UUID of user who approved
}
