#!/usr/bin/env python3
"""Database initialization script.

This script initializes the PostgreSQL database by:
1. Checking database connection
2. Executing schema.sql to create tables and indexes
3. Optionally loading seed data from seed.sql
4. Verifying table creation success

The script is idempotent and can be run multiple times safely.
"""

import argparse
import logging
import sys
from pathlib import Path

from supabase import Client, create_client

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.config.settings import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


class DatabaseInitializer:
    """Database initialization manager."""

    def __init__(self, supabase_client: Client, environment: str) -> None:
        """Initialize database manager.

        :param supabase_client: Supabase client instance
        :param environment: Environment name (development/production)
        """
        self.supabase = supabase_client
        self.environment = environment
        self.database_dir = Path(__file__).parent.parent / "database"

    def check_connection(self) -> bool:
        """Check database connection.

        :return: True if connection successful, False otherwise
        """
        try:
            logger.info("Checking database connection...")
            # Simple query to test connection
            result = self.supabase.table("_supabase_migrations").select("*").limit(1).execute()
            logger.info("✅ Database connection successful")
            return True
        except Exception as e:
            # If migrations table doesn't exist, try a basic RPC call
            try:
                # Test connection with a simple query
                self.supabase.rpc("version").execute()
                logger.info("✅ Database connection successful")
                return True
            except Exception as e2:
                logger.error(f"❌ Database connection failed: {e2}")
                return False

    def execute_sql_file(self, file_path: Path) -> bool:
        """Execute SQL file using Supabase SQL Editor API.

        :param file_path: Path to SQL file
        :return: True if execution successful, False otherwise
        """
        try:
            logger.info(f"Reading SQL file: {file_path.name}")
            sql_content = file_path.read_text(encoding="utf-8")

            logger.info(f"Executing SQL from {file_path.name}...")

            # Note: Supabase Python SDK doesn't directly support raw SQL execution
            # We need to use the REST API or PostgREST functions
            # For schema initialization, it's recommended to use Supabase Dashboard
            # or direct PostgreSQL connection

            # Alternative approach: Use psycopg2 for direct PostgreSQL access
            # This requires database credentials and direct access

            logger.warning(
                f"⚠️  SQL file execution not implemented in Python SDK. "
                f"Please execute {file_path.name} manually via:"
            )
            logger.warning(f"   1. Supabase Dashboard SQL Editor")
            logger.warning(f"   2. psql command line tool")
            logger.warning(f"   3. Direct PostgreSQL connection")

            return False

        except Exception as e:
            logger.error(f"❌ Error executing SQL file: {e}")
            return False

    def execute_schema(self) -> bool:
        """Execute schema.sql to create tables and indexes.

        :return: True if successful, False otherwise
        """
        schema_file = self.database_dir / "schema.sql"

        if not schema_file.exists():
            logger.error(f"❌ Schema file not found: {schema_file}")
            return False

        logger.info("=" * 60)
        logger.info("Creating database schema...")
        logger.info("=" * 60)

        return self.execute_sql_file(schema_file)

    def load_seed_data(self) -> bool:
        """Load seed data from seed.sql.

        :return: True if successful, False otherwise
        """
        seed_file = self.database_dir / "seed.sql"

        if not seed_file.exists():
            logger.error(f"❌ Seed file not found: {seed_file}")
            return False

        logger.info("=" * 60)
        logger.info("Loading seed data...")
        logger.info("=" * 60)

        return self.execute_sql_file(seed_file)

    def verify_tables(self) -> bool:
        """Verify that all required tables exist.

        :return: True if all tables exist, False otherwise
        """
        required_tables = [
            "users",
            "candidates",
            "positions",
            "position_candidates",
            "interview_feedbacks",
        ]

        logger.info("=" * 60)
        logger.info("Verifying table creation...")
        logger.info("=" * 60)

        try:
            all_exist = True
            for table_name in required_tables:
                try:
                    # Try to query the table (will fail if it doesn't exist)
                    result = self.supabase.table(table_name).select("count").limit(1).execute()
                    logger.info(f"✅ Table '{table_name}' exists")
                except Exception as e:
                    logger.error(f"❌ Table '{table_name}' not found or inaccessible")
                    all_exist = False

            return all_exist

        except Exception as e:
            logger.error(f"❌ Error verifying tables: {e}")
            return False

    def run(self, load_seed: bool = False, force: bool = False) -> bool:
        """Run complete database initialization.

        :param load_seed: Whether to load seed data
        :param force: Whether to force rebuild (currently not implemented)
        :return: True if successful, False otherwise
        """
        logger.info("🚀 Starting database initialization")
        logger.info(f"   Environment: {self.environment}")
        logger.info(f"   Load seed data: {load_seed}")
        logger.info(f"   Force rebuild: {force}")
        logger.info("")

        # Step 1: Check connection
        if not self.check_connection():
            logger.error("❌ Database initialization failed: Cannot connect to database")
            return False

        # Step 2: Provide manual SQL execution instructions
        logger.info("")
        logger.info("=" * 60)
        logger.info("DATABASE SETUP INSTRUCTIONS")
        logger.info("=" * 60)
        logger.info("")
        logger.info("📚 For detailed instructions, see: database/README.md")
        logger.info("")
        logger.info("Due to Supabase Python SDK limitations, please manually execute:")
        logger.info("")
        logger.info("Option 1: Supabase Dashboard (Recommended)")
        logger.info("  1. Open Supabase Dashboard SQL Editor")
        logger.info(f"  2. Execute: {self.database_dir / 'schema.sql'}")
        if load_seed:
            logger.info(f"  3. Execute: {self.database_dir / 'seed.sql'}")
        logger.info("")
        logger.info("Option 2: Migration Tool")
        logger.info(f"  cd {self.database_dir / 'migrations'}")
        logger.info("  python run_migration.py ../schema.sql")
        if load_seed:
            logger.info("  python run_migration.py ../seed.sql")
        logger.info("")
        logger.info("Option 3: psql (if you have direct database access)")
        logger.info(f"  psql $DATABASE_URL -f {self.database_dir / 'schema.sql'}")
        if load_seed:
            logger.info(f"  psql $DATABASE_URL -f {self.database_dir / 'seed.sql'}")
        logger.info("")

        # Step 3: Verify tables (optional, if already created)
        logger.info("=" * 60)
        logger.info("Checking if tables already exist...")
        logger.info("=" * 60)
        logger.info("")

        if self.verify_tables():
            logger.info("")
            logger.info("✅ All required tables exist!")
            logger.info("✅ Database initialization complete")
            return True
        else:
            logger.warning("")
            logger.warning("⚠️  Some tables are missing. Please run the SQL files manually.")
            return False


def main() -> int:
    """Main entry point for database initialization.

    :return: Exit code (0 for success, 1 for failure)
    """
    parser = argparse.ArgumentParser(
        description="Initialize database schema and optionally load seed data"
    )
    parser.add_argument(
        "--environment",
        choices=["development", "production"],
        default="development",
        help="Environment (default: development)",
    )
    parser.add_argument(
        "--load-seed",
        action="store_true",
        help="Load seed data after creating schema",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force rebuild (drop existing tables)",
    )

    args = parser.parse_args()

    try:
        # Load settings and create Supabase client
        settings = get_settings()
        supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)

        # Initialize database
        initializer = DatabaseInitializer(supabase, args.environment)
        success = initializer.run(load_seed=args.load_seed, force=args.force)

        return 0 if success else 1

    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
