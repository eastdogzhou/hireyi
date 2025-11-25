"""Prompt templates for various AI tasks.

This module centralizes all prompt templates used in the resume screening system.
Templates are designed for structured output and should be used with JSON mode.
"""

# Resume Parsing Prompt
# NOTE: Output structure aligns with database schema (candidates table)
# Only extracts fields that will be stored in the database
RESUME_PARSING_PROMPT = """你是一个专业的简历解析助手。请从以下简历文本中提取关键信息。

要求：
1. 提取候选人的核心信息（姓名、联系方式、技能、亮点、工作经历、教育背景等）
2. 输出必须是有效的 JSON 格式
3. 对于缺失的字段，使用 null 或空数组
4. 技能标签需要标准化（例如："js" -> "JavaScript", "react" -> "React"）
5. 亮点应提炼候选人的核心竞争力，不超过5条
6. 工作经历和教育背景按照指定格式整理

输出 JSON Schema：
{{
  "name": "string (候选人姓名)",
  "phone": "string or null (手机号，保留数字和连字符)",
  "email": "string or null (邮箱地址)",
  "skills": [
    "string (技能标签，已标准化。例如：Python, React, PostgreSQL)"
  ],
  "highlights": [
    "string (候选人亮点，3-5 条核心竞争力。例如：5年全栈开发经验，熟悉微服务架构)"
  ],
  "years_of_experience": "number or null (工作年限，从第一份工作开始计算)",
  "education_level": "string or null (最高学历：本科/硕士/博士/大专等)",
  "recent_company": "string or null (最近一家公司名称)",
  "recent_position": "string or null (最近职位名称)",
  "work_experience": "string or null (工作经历，格式见下方说明)",
  "education_background": "string or null (教育背景，格式见下方说明)"
}}

## 工作经历格式（work_experience）
每段工作经历用两行表示，多段之间用空行分隔：
第1行：起止时间 + 公司名称 + 职位（例如：2020.01-2023.06 阿里巴巴 高级前端工程师）
第2行：这段工作的一句话总结，10-20字（例如：负责电商平台前端架构设计与性能优化）

示例：
```
2020.01-2023.06 阿里巴巴 高级前端工程师
负责电商平台前端架构设计与性能优化

2018.06-2019.12 腾讯 前端工程师
开发微信小程序商城，用户量达100万
```

## 教育背景格式（education_background）
每段教育经历用两行表示，多段之间用空行分隔：
第1行：起止时间 + 学校名称 + 学历（例如：2014.09-2018.06 北京大学 本科）
第2行：这段教育的主要收获，10-20字（例如：计算机科学专业，GPA 3.8）

示例：
```
2014.09-2018.06 北京大学 本科
计算机科学专业，GPA 3.8，获国家奖学金

2018.09-2021.06 清华大学 硕士
软件工程专业，研究方向：分布式系统
```

说明：
- highlights 应该突出候选人的优势和特点，避免空洞的描述
- skills 应该只包含技术技能，不包括软技能
- years_of_experience 如果简历未明确说明，可以根据工作经历推算
- work_experience 和 education_background 作为字符串存储，按照上述格式组织
- 如果简历中没有工作经历或教育背景，对应字段返回 null

简历文本：
{resume_text}

请直接输出 JSON，不要包含任何其他说明文字。"""


# Resume-Based Global Scoring Prompt
# New 0-10 scale scoring based on pure resume content
# Used to evaluate candidate quality independent of any position
RESUME_GLOBAL_SCORING_PROMPT = """你是一个专业的简历评估专家。请根据候选人的简历纯文本内容，给出一个全局综合评分（0-10分制）。

评分完全基于简历内容，不依赖任何外部信息，体现候选人的综合素质。

## 简历内容
{resume_text}

## 评分标准（总分 0-10 分）

请根据以下 6 个维度进行评分，并在输出 JSON 中给出每个维度的具体分数：

### 1. 院校评分 (school_score: 0-3 分)
- **3 分**：C9 院校（清华、北大、复旦、上交、浙大、南大、中科大、哈工大、西交）
- **2 分**：985 院校或 QS 排名 ≤100 的海外院校
- **1 分**：211 院校
- **0.5 分**：双一流院校
- **0 分**：其他院校

### 2. 专业匹配度 (major_score: 0-2 分)
- **2 分**：计算机科学/软件工程 学硕
- **1.5 分**：数学/物理/AI 专硕
- **1 分**：其他专业

### 3. 学历评分 (degree_score: 0-2 分)
- **2 分**：博士
- **1.5 分**：学术型硕士
- **1 分**：专业型硕士
- **0.5 分**：本科
- **0 分**：大专及以下

### 4. GPA 评分 (gpa_score: 0-1 分)
- **1 分**：GPA ≥ 3.8（或百分制 ≥ 90）
- **0.5 分**：GPA ≥ 3.5（或百分制 ≥ 85）
- **0 分**：GPA < 3.5 或未提及

### 5. AI 相关经验 (ai_experience_score: 0-1 分)
- **1 分**：有 AI/机器学习/深度学习相关项目或工作经验
- **0.5 分**：无相关经验

### 6. 国家级竞赛 (competition_score: 0-1 分)
- **1 分**：国家级竞赛一等奖（ACM、数学建模、挑战杯等）
- **0.5 分**：国家级竞赛二等奖
- **0 分**：三等奖或未获奖

## 评分说明
1. 如果简历中某项信息缺失（如未提及 GPA），该项按最低分计算
2. 院校评分以最高学历的院校为准
3. 专业匹配度以最高学历的专业为准
4. AI 经验包括：课程项目、毕业设计、实习、工作中的 AI 相关内容
5. 国家级竞赛仅包括正式的全国性比赛（省级不计入）

## 输出格式
请严格按照以下 JSON 格式输出，代码将自动计算总分（各维度分数相加）：

{{
  "school_score": 0.0,        // 院校评分 (0-3)
  "major_score": 0.0,         // 专业匹配度 (0-2)
  "degree_score": 0.0,        // 学历评分 (0-2)
  "gpa_score": 0.0,           // GPA 评分 (0-1)
  "ai_experience_score": 0.0, // AI 经验 (0-1)
  "competition_score": 0.0,   // 国家级竞赛 (0-1)
  "reason": "string (综合评分理由，200字以内，说明各维度的评分依据)"
}}

**重要**: 请直接输出 JSON，不要包含任何其他说明文字。"""


