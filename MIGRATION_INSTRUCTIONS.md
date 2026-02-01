# Database Migration Instructions

## Overview
This document provides instructions for applying database migrations to the Supabase PostgreSQL database.

## Prerequisites
- Access to Supabase project dashboard
- Service role key configured in `.env` file

## Migration Files
1. `000_create_migrations_table.sql` - Creates the migrations tracking table
2. `001_add_state_columns.sql` - Adds state columns and delivery_rates table

## Steps to Apply Migrations

### Step 1: Create Migrations Table
1. Go to your Supabase project dashboard: https://jwkcvqfevkbribdvlyvo.supabase.co
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the following SQL:

```sql
-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

5. Click **Run** to execute
6. Verify the table was created by checking the **Table Editor**

### Step 2: Apply Migration 001 - Add State Columns
1. In the SQL Editor, create a new query
2. Copy and paste the following SQL:

```sql
-- Migration: Add state columns for state-based filtering
-- Date: 2025-01-31
-- Description: Add state column to restaurants, riders, and users tables for geographic filtering

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
  state TEXT,  -- NULL for default rate
  minDistance NUMERIC DEFAULT 0,  -- km
  maxDistance NUMERIC,  -- km, NULL for unlimited
  baseFee NUMERIC NOT NULL DEFAULT 2000,  -- ₦2,000 default
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

3. Click **Run** to execute
4. Verify the changes:
   - Check that `restaurants` table has a `state` column
   - Check that `users` table has a `state` column
   - Check that `delivery_rates` table was created
   - Check that indexes were created
   - Check that default delivery rate was inserted

### Step 3: Verify Migration
Run the following queries to verify the migration was successful:

```sql
-- Check restaurants table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'restaurants' AND column_name = 'state';

-- Check users table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'state';

-- Check delivery_rates table exists
SELECT * FROM delivery_rates;

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('restaurants', 'delivery_rates');

-- Check migrations table
SELECT * FROM migrations;
```

## Expected Results

### 1. Restaurants Table
- Should have a new `state` column of type `TEXT`
- Should have indexes: `idx_restaurants_state`, `idx_restaurants_state_cuisine`

### 2. Users Table
- Should have a new `state` column of type `TEXT`

### 3. Delivery Rates Table
Should be created with the following structure:
- `id` (TEXT, PRIMARY KEY)
- `state` (TEXT, nullable)
- `minDistance` (NUMERIC, default 0)
- `maxDistance` (NUMERIC, nullable)
- `baseFee` (NUMERIC, default 2000)
- `perKmFee` (NUMERIC, default 0)
- `surgePricing` (BOOLEAN, default FALSE)
- `surgeMultiplier` (NUMERIC, default 1.0)
- `isActive` (BOOLEAN, default TRUE)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

Should have indexes:
- `idx_delivery_rates_state`
- `idx_delivery_rates_distance`

Should have one default row:
- `id`: 'default-rate'
- `state`: NULL
- `baseFee`: 2000
- `isActive`: TRUE

### 4. Migrations Table
Should contain one row:
- `filename`: '001_add_state_columns.sql'
- `applied_at`: (timestamp of when you ran the migration)

## Troubleshooting

### Error: Column already exists
If you see "column already exists" errors, this is normal if the migration was partially applied. The SQL uses `IF NOT EXISTS` clauses to handle this gracefully.

### Error: Table already exists
Similar to above, the SQL uses `IF NOT EXISTS` to handle existing tables.

### Error: Duplicate key value
If you see this for the default delivery rate insert, it means the rate already exists. This is handled by `ON CONFLICT DO NOTHING`.

### Verification Failed
If any verification query returns no results:
1. Check that you're connected to the correct database
2. Re-run the migration SQL
3. Check the Supabase logs for any errors

## Alternative: Using Node.js Script
After manually executing the SQL in Supabase, you can mark the migration as applied using:

```bash
cd api
node mark-migration-applied.js 001_add_state_columns.sql
```

## Next Steps
After successfully applying the migrations:
1. Update the task status in `.kiro/specs/complete-order-fulfillment-workflow/tasks.md`
2. Proceed to Task 2: GraphQL API Extensions
3. Test the new schema with the API

## Notes
- Always backup your database before running migrations
- Test migrations in a development environment first
- Keep track of which migrations have been applied
- Never modify migration files after they've been applied
