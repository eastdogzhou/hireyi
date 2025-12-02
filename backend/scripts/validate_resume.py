#!/usr/bin/env python3
"""Resume parsing validation script.

This script validates the end-to-end resume parsing functionality
by parsing a resume file and displaying detailed results.

Supports all formats: PDF, DOCX, HTML, Markdown, Images (JPG/PNG/etc.)

Usage:
    uv run python scripts/validate_resume.py <resume_file_path>

Example:
    uv run python scripts/validate_resume.py data/resume/梁嘉仪_23岁_人力资源_广州.jpg
    uv run python scripts/validate_resume.py data/resume/sample.pdf
"""

import asyncio
import json
import sys
from pathlib import Path
from typing import Any

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.parser.resume_parser import ResumeParser


def print_separator(char: str = "=", length: int = 100) -> None:
    """Print a separator line."""
    print(char * length)


def print_header(text: str) -> None:
    """Print a section header."""
    print_separator()
    print(f"  {text}")
    print_separator()


def print_field(label: str, value: Any, indent: int = 0) -> None:
    """Print a labeled field with optional indentation."""
    indent_str = "  " * indent
    if value is None or value == "" or (isinstance(value, list) and len(value) == 0):
        print(f"{indent_str}{label}: <未提供>")
    elif isinstance(value, list):
        print(f"{indent_str}{label}: ({len(value)} 项)")
        for idx, item in enumerate(value, 1):
            if isinstance(item, dict):
                print(f"{indent_str}  [{idx}]")
                for key, val in item.items():
                    print(f"{indent_str}    {key}: {val}")
            else:
                print(f"{indent_str}  [{idx}] {item}")
    elif isinstance(value, dict):
        print(f"{indent_str}{label}:")
        for key, val in value.items():
            print(f"{indent_str}  {key}: {val}")
    else:
        print(f"{indent_str}{label}: {value}")


async def validate_resume(file_path: str) -> dict[str, Any]:
    """Validate resume parsing end-to-end.

    :param file_path: Path to resume file
    :return: Parsed candidate data
    """
    print_header("简历解析端到端验证")

    # Validate file exists
    resume_file = Path(file_path)
    if not resume_file.exists():
        print(f"\n❌ 错误: 文件不存在: {file_path}")
        sys.exit(1)

    # Display file info
    file_size = resume_file.stat().st_size
    file_ext = resume_file.suffix.lower()

    print(f"\n📄 文件信息:")
    print(f"  路径: {file_path}")
    print(f"  文件名: {resume_file.name}")
    print(f"  格式: {file_ext}")
    print(f"  大小: {file_size / 1024:.2f} KB")

    # Initialize parser
    print(f"\n🚀 初始化解析器...")
    parser = ResumeParser(
        default_model="openrouter/openai/gpt-4o",  # Can be overridden by .env
        default_temperature=0.3,
        max_retries=2,
    )

    # Parse resume
    print(f"\n🔄 开始解析简历...")
    print(f"  步骤 1: 检测文件格式")
    print(f"  步骤 2: 提取内容")
    print(f"  步骤 3: LLM 结构化提取")

    try:
        result = await parser.parse_resume(
            file_content=file_path,
            file_name=resume_file.name,
        )

        print(f"\n✅ 解析成功!")
        return result

    except Exception as e:
        print(f"\n❌ 解析失败!")
        print(f"  错误类型: {type(e).__name__}")
        print(f"  错误信息: {e}")
        import traceback
        print("\n完整错误堆栈:")
        traceback.print_exc()
        sys.exit(1)


