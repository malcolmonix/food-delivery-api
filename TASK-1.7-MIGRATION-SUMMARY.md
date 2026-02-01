# Task 1.7: Test Schema Changes - Summary

## Status: Ready for Manual Execution

## Overview
The database migration scripts have been created and are ready to be applied to the Supabase PostgreSQL database. Since Supabase doesn't allow DDL (Data Definition Language) operations through the client SDK, the migrations must be executed manually through the Supabase SQL Editor.

## What Was Created

### 1. Migration Files
- ✅ `migrations/000_create_migrations_table.sql` - Creates migrations tracking table
- ✅ `migrations/001_add_state_columns.sql` - Adds state columns and delivery_rates table

### 2. Helper Scripts
- ✅ `run-migrations-postgres.js` - Displays migration SQL for manual execution
- ✅ `execute-migration.js` - Provides formatted SQL for Supabase
- ✅ `mark-migration-applied.js` - Marks migrations as applied after manual execution
- ✅ `verify-migration.js` - Verifies that migrations were applied successfully

### 3. Documentation
- ✅ `MIGRATION_INSTRUCTIONS.md` - Complete step-by-step guide

## Current Database State
Verification shows that NO migrations have been applied yet:
- ❌ Migrations table does not exist
- ❌ Restaurants table does not have state column
- ❌ Users table does not have state column
- ❌ Delivery_rates table does not exist
- ❌ Default delivery rate not inserted

## SQL to Execute in Supabase

### Step 1: Create Migrations Table
```sql
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step 2: Apply Migration 001
```sql
-- Add state column to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS state TEXT;

-- Add state column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT;

-- Create indexes for state-based queries
CREATE INDEX IF NOT EXISTS idx_restaurants_state ON restaurants(state, isActive);
CREATE INDEX IF NOT EXISTS idx_restaurants_state_cuisine ON restaurants(state, cuisineType, isActive);

-- Create delivery_rates table
CREATE TABLE IF NOT EXISTS delivery_rates (
  id TEXT PRIMARY KEY,
  state TEXT,
  minDistance NUMERIC DEFAULT 0,
  maxDistance NUMERIC,
  baseFee NUMERIC NOT NULL DEFAULT 2000,
  perKmFee NUMERIC DEFAULT 0,
  surgePricing BOOLEAN DEFAULT FALSE,
  surgeMultiplier NUMERIC DEFAULT 1.0,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for delivery rates
CREATE INDEX IF NOT EXISTS idx_delivery_rates_state ON delivery_rates(state, isActive);
CREATE INDEX IF NOT EXISTS idx_delivery_rates_distance ON delivery_rates(minDistance, maxDistance, isActive);

-- Insert default delivery rate
INSERT INTO delivery_rates (id, state, baseFee, isActive)
VALUES ('default-rate', NULL, 2000, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Record migration as applied
INSERT INTO migrations (filename) VALUES ('001_add_state_columns.sql')
ON CONFLICT (filename) DO NOTHING;
```

## How to Apply Migrations

### Option 1: Manual Execution (Recommended)
1. Go to Supabase Dashboard: https://jwkcvqfevkbribdvlyvo.supabase.co
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the SQL from Step 1 above
5. Click **Run**
6. Create another new query
7. Copy and paste the SQL from Step 2 above
8. Click **Run**
9. Verify by running: `node verify-migration.js`

### Option 2: Using Helper Scripts
```bash
# Display the migration SQL
node run-migrations-postgres.js

# After manually executing in Supabase, verify
node verify-migration.js
```

## Verification Commands

### Check Migration Status
```bash
cd api
node verify-migration.js
```

Expected output when successful:
```
✓ Migrations table
✓ Restaurants state column
✓ Users state column
✓ Delivery_rates table
✓ Default delivery rate

Result: 5/5 checks passed (100%)
🎉 All migrations applied successfully!
```

### Manual Verification Queries
```sql
-- Check restaurants table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'restaurants' AND column_name = 'state';

-- Check users table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'state';

-- Check delivery_rates table
SELECT * FROM delivery_rates;

-- Check migrations
SELECT * FROM migrations;
```

## Expected Results After Migration

### 1. Restaurants Table
- New column: `state` (TEXT, nullable)
- New indexes:
  - `idx_restaurants_state` on (state, isActive)
  - `idx_restaurants_state_cuisine` on (state, cuisineType, isActive)

### 2. Users Table
- New column: `state` (TEXT, nullable)

### 3. Delivery Rates Table (New)
Structure:
```
id               TEXT PRIMARY KEY
state            TEXT (nullable)
minDistance      NUMERIC (default 0)
maxDistance      NUMERIC (nullable)
baseFee          NUMERIC (default 2000)
perKmFee         NUMERIC (default 0)
surgePricing     BOOLEAN (default FALSE)
surgeMultiplier  NUMERIC (default 1.0)
isActive         BOOLEAN (default TRUE)
createdAt        TIMESTAMP
updatedAt        TIMESTAMP
```

Default data:
- 1 row with id='default-rate', baseFee=2000, state=NULL

Indexes:
- `idx_delivery_rates_state` on (state, isActive)
- `idx_delivery_rates_distance` on (minDistance, maxDistance, isActive)

### 4. Migrations Table (New)
- Tracks applied migrations
- Should contain 1 row: '001_add_state_columns.sql'

## Next Steps After Successful Migration

1. ✅ Mark Task 1.7 as complete
2. ✅ Verify all schema changes with `node verify-migration.js`
3. ✅ Proceed to Task 2: GraphQL API Extensions
4. ✅ Update GraphQL schema to include new fields
5. ✅ Add resolvers for state-based filtering
6. ✅ Add delivery rate calculation logic

## Troubleshooting

### Issue: "Table already exists"
- This is normal if migration was partially applied
- The SQL uses `IF NOT EXISTS` to handle this

### Issue: "Column already exists"
- Similar to above, handled by `IF NOT EXISTS`

### Issue: Cannot connect to Supabase
- Check `.env` file has correct credentials
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### Issue: Permission denied
- Ensure you're using the service role key, not anon key
- Check your Supabase project permissions

## Files Created for This Task

```
api/
├── migrations/
│   ├── 000_create_migrations_table.sql
│   └── 001_add_state_columns.sql
├── run-migrations-postgres.js
├── execute-migration.js
├── mark-migration-applied.js
├── verify-migration.js
├── MIGRATION_INSTRUCTIONS.md
└── TASK-1.7-MIGRATION-SUMMARY.md (this file)
```

## Task Completion Checklist

- [x] Create migration SQL files
- [x] Create helper scripts for migration management
- [x] Create verification script
- [x] Document migration process
- [ ] Execute migrations in Supabase SQL Editor
- [ ] Verify migrations with verification script
- [ ] Update task status to complete

## Notes

- The migration system is now set up for future migrations
- All future migrations should follow the same pattern
- Always test migrations in development before production
- Keep migration files immutable after they're applied
- Use the verification script after each migration

---

**Created**: 2025-01-31
**Task**: 1.7 Test schema changes
**Spec**: complete-order-fulfillment-workflow
**Status**: Ready for manual execution in Supabase
