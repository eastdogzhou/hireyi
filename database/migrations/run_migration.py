#!/usr/bin/env python3
"""Run database migration script.

This script executes SQL migration files on Supabase database.

Usage:
    python run_migration.py <sql_file>

Example:
    # Run complete schema rebuild (development)
    python run_migration.py ../schema.sql

    # Run incremental migration
    python run_migration.py 003_add_feature.sql

Note: This script is for manual migrations. For production, use Supabase SQL Editor.
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
env_file = backend_path / ".env"
load_dotenv(env_file)


def run_migration(migration_file: str) -> None:
    """Run a single migration file.

    :param migration_file: Path to migration SQL file
    """
    # Initialize Supabase client
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_service_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
        sys.exit(1)

    client: Client = create_client(supabase_url, supabase_service_key)

    # Read migration file
    migration_path = Path(migration_file)
    if not migration_path.exists():
        print(f"❌ Error: Migration file not found: {migration_file}")
        sys.exit(1)

    print(f"📄 Reading migration: {migration_path.name}")
    sql_content = migration_path.read_text()

    # Execute migration
    try:
        print(f"🚀 Executing migration...")

        # Split SQL by statement (simple split by semicolon)
        statements = [s.strip() for s in sql_content.split(';') if s.strip()]

        for i, statement in enumerate(statements, 1):
            # Skip comments
            if statement.startswith('--') or statement.startswith('/*'):
                continue

            print(f"   Executing statement {i}/{len(statements)}...")
            response = client.postgrest.rpc("exec_sql", {"sql": statement}).execute()

        print(f"✅ Migration completed successfully!")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python run_migration.py <sql_file>")
        print("\nExamples:")
        print("  # Complete schema rebuild (development)")
        print("  python run_migration.py ../schema.sql")
        print("\n  # Incremental migration")
        print("  python run_migration.py 003_add_feature.sql")
        sys.exit(1)

    migration_file = sys.argv[1]

    # If relative path, resolve from migrations directory
    if not os.path.isabs(migration_file):
        migrations_dir = Path(__file__).parent
        migration_file = str(migrations_dir / migration_file)

    run_migration(migration_file)


if __name__ == "__main__":
    main()