def display_results(result: dict[str, Any]) -> None:
    """Display parsed resume results in a formatted manner.

    :param result: Parsed candidate data dictionary
    """
    print_header("📋 解析结果")

    # Basic Information
    print("\n👤 基本信息")
    print_field("姓名", result.get("name"), indent=1)
    print_field("性别", result.get("gender"), indent=1)
    print_field("年龄", result.get("age"), indent=1)
    print_field("工作年限", result.get("years_of_experience"), indent=1)
    print_field("学历水平", result.get("education_level"), indent=1)
    print_field("最近公司", result.get("recent_company"), indent=1)
    print_field("最近职位", result.get("recent_position"), indent=1)

    # Contact Information
    print("\n📞 联系方式")
    contact = result.get("contact", {})
    if isinstance(contact, dict):
        print_field("电话", contact.get("phone"), indent=1)
        print_field("邮箱", contact.get("email"), indent=1)
        print_field("地址", contact.get("address"), indent=1)
        print_field("微信", contact.get("wechat"), indent=1)
        print_field("LinkedIn", contact.get("linkedin"), indent=1)
        print_field("GitHub", contact.get("github"), indent=1)
    else:
        # Fallback: top-level phone/email fields
        print_field("电话", result.get("phone"), indent=1)
        print_field("邮箱", result.get("email"), indent=1)

    # Education
    print("\n🎓 教育背景")
    education = result.get("education", [])
    if isinstance(education, str):
        # If education is a string (from image parser), display as-is
        print(f"  {education}")
    else:
        print_field("教育经历", education, indent=1)

    # Work Experience
    print("\n💼 工作经历")
    work_exp = result.get("work_experience", [])
    if isinstance(work_exp, str):
        # If work_experience is a string (from image parser), display as-is
        print(f"  {work_exp}")
    else:
        print_field("工作经历", work_exp, indent=1)

    # Skills
    print("\n🛠️  技能")
    skills = result.get("skills", [])
    if skills and len(skills) > 0:
        print(f"  共 {len(skills)} 项技能:")
        for idx, skill in enumerate(skills, 1):
            print(f"    [{idx}] {skill}")
    else:
        print("  <未提取到技能信息>")

    # Highlights
    print("\n⭐ 候选人亮点")
    highlights = result.get("highlights", [])
    if highlights and len(highlights) > 0:
        for idx, highlight in enumerate(highlights, 1):
            print(f"  [{idx}] {highlight}")
    else:
        print("  <未提取到亮点信息>")

    # Resume Text (if available)
    resume_text = result.get("resume_text", "")
    if resume_text and resume_text != "(图片格式简历)":
        print("\n📝 提取的文本内容")
        print(f"  文本长度: {len(resume_text)} 字符")
        print(f"  文本预览 (前 200 字符):")
        print(f"  {resume_text[:200]}...")
    elif resume_text == "(图片格式简历)":
        print("\n📸 图片格式简历")
        print("  已使用 Vision LLM 直接从图片提取信息")

    # Additional metadata (if from image parser)
    if result.get("parsed_from_image"):
        print("\n🖼️  图片解析元数据")
        print_field("图片格式", result.get("image_mime_type"), indent=1)
        print_field("使用 Vision LLM", "是", indent=1)


