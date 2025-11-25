#!/usr/bin/env python3
"""清除所有业务表数据（Schema v2.0） - 包括组织和用户数据

这个脚本会清除所有业务表的数据，包括：
- 业务数据：candidates, positions, position_candidates, interview_feedbacks
- 组织数据：organizations, org_members
- 用户 Profile：users

注意：
- 不会删除 Supabase Auth 系统表 (auth.users)
- 只删除数据，保留表结构
- 按照正确的外键依赖顺序删除，避免约束错误
"""

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
    # Schema v2.0 完整表列表
    tables_to_clear = [
        "interview_feedbacks",  # 依赖 candidates, positions, users
        "position_candidates",  # 依赖 candidates, positions
        "positions",  # 依赖 organizations, users
        "candidates",  # 依赖 organizations
        "org_members",  # 依赖 organizations, auth.users
        "users",  # 依赖 organizations, auth.users (profile 表)
        "organizations",  # 依赖 auth.users
    ]

    total_deleted = 0

    print("=" * 70)
    print("⚠️  警告: 即将清除所有业务表数据（Schema v2.0）")
    print("=" * 70)
    print("\n包括以下表:")
    for table in tables_to_clear:
        print(f"  - {table}")
    print("\n注意: 不会删除 Supabase Auth 系统表 (auth.users)")
    print("=" * 70)
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
    print("=" * 70)
    print(f"✅ 数据清除完成! 总计删除 {total_deleted} 条记录")
    print("=" * 70)
    print()
    print("提示:")
    print("  - 所有业务数据已清空")
    print("  - 所有组织和成员数据已清空")
    print("  - 所有用户 Profile 数据已清空")
    print("  - Supabase Auth 账户 (auth.users) 仍然存在")
    print("  - 如需完全重置包括 Auth 账户，请在 Supabase Dashboard 中手动删除")


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


def clear_business_data_only():
    """仅清除业务数据（保留组织和用户）"""
    settings = get_settings()
    supabase = create_client(
        settings.supabase_url, settings.supabase_service_role_key
    )

    # 仅清除业务表，保留组织和用户
    tables_to_clear = [
        "interview_feedbacks",
        "position_candidates",
        "positions",
        "candidates",
    ]

    total_deleted = 0

    print("=" * 70)
    print("⚠️  警告: 即将清除业务数据（保留组织和用户）")
    print("=" * 70)
    print()

    for table_name in tables_to_clear:
        try:
            print(f"正在清除 {table_name} 表...")
            response = supabase.table(table_name).delete().neq("id", 0).execute()
            deleted_count = len(response.data) if response.data else 0
            total_deleted += deleted_count
            print(f"  ✅ {table_name}: 删除 {deleted_count} 条记录")
        except Exception as e:
            print(f"  ⚠️  {table_name}: 删除失败 - {e}")

    print()
    print("=" * 70)
    print(f"✅ 业务数据清除完成! 总计删除 {total_deleted} 条记录")
    print("=" * 70)
    print()
    print("提示: 组织、成员和用户数据已保留")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="清除数据库表数据 (Schema v2.0)")
    parser.add_argument(
        "--table", type=str, help="仅清除指定的表（留空则清除所有表）"
    )
    parser.add_argument(
        "--business-only",
        action="store_true",
        help="仅清除业务数据（保留组织和用户）",
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
            elif args.business_only:
                confirm = input(
                    "确认要清除所有业务数据（保留组织和用户）吗? (yes/no): "
                )
            else:
                confirm = input(
                    "确认要清除所有数据（包括组织和用户）吗? (yes/no): "
                )

            if confirm.lower() not in ["yes", "y"]:
                print("操作已取消")
                sys.exit(0)

        # 执行清除
        if args.table:
            clear_single_table(args.table)
        elif args.business_only:
            clear_business_data_only()
        else:
            clear_all_data()

    except Exception as e:
        print(f"❌ 错误: {e}")
        sys.exit(1)