# Candidate-Position Matching Prompt
CANDIDATE_MATCHING_PROMPT = """你是一个专业的招聘顾问。请评估候选人与岗位的匹配度，并给出详细的评分和理由。

## 候选人信息
{candidate_info}

## 岗位信息
职位名称: {position_title}
{jd_content}

## 评估维度
1. **相关度评分 (relevance_score, 1-4)**
   - 技能匹配度：候选人技能与岗位要求的重合度
   - 行业经验：相关行业/领域的工作经验
   - 职位级别：当前职位与目标职位的匹配度

2. **适配度评分 (fit_score, 1-4)**
   - 教育背景：学历和专业的匹配度
   - 工作年限：经验是否符合岗位要求
   - 成长潜力：学习能力、项目经验的质量
   - 稳定性：工作连续性、跳槽频率

## 评分标准
- 4 分：非常匹配，强烈推荐
- 3 分：较为匹配，推荐
- 2 分：基本匹配，可考虑
- 1 分：不太匹配，不推荐

## 输出格式
请以 JSON 格式输出评估结果：

{{
  "relevance_score": "number (1-4)",
  "relevance_reason": "string (相关度评分理由，150字以内)",
  "fit_score": "number (1-4)",
  "fit_reason": "string (适配度评分理由，150字以内)",
  "strengths": ["string (候选人优势，3-5 条)"],
  "concerns": ["string (潜在问题或不足，2-3 条)"],
  "recommendation": "string (综合推荐意见，100字以内)"
}}

请直接输出 JSON，不要包含任何其他说明文字。"""


# Candidate Screening Prompt (for batch filtering)
CANDIDATE_SCREENING_PROMPT = """你是一个招聘预筛选助手。请快速评估候选人是否符合岗位的基本要求。

## 岗位基本要求
{position_requirements}

## 候选人信息
姓名: {candidate_name}
技能: {candidate_skills}
工作年限: {years_of_experience} 年
最近职位: {recent_position}
教育背景: {education}

## 筛选标准
请快速判断候选人是否满足以下条件：
1. 必要技能是否具备（至少 50% 匹配）
2. 工作年限是否符合要求（允许 ±1 年浮动）
3. 教育背景是否达标
4. 行业经验是否相关

## 输出格式
{{
  "pass": "boolean (true=通过预筛选, false=不通过)",
  "reason": "string (简要理由，50字以内)",
  "match_rate": "number (技能匹配率，0-100)"
}}

请直接输出 JSON。"""


def format_candidate_info(candidate_data: dict) -> str:
    """Format candidate data for prompt insertion.

    :param candidate_data: Candidate data dictionary (from database)
    :return: Formatted string for prompt
    """
    info_parts = [
        f"姓名: {candidate_data.get('name', 'N/A')}",
        f"工作年限: {candidate_data.get('years_of_experience', 'N/A')} 年",
        f"技能: {', '.join(candidate_data.get('skills', []))}",
    ]

    # Contact info
    phone = candidate_data.get("phone")
    email = candidate_data.get("email")
    if phone or email:
        contact_parts = []
        if phone:
            contact_parts.append(f"电话: {phone}")
        if email:
            contact_parts.append(f"邮箱: {email}")
        info_parts.append(f"联系方式: {', '.join(contact_parts)}")

    # Education (from additional fields, optional)
    education_level = candidate_data.get("education_level")
    if education_level:
        info_parts.append(f"教育背景: {education_level}")

    # Recent work (from additional fields, optional)
    recent_company = candidate_data.get("recent_company")
    recent_position = candidate_data.get("recent_position")
    if recent_company or recent_position:
        work_info = []
        if recent_company:
            work_info.append(recent_company)
        if recent_position:
            work_info.append(recent_position)
        info_parts.append(f"最近职位: {' - '.join(work_info)}")

    # Highlights (stored as TEXT in database, split by newlines)
    highlights = candidate_data.get("highlights", "")
    if highlights:
        if isinstance(highlights, str):
            # Split by newlines if stored as TEXT
            highlight_list = [h.strip() for h in highlights.split("\n") if h.strip()]
        else:
            # If it's already a list
            highlight_list = highlights

        if highlight_list:
            info_parts.append("\n候选人亮点:")
            for i, hl in enumerate(highlight_list, 1):
                info_parts.append(f"  {i}. {hl}")

    return "\n".join(info_parts)