def analyze_completeness(result: dict[str, Any]) -> None:
    """Analyze and display data completeness metrics.

    :param result: Parsed candidate data dictionary
    """
    print_header("📊 数据完整性分析")

    # Define checks
    checks = [
        ("姓名", bool(result.get("name")), "必需"),
        ("性别", bool(result.get("gender")), "推荐"),
        ("年龄", bool(result.get("age")), "推荐"),
        ("工作年限", bool(result.get("years_of_experience")), "重要"),
        ("学历水平", bool(result.get("education_level")), "重要"),
        ("最近公司", bool(result.get("recent_company")), "重要"),
        ("最近职位", bool(result.get("recent_position")), "重要"),
    ]

    # Contact checks
    contact = result.get("contact", {})
    if isinstance(contact, dict):
        has_phone = bool(contact.get("phone"))
        has_email = bool(contact.get("email"))
    else:
        has_phone = bool(result.get("phone"))
        has_email = bool(result.get("email"))

    checks.extend([
        ("联系电话", has_phone, "必需"),
        ("联系邮箱", has_email, "必需"),
    ])

    # Content checks
    education = result.get("education", [])
    work_exp = result.get("work_experience", [])
    skills = result.get("skills", [])
    highlights = result.get("highlights", [])

    has_education = bool(education) and (
        len(education) > 0 if isinstance(education, list) else len(education) > 20
    )
    has_work_exp = bool(work_exp) and (
        len(work_exp) > 0 if isinstance(work_exp, list) else len(work_exp) > 50
    )
    has_skills = bool(skills) and len(skills) > 0
    has_highlights = bool(highlights) and len(highlights) > 0

    checks.extend([
        ("教育背景", has_education, "必需"),
        ("工作经历", has_work_exp, "必需"),
        ("技能列表", has_skills, "推荐"),
        ("候选人亮点", has_highlights, "重要"),
    ])

    resume_text = result.get("resume_text", "")
    has_resume_text = len(resume_text) > 100 and resume_text != "(图片格式简历)"
    checks.append(("简历文本", has_resume_text, "可选"))

    # Display results
    print(f"\n{'检查项':<20} {'状态':<10} {'优先级':<10}")
    print("-" * 100)

    passed = 0
    failed = 0
    for check_name, check_result, priority in checks:
        status = "✅ 通过" if check_result else "❌ 失败"
        print(f"{check_name:<20} {status:<10} {priority:<10}")
        if check_result:
            passed += 1
        else:
            failed += 1

    # Calculate success rate
    success_rate = (passed / len(checks)) * 100

    print("\n" + "=" * 100)
    print(f"总检查项: {len(checks)}")
    print(f"通过数量: {passed}")
    print(f"失败数量: {failed}")
    print(f"成功率: {success_rate:.1f}%")

    if success_rate >= 80:
        verdict = "🎉 优秀 (Excellent)"
    elif success_rate >= 60:
        verdict = "👍 良好 (Good)"
    else:
        verdict = "⚠️  需改进 (Needs Improvement)"

    print(f"\n整体评价: {verdict}")


def export_json(result: dict[str, Any], output_path: str | None = None) -> None:
    """Export parsed results to JSON file.

    :param result: Parsed candidate data dictionary
    :param output_path: Optional output file path
    """
    if output_path is None:
        # Generate default output path
        output_path = f"parsed_resume_{result.get('name', 'unknown')}.json"

    print_header("💾 导出 JSON")

    # Remove resume_text to make output cleaner
    export_data = {k: v for k, v in result.items() if k != "resume_text"}

    try:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(export_data, f, ensure_ascii=False, indent=2)

        print(f"\n✅ 成功导出到: {output_path}")
        print(f"  文件大小: {Path(output_path).stat().st_size / 1024:.2f} KB")

    except Exception as e:
        print(f"\n❌ 导出失败: {e}")


async def main() -> None:
    """Main function."""
    # Check arguments
    if len(sys.argv) < 2:
        print("Usage: uv run python scripts/validate_resume.py <resume_file_path>")
        print("\nExample:")
        print("  uv run python scripts/validate_resume.py data/resume/梁嘉仪_23岁_人力资源_广州.jpg")
        print("  uv run python scripts/validate_resume.py data/resume/sample.pdf")
        sys.exit(1)

    resume_file_path = sys.argv[1]

    # Validate and parse resume
    result = await validate_resume(resume_file_path)

    # Display results
    display_results(result)

    # Analyze completeness
    analyze_completeness(result)

    # Export to JSON (optional)
    if "--export" in sys.argv or "-e" in sys.argv:
        output_path = None
        if "--output" in sys.argv:
            output_idx = sys.argv.index("--output")
            if output_idx + 1 < len(sys.argv):
                output_path = sys.argv[output_idx + 1]
        export_json(result, output_path)

    print_header("✅ 验证完成")


if __name__ == "__main__":
    asyncio.run(main())
