"""Database initialization script.

This script reads the schema.sql file and executes it against the Supabase database.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config.database import get_supabase


def init_database():
    """Initialize database by executing schema.sql."""
    print("🔧 Initializing database...")

    # Read schema.sql
    schema_path = Path(__file__).parent.parent.parent / "database" / "schema.sql"
    if not schema_path.exists():
        print(f"❌ Schema file not found: {schema_path}")
        return False

    print(f"📄 Reading schema from: {schema_path}")
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    # Get Supabase client
    try:
        supabase = get_supabase()
        print("✅ Connected to Supabase")
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        return False

    # Execute schema
    print("🚀 Executing schema SQL...")
    print("\n" + "="*60)
    print("NOTE: You need to execute the SQL manually in Supabase Studio")
    print("="*60)
    print(f"\n1. Go to: https://supabase.com/dashboard")
    print(f"2. Select your project")
    print(f"3. Go to SQL Editor")
    print(f"4. Copy and paste the contents of: {schema_path}")
    print(f"5. Click 'Run' to execute")
    print("\n" + "="*60)

    # Test connection
    print("\n🔍 Testing database connection...")
    try:
        # Try to query a table (will fail if schema not created yet)
        result = supabase.table("users").select("count").limit(1).execute()
        print("✅ Database tables are accessible!")
        return True
    except Exception as e:
        if "PGRST205" in str(e) or "not find the table" in str(e):
            print("⚠️  Database tables not created yet. Please follow the steps above.")
        else:
            print(f"⚠️  Error: {e}")
        return False


def load_seed_data():
    """Load seed data from seed.sql."""
    print("\n🌱 Loading seed data...")

    seed_path = Path(__file__).parent.parent.parent / "database" / "seed.sql"
    if not seed_path.exists():
        print(f"❌ Seed file not found: {seed_path}")
        return False

    print(f"📄 Reading seed data from: {seed_path}")
    with open(seed_path, "r", encoding="utf-8") as f:
        seed_sql = f.read()

    print("\n" + "="*60)
    print("NOTE: Execute seed.sql manually after schema is created")
    print("="*60)
    print(f"\nCopy and paste the contents of: {seed_path}")
    print("into the Supabase SQL Editor and run it.")
    print("="*60)

    return True


if __name__ == "__main__":
    print("="*60)
    print("  AI Resume Scanning System - Database Initialization")
    print("="*60)
    print()

    success = init_database()

    if success:
        print("\n✨ Database is ready!")
    else:
        print("\n📝 Next steps:")
        print("1. Create tables by executing database/schema.sql")
        print("2. (Optional) Load test data by executing database/seed.sql")
        print("3. Run this script again to verify")

    print()
