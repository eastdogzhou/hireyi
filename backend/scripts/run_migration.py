#!/usr/bin/env python3
"""Database migration runner for Supabase.

This script executes SQL migration files against the Supabase PostgreSQL database.

Usage:
    uv run python scripts/run_migration.py <migration_file>

Prerequisites:
    Set one of the following environment variables:

    Option 1: Direct PostgreSQL connection string
        DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

    Option 2: Supabase components (will construct connection string)
        SUPABASE_DB_PASSWORD=[your-db-password]
        SUPABASE_URL=https://[project-ref].supabase.co

Get your database password from:
    Supabase Dashboard → Settings → Database → Connection string → Password
"""

from __future__ import annotations

import logging
import os
import re
import sys
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def get_database_url() -> str:
    """Get PostgreSQL database URL from environment variables.

    Tries the following approaches in order:
    1. Use DATABASE_URL directly if set
    2. Construct from SUPABASE_URL + SUPABASE_DB_PASSWORD
    3. Construct from SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (fallback)

    :return: PostgreSQL connection string
    :raises ValueError: If unable to construct database URL
    """
    # Option 1: Direct DATABASE_URL
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        logger.info("Using DATABASE_URL from environment")
        return database_url

    # Option 2: Construct from components
    supabase_url = os.getenv("SUPABASE_URL")
    db_password = os.getenv("SUPABASE_DB_PASSWORD")

    if not supabase_url:
        raise ValueError(
            "Missing required environment variable: SUPABASE_URL or DATABASE_URL"
        )

    # Extract project ref from Supabase URL
    # Format: https://[project-ref].supabase.co
    match = re.match(r"https://([^.]+)\.supabase\.co", supabase_url)
    if not match:
        raise ValueError(f"Invalid SUPABASE_URL format: {supabase_url}")

    project_ref = match.group(1)

    if not db_password:
        logger.warning(
            "SUPABASE_DB_PASSWORD not set. Please set it to your database password."
        )
        logger.warning(
            "Get it from: Supabase Dashboard → Settings → Database → Connection string"
        )
        raise ValueError("Missing required environment variable: SUPABASE_DB_PASSWORD")

    # Construct PostgreSQL connection string
    db_url = f"postgresql://postgres:{db_password}@db.{project_ref}.supabase.co:5432/postgres"
    logger.info(f"Constructed database URL for project: {project_ref}")
    return db_url


def execute_migration(migration_file: Path) -> None:
    """Execute a SQL migration file.

    :param migration_file: Path to the SQL migration file
    :raises FileNotFoundError: If migration file doesn't exist
    :raises psycopg2.Error: If database operation fails
    """
    if not migration_file.exists():
        raise FileNotFoundError(f"Migration file not found: {migration_file}")

    logger.info(f"Reading migration file: {migration_file}")
    sql_content = migration_file.read_text(encoding="utf-8")

    logger.info("Connecting to database...")
    database_url = get_database_url()

    conn = None
    try:
        # Connect to database
        conn = psycopg2.connect(database_url)
        conn.set_session(autocommit=False)  # Explicit transaction control
        cursor = conn.cursor()

        logger.info("Executing migration...")
        logger.info(f"Migration file: {migration_file.name}")
        logger.info("-" * 80)

        # Execute the migration
        cursor.execute(sql_content)

        # Fetch all notices and messages
        for notice in conn.notices:
            logger.info(f"NOTICE: {notice.strip()}")

        conn.commit()
        logger.info("-" * 80)
        logger.info("✅ Migration completed successfully!")

        cursor.close()

    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        logger.error(f"❌ Migration failed: {e}")
        logger.error(f"Error code: {e.pgcode}")
        if hasattr(e, "pgerror"):
            logger.error(f"PostgreSQL error: {e.pgerror}")
        raise

    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"❌ Unexpected error: {e}")
        raise

    finally:
        if conn:
            conn.close()
            logger.info("Database connection closed")


def main() -> None:
    """Main entry point."""
    # Load environment variables
    env_file = Path(__file__).parent.parent / ".env"
    if env_file.exists():
        load_dotenv(env_file)
        logger.info(f"Loaded environment from: {env_file}")
    else:
        logger.warning(f"No .env file found at: {env_file}")

    # Parse command line arguments
    if len(sys.argv) != 2:
        logger.error("Usage: uv run python scripts/run_migration.py <migration_file>")
        logger.error("")
        logger.error("Example:")
        logger.error(
            "  uv run python scripts/run_migration.py database/migrations/migrate_to_role_system_v3.sql"
        )
        sys.exit(1)

    migration_path = Path(sys.argv[1])

    # If relative path, resolve from backend directory
    if not migration_path.is_absolute():
        backend_dir = Path(__file__).parent.parent
        migration_path = backend_dir / migration_path

    logger.info("=" * 80)
    logger.info("Database Migration Runner")
    logger.info("=" * 80)

    try:
        execute_migration(migration_path)
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
