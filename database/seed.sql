-- ============================================================================
-- AI Resume Scanning System - Seed Data
-- ============================================================================
-- Description: Initial test data for development and testing
-- NOTE: This script is idempotent - it will clear and reload test data
-- ============================================================================

-- ============================================================================
-- 0. CLEANUP (for idempotency)
-- ============================================================================
-- Clear all test data before inserting (cascade to dependent tables)
TRUNCATE TABLE users, candidates, positions, position_candidates, interview_feedbacks RESTART IDENTITY CASCADE;


-- ============================================================================
-- 1. USERS
-- ============================================================================
INSERT INTO users (email, name, role) VALUES
('hr@example.com', '张经理', 'recruiter'),
('tech@example.com', '李工', 'recruiter'),
('admin@example.com', '王总', 'admin');


-- ============================================================================
-- 2. CANDIDATES
-- ============================================================================
INSERT INTO candidates (name, phone, email, skills, highlights, years_of_experience, education_level, recent_company, recent_position, score, resume_file, resume_md5) VALUES
(
    '张三',
    '13812345678',
    'zhangsan@example.com',
    ARRAY['Python', 'React', 'PostgreSQL', 'FastAPI'],
    '5年全栈开发经验，具备大型项目架构能力，熟悉微服务架构和云原生技术',
    5,
    '本科',
    '阿里巴巴',
    '高级全栈工程师',
    4,
    'https://oss-bucket.aliyuncs.com/resumes/zhangsan_1697356800.pdf',
    'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'
),
(
    '李四',
    '13998765432',
    'lisi@example.com',
    ARRAY['Java', 'Spring Boot', 'MySQL', 'Redis'],
    '3年后端开发经验，熟悉微服务架构，有高并发系统优化经验',
    3,
    '本科',
    '腾讯',
    '后端开发工程师',
    3,
    'https://oss-bucket.aliyuncs.com/resumes/lisi_1697356801.pdf',
    'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7'
),
(
    '王五',
    '13765432109',
    'wangwu@example.com',
    ARRAY['JavaScript', 'Vue', 'Node.js', 'TypeScript'],
    '4年前端开发经验，精通Vue生态，有组件库开发经验',
    4,
    '硕士',
    '字节跳动',
    '前端技术专家',
    3,
    'https://oss-bucket.aliyuncs.com/resumes/wangwu_1697356802.pdf',
    'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8'
),
(
    '赵六',
    '13687654321',
    'zhaoliu@example.com',
    ARRAY['Python', 'Django', 'Docker', 'Kubernetes'],
    '6年后端开发经验，DevOps实践经验丰富，擅长系统架构设计',
    6,
    '硕士',
    '美团',
    '资深后端工程师',
    4,
    'https://oss-bucket.aliyuncs.com/resumes/zhaoliu_1697356803.pdf',
    'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9'
),
(
    '孙七',
    NULL,
    'sunqi@example.com',
    ARRAY['Go', 'Microservices', 'gRPC', 'MongoDB'],
    '2年Go语言开发经验，熟悉微服务架构模式',
    2,
    '本科',
    '小米',
    'Go开发工程师',
    2,
    'https://oss-bucket.aliyuncs.com/resumes/sunqi_1697356804.pdf',
    'e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0'
);


-- ============================================================================
-- 3. POSITIONS
-- ============================================================================
INSERT INTO positions (title, department, jd, requirements, status, created_by) VALUES
(
    '高级全栈工程师',
    '技术部',
    '负责公司核心产品的全栈开发工作，包括前后端架构设计、代码实现和技术攻关。要求具备扎实的编程基础，熟悉现代Web开发技术栈，有大型项目经验者优先。',
    '{"skills": ["Python", "React", "PostgreSQL"], "experience": "3年以上全栈开发经验", "education": "本科及以上学历"}'::jsonb,
    'open',
    1
),
(
    '后端开发工程师',
    '技术部',
    '负责后端服务开发，包括API设计、数据库设计、性能优化等工作。需要有扎实的后端开发经验，熟悉常用开发框架和中间件。',
    '{"skills": ["Java", "Spring Boot", "MySQL"], "experience": "2年以上后端开发经验", "education": "本科及以上学历"}'::jsonb,
    'open',
    1
),
(
    '前端开发工程师',
    '技术部',
    '负责Web前端开发工作，包括页面开发、组件封装、性能优化等。要求熟练掌握主流前端框架，有良好的代码规范和工程化意识。',
    '{"skills": ["Vue", "TypeScript", "Webpack"], "experience": "2年以上前端开发经验", "education": "本科及以上学历"}'::jsonb,
    'open',
    2
);


-- ============================================================================
-- 4. POSITION CANDIDATES
-- ============================================================================
-- 张三应聘高级全栈工程师
INSERT INTO position_candidates (position_id, candidate_id, relevance_score, fit_score, overall_score, overall_score_numeric, current_status) VALUES
(1, 1, 4, 4, 4, 100, 'interview');

-- 李四应聘后端开发工程师
INSERT INTO position_candidates (position_id, candidate_id, relevance_score, fit_score, overall_score, overall_score_numeric, current_status) VALUES
(2, 2, 3, 3, 3, 75, 'screening');

-- 王五应聘前端开发工程师
INSERT INTO position_candidates (position_id, candidate_id, relevance_score, fit_score, overall_score, overall_score_numeric, current_status) VALUES
(3, 3, 4, 3, 3, 80, 'interview');

-- 赵六应聘高级全栈工程师
INSERT INTO position_candidates (position_id, candidate_id, relevance_score, fit_score, overall_score, overall_score_numeric, current_status) VALUES
(1, 4, 3, 4, 4, 85, 'screening');


-- ============================================================================
-- 5. INTERVIEW FEEDBACKS
-- ============================================================================
-- 张三的面试评价
INSERT INTO interview_feedbacks (candidate_id, position_id, interviewer, rating, comments, interview_date, is_status_change) VALUES
(
    1, 1, 2, 4,
    '技术基础扎实，沟通能力良好，项目经验丰富，建议进入二面',
    '2024-10-15',
    false
);

-- 张三的状态变更记录
INSERT INTO interview_feedbacks (candidate_id, position_id, interviewer, comments, new_status, is_status_change) VALUES
(
    1, 1, 1,
    '一面通过，安排二面',
    'interview',
    true
);

-- 王五的面试评价
INSERT INTO interview_feedbacks (candidate_id, position_id, interviewer, rating, comments, interview_date, is_status_change) VALUES
(
    3, 3, 2, 3,
    '前端技能符合要求，但项目经验稍显不足，需要进一步考察',
    '2024-10-16',
    false
);


-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
