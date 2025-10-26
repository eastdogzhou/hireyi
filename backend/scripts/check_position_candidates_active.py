"""检查 position_candidates_active 表的作用"""

import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from supabase import create_client
from app.config.settings import get_settings

def check_position_candidates_active():
    """检查 position_candidates_active 表"""
    settings = get_settings()

    supabase = create_client(
        settings.supabase_url,
        settings.supabase_service_role_key
    )

    print("=" * 60)
    print("检查 position_candidates_active 表")
    print("=" * 60)

    try:
        # 尝试查询表结构和数据
        response = supabase.table("position_candidates_active").select("*").limit(5).execute()

        if response.data:
            print(f"\n✅ 表存在，共有 {len(response.data)} 条记录（显示前5条）\n")

            if len(response.data) > 0:
                # 显示字段名
                print("字段:", list(response.data[0].keys()))
                print()

                # 显示记录
                for i, record in enumerate(response.data, 1):
                    print(f"记录 {i}:")
                    for key, value in record.items():
                        print(f"  {key}: {value}")
                    print()
        else:
            print("\n✅ 表存在但没有数据")

        # 获取总数
        count_response = supabase.table("position_candidates_active").select("*", count="exact").execute()
        print(f"\n总记录数: {count_response.count}")

    except Exception as e:
        print(f"\n❌ 查询失败: {e}")
        print("\n可能的原因:")
        print("1. 表不存在")
        print("2. 这是一个视图(VIEW)而不是表")
        print("3. 权限不足")

    print("\n" + "=" * 60)
    print("分析:")
    print("=" * 60)
    print("""
从表名 'position_candidates_active' 可以推断:
- 这可能是 position_candidates 表的一个视图(VIEW)
- 'active' 后缀通常表示只显示活跃记录(is_deleted=false)
- 视图的作用是自动过滤掉已软删除的记录

如果这是一个视图:
- 当你清空 position_candidates 表时，视图也会自动为空
- 不需要单独清理视图
- 视图只是一个查询快捷方式，不存储实际数据
    """)

if __name__ == "__main__":
    try:
        check_position_candidates_active()
    except Exception as e:
        print(f"❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
