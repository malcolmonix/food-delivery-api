-- Migration: Add coupon_code column to orders table
-- Date: 2026-02-06
-- Description: Adds coupon_code column to support discount codes in orders

-- Add coupon_code column if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- Add index for faster coupon code lookups
CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON orders(coupon_code) WHERE coupon_code IS NOT NULL;

-- Add comment
COMMENT ON COLUMN orders.coupon_code IS 'Discount coupon code applied to the order';
