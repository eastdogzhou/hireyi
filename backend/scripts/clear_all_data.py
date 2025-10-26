"""清除所有业务表数据 - 为数据库结构更新做准备"""

import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from supabase import create_client
from app.config.settings import get_settings


def clear_all_data():
    """清除所有业务表数据（按正确的依赖顺序）"""
    settings = get_settings()

    # 使用 service_role_key 以获得完全访问权限
    supabase = create_client(
        settings.supabase_url, settings.supabase_service_role_key
    )

    # 按照外键依赖顺序删除（从最依赖的表开始）
    tables_to_clear = [
        "interview_feedbacks",  # 依赖 candidates 和 positions
        "position_candidates",  # 依赖 candidates 和 positions
        "positions",  # 依赖 users
        "candidates",  # 独立表
        "users",  # 独立表
    ]

    total_deleted = 0

    print("=" * 60)
    print("⚠️  警告: 即将清除所有业务表数据")
    print("=" * 60)
    print()

    for table_name in tables_to_clear:
        try:
            print(f"正在清除 {table_name} 表...")

            # 删除所有记录（使用 neq 技巧来匹配所有行）
            response = supabase.table(table_name).delete().neq("id", 0).execute()

            deleted_count = len(response.data) if response.data else 0
            total_deleted += deleted_count

            print(f"  ✅ {table_name}: 删除 {deleted_count} 条记录")

        except Exception as e:
            print(f"  ⚠️  {table_name}: 删除失败 - {e}")
            # 继续处理其他表

    print()
    print("=" * 60)
    print(f"✅ 数据清除完成! 总计删除 {total_deleted} 条记录")
    print("=" * 60)
    print()
    print("提示: 数据库现在已清空，可以安全地进行结构更新")


def clear_single_table(table_name: str):
    """清除单个表的数据"""
    settings = get_settings()
    supabase = create_client(
        settings.supabase_url, settings.supabase_service_role_key
    )

    print(f"正在清除 {table_name} 表...")
    response = supabase.table(table_name).delete().neq("id", 0).execute()
    deleted_count = len(response.data) if response.data else 0
    print(f"✅ 成功删除 {deleted_count} 条记录")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="清除数据库表数据")
    parser.add_argument(
        "--table", type=str, help="仅清除指定的表（留空则清除所有表）"
    )
    parser.add_argument(
        "--confirm",
        action="store_true",
        help="跳过确认提示（仅用于脚本自动化）",
    )

    args = parser.parse_args()

    try:
        # 确认提示
        if not args.confirm:
            if args.table:
                confirm = input(f"确认要清除 {args.table} 表的所有数据吗? (yes/no): ")
            else:
                confirm = input("确认要清除所有业务表的数据吗? (yes/no): ")

            if confirm.lower() not in ["yes", "y"]:
                print("操作已取消")
                sys.exit(0)

        # 执行清除
        if args.table:
            clear_single_table(args.table)
        else:
            clear_all_data()

    except Exception as e:
        print(f"❌ 错误: {e}")
        sys.exit(1)
