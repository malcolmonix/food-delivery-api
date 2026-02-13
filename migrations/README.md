# Database Migrations

This directory contains database migration scripts for the Food Delivery Platform API.

## Overview

Migrations are used to make incremental changes to the database schema in a controlled and versioned manner. Each migration file is a SQL script that can be applied to both SQLite (development) and PostgreSQL (production/Supabase).

## Migration Files

### Current Migrations

1. **add-order-tracking-indexes.sql** (February 10, 2026)
   - Adds indexes to optimize order tracking queries
   - Indexes: `order_id`, `user_id`, `order_status`
   - Impact: 10-100x performance improvement for order queries

## How to Apply Migrations

### Option 1: Using the Migration Runner Script (Recommended)

For **SQLite (Development)**:
```bash
cd api
node migrations/apply-migration.js add-order-tracking-indexes.sql
```

For **Supabase PostgreSQL (Production)**:
```bash
cd api
USE_SUPABASE=true node migrations/apply-migration.js add-order-tracking-indexes.sql
```

### Option 2: Manual Application

#### SQLite (Development)

```bash
cd api
sqlite3 database.sqlite < migrations/add-order-tracking-indexes.sql
```

Or using Node.js:
```javascript
const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('database.sqlite');
const sql = fs.readFileSync('migrations/add-order-tracking-indexes.sql', 'utf8');

// Execute each statement
sql.split(';').forEach(statement => {
  if (statement.trim()) {
    db.prepare(statement).run();
  }
});
```

#### Supabase PostgreSQL (Production)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor: https://app.supabase.com/project/_/sql
3. Copy the contents of the migration file
4. Paste into the SQL Editor
5. Click "Run" to execute

Alternatively, use the Supabase CLI:
```bash
supabase db push --db-url "postgresql://..."
```

## Verifying Migrations

### SQLite

```bash
sqlite3 database.sqlite "SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='orders';"
```

Or in Node.js:
```javascript
const { getDb } = require('./database.sqlite');
const db = getDb();

const indexes = db.prepare(`
  SELECT name, sql 
  FROM sqlite_master 
  WHERE type='index' AND tbl_name='orders'
`).all();

console.log('Indexes:', indexes);
```

### Supabase PostgreSQL

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'orders';
```

Expected output should include:
- `idx_orders_order_id`
- `idx_orders_user_id`
- `idx_orders_status`

## Rolling Back Migrations

If you need to rollback a migration, refer to the "Rollback Instructions" section in the migration file.

For the order tracking indexes migration:

```sql
DROP INDEX IF EXISTS idx_orders_order_id;
DROP INDEX IF EXISTS idx_orders_user_id;
DROP INDEX IF EXISTS idx_orders_status;
```

## Creating New Migrations

### Migration File Naming Convention

Format: `<action>-<description>.sql`

Examples:
- `add-order-tracking-indexes.sql`
- `create-notifications-table.sql`
- `alter-users-add-phone.sql`

### Migration File Template

```sql
-- ============================================================================
-- Migration: <Migration Name>
-- Created: <Date>
-- Purpose: <Brief description of what this migration does>
-- ============================================================================

-- Description:
-- <Detailed description of the changes and why they're needed>

-- ============================================================================
-- Migration SQL
-- ============================================================================

-- Your SQL statements here
-- Use IF NOT EXISTS / IF EXISTS for idempotency

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- <Queries to verify the migration was successful>

-- ============================================================================
-- Rollback Instructions
-- ============================================================================
-- <SQL statements to undo this migration>

-- ============================================================================
-- Performance Notes
-- ============================================================================
-- <Expected performance impact and considerations>
```

### Best Practices

1. **Idempotency**: Always use `IF NOT EXISTS` / `IF EXISTS` clauses
2. **Documentation**: Include clear comments explaining the purpose
3. **Verification**: Provide queries to verify the migration succeeded
4. **Rollback**: Document how to undo the migration
5. **Testing**: Test migrations on development database first
6. **Backup**: Always backup production database before applying migrations
7. **Compatibility**: Ensure migrations work on both SQLite and PostgreSQL

## Migration Checklist

Before applying a migration to production:

- [ ] Migration tested on local SQLite database
- [ ] Migration tested on staging Supabase database
- [ ] Verification queries confirm expected changes
- [ ] Rollback procedure documented and tested
- [ ] Performance impact assessed
- [ ] Backup of production database created
- [ ] Team notified of upcoming migration
- [ ] Maintenance window scheduled (if needed)

## Troubleshooting

### Common Issues

**Issue**: "table already exists" or "index already exists"
- **Solution**: Use `IF NOT EXISTS` clause in CREATE statements

**Issue**: Migration fails on Supabase but works on SQLite
- **Solution**: Check for SQLite-specific syntax (e.g., `AUTOINCREMENT` vs `SERIAL`)

**Issue**: Permission denied on Supabase
- **Solution**: Ensure you have proper database permissions or use Supabase SQL Editor

**Issue**: Migration partially applied
- **Solution**: Check which statements succeeded, rollback if needed, fix and reapply

## Support

For questions or issues with migrations:
1. Check the migration file's documentation
2. Review this README
3. Test on development database first
4. Contact the development team

## References

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase SQL Editor](https://supabase.com/docs/guides/database/overview)
- [Database Indexing Best Practices](https://use-the-index-luke.com/)
