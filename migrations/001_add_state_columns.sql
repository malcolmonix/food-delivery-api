-- Migration: Add state columns for state-based filtering
-- Date: 2025-01-31
-- Description: Add state column to restaurants, riders, and users tables for geographic filtering

-- Add state column to restaurants table
ALTER TABLE restaurants ADD COLUMN state TEXT;

-- Add state column to riders table (if exists, otherwise will be created)
-- ALTER TABLE riders ADD COLUMN state TEXT;

-- Add state column to users table
ALTER TABLE users ADD COLUMN state TEXT;

-- Create indexes for state-based queries
CREATE INDEX IF NOT EXISTS idx_restaurants_state ON restaurants(state, isActive);
CREATE INDEX IF NOT EXISTS idx_restaurants_state_cuisine ON restaurants(state, cuisineType, isActive);

-- Note: Rider table indexes will be added when rider table is created
-- CREATE INDEX IF NOT EXISTS idx_riders_state ON riders(state, isOnline, isBusy);

-- Create delivery_rates table
CREATE TABLE IF NOT EXISTS delivery_rates (
  id TEXT PRIMARY KEY,
  state TEXT,  -- NULL for default rate
  minDistance REAL DEFAULT 0,  -- km
  maxDistance REAL,  -- km, NULL for unlimited
  baseFee REAL NOT NULL DEFAULT 2000,  -- ₦2,000 default
  perKmFee REAL DEFAULT 0,
  surgePricing INTEGER DEFAULT 0,  -- SQLite uses INTEGER for BOOLEAN
  surgeMultiplier REAL DEFAULT 1.0,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create index for delivery rates
CREATE INDEX IF NOT EXISTS idx_delivery_rates_state ON delivery_rates(state, isActive);
CREATE INDEX IF NOT EXISTS idx_delivery_rates_distance ON delivery_rates(minDistance, maxDistance, isActive);

-- Insert default delivery rate
INSERT INTO delivery_rates (id, state, baseFee, isActive)
VALUES ('default-rate', NULL, 2000, 1)
ON CONFLICT(id) DO NOTHING;

-- Add comment for future reference
-- States will be populated as restaurants and riders register
-- Common Nigerian states: Lagos, Abuja, Rivers, Kano, Oyo, etc.
