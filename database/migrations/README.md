# Database Migrations

This directory contains database migration scripts for the hireyi project.

## Available Migrations

### `migrate_to_role_system_v3.sql`

**Purpose**: Migrate from status-based approval workflow to role-based access control system.

**Changes**:
- Migrates `org_members.role` from `('admin', 'member')` + `status` to `('creator', 'admin', 'interviewer', 'pending')`
- Removes the `status` column (approval workflow merged into roles)
- Updates indexes and constraints
- Recreates RLS policies with role-based logic
- Adds unique creator constraint (one creator per organization)

**Date**: 2025-01-29

## Running Migrations

### Prerequisites

1. **Get your Supabase database password**:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Navigate to: Project → Settings → Database
   - Find "Connection string" section
   - Copy the password (or reset it if needed)

2. **Update your `.env` file**:
   ```bash
   # Add this line to backend/.env
   SUPABASE_DB_PASSWORD=your-actual-db-password
   ```

### Execution Methods

#### Method 1: Using the Migration Runner (Recommended)

```bash
# From the backend directory
cd backend

# Run the migration script
uv run python scripts/run_migration.py ../database/migrations/migrate_to_role_system_v3.sql
```

**Output**:
- The script will connect to your Supabase database
- Execute the migration within a transaction
- Show validation results and migration statistics
- Rollback automatically if any errors occur

#### Method 2: Using Supabase Dashboard (Manual)

1. Open [Supabase SQL Editor](https://app.supabase.com/project/_/sql)
2. Copy the contents of `migrate_to_role_system_v3.sql`
3. Paste into the SQL Editor
4. Click "Run" to execute

**Note**: This method provides immediate visual feedback but lacks the automatic rollback on errors.

### Verification

After running the migration, verify the following:

1. **Check creator count** (should be exactly 1 per organization):
   ```sql
   SELECT org_id, COUNT(*) as creator_count
   FROM org_members
   WHERE role = 'creator'
   GROUP BY org_id;
   ```

2. **Check role distribution**:
   ```sql
   SELECT role, COUNT(*) as count
   FROM org_members
   GROUP BY role
   ORDER BY role;
   ```

3. **Verify status column is dropped**:
   ```sql
   SELECT column_name
   FROM information_schema.columns
   WHERE table_name = 'org_members'
   AND column_name = 'status';
   -- Should return 0 rows
   ```

## Migration Safety

- All migrations use **transactions** (`BEGIN`...`COMMIT`)
- Errors trigger automatic **rollback**
- Migrations include **validation checks** before committing
- **Backup your database** before running migrations in production

## Rollback

If you need to rollback this migration, you would need to:

1. Restore from a database backup, OR
2. Create a reverse migration script that:
   - Adds back the `status` column
   - Converts roles back to the old format
   - Restores old RLS policies

**Important**: Always test migrations in a development/staging environment first!

## Troubleshooting

### Error: "SUPABASE_DB_PASSWORD not set"

**Solution**: Add your Supabase database password to the `.env` file:

```bash
SUPABASE_DB_PASSWORD=your-actual-password
```

### Error: "Migration validation failed"

**Cause**: Data integrity issue (e.g., multiple creators per organization)

**Solution**:
1. Rollback the migration (it auto-rolls back on validation errors)
2. Fix the data issue manually
3. Re-run the migration

### Error: "Connection refused"

**Possible causes**:
- Incorrect `SUPABASE_URL` in `.env`
- Database password is wrong
- Network connectivity issues
- Supabase project is paused

**Solution**:
1. Verify `SUPABASE_URL` and `SUPABASE_DB_PASSWORD`
2. Check if your Supabase project is active
3. Try connecting from Supabase Dashboard to rule out network issues

## Migration Best Practices

1. **Always backup** before running migrations
2. **Test in development** environment first
3. **Review the SQL** to understand what changes will be made
4. **Run during low-traffic** periods for production
5. **Monitor the output** for any warnings or errors
6. **Verify the results** with the verification queries above

## Adding New Migrations

When creating a new migration:

1. Use a descriptive filename: `YYYY-MM-DD_description.sql`
2. Include a header comment with:
   - Purpose of the migration
   - Date created
   - Author
3. Use transactions (`BEGIN`...`COMMIT`)
4. Add validation checks before committing
5. Document the migration in this README
6. Test thoroughly in development environment

## Related Documentation

- Backend API: `/backend/README.md`
- Auth & Organization Design: `/docs/auth_and_org_design.md`
- Database Schema: `/database/schema_v2.sql`
