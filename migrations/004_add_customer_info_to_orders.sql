    -- Migration: Add customer_info column to orders table
    -- Date: 2026-02-06
    -- Description: Adds customer_info JSONB column to store customer details with orders

    -- Add customer_info column if it doesn't exist
    ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS customer_info JSONB;

    -- Add comment
    COMMENT ON COLUMN orders.customer_info IS 'Customer information snapshot at time of order (id, email, name, phone)';
