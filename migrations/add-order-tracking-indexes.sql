-- ============================================================================
-- Migration: Add Order Tracking Indexes
-- Created: February 10, 2026
-- Purpose: Optimize order tracking queries by adding indexes on frequently
--          queried columns (order_id, user_id, order_status)
-- ============================================================================

-- Description:
-- This migration adds three indexes to the orders table to improve query
-- performance for order tracking features:
--
-- 1. idx_orders_order_id: Speeds up lookups by public order ID
-- 2. idx_orders_user_id: Optimizes queries for user's order history
-- 3. idx_orders_status: Improves filtering by order status
--
-- Note: The 'id' column already has a primary key index and doesn't need
--       an additional index.
--
-- All indexes are created with IF NOT EXISTS to ensure idempotency,
-- allowing this migration to be run multiple times safely.

-- ============================================================================
-- Index 1: order_id column
-- ============================================================================
-- Purpose: Fast lookups when tracking orders by public order ID
-- Used by: Order tracking queries, status updates, customer order lookup
-- Impact: Significantly improves performance for single order queries

CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);

-- ============================================================================
-- Index 2: user_id column
-- ============================================================================
-- Purpose: Optimize queries that fetch all orders for a specific user
-- Used by: Order history page, user dashboard, customer order list
-- Impact: Improves performance when loading user's order history

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- ============================================================================
-- Index 3: order_status column
-- ============================================================================
-- Purpose: Speed up filtering orders by status
-- Used by: Vendor order queue, admin dashboard, status-based filtering
-- Impact: Improves performance for status-based queries and reports

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- After running this migration, verify indexes were created successfully:
--
-- For SQLite (development):
-- SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='orders';
--
-- For PostgreSQL (production - Supabase):
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'orders';
--
-- Expected output should include:
-- - idx_orders_order_id
-- - idx_orders_user_id
-- - idx_orders_status
-- ============================================================================

-- ============================================================================
-- Rollback Instructions
-- ============================================================================
-- If you need to rollback this migration, run:
--
-- DROP INDEX IF EXISTS idx_orders_order_id;
-- DROP INDEX IF EXISTS idx_orders_user_id;
-- DROP INDEX IF EXISTS idx_orders_status;
-- ============================================================================

-- ============================================================================
-- Performance Notes
-- ============================================================================
-- Expected improvements:
-- - Order lookup by order_id: ~10-100x faster for large datasets
-- - User order history: ~5-50x faster depending on user's order count
-- - Status filtering: ~5-20x faster for vendor/admin dashboards
--
-- Index maintenance:
-- - Indexes are automatically maintained by the database
-- - Slight overhead on INSERT/UPDATE/DELETE operations (negligible)
-- - Disk space: ~1-5% increase depending on table size
-- ============================================================================
