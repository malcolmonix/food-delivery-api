# Quick Migration Guide

## 🚀 Execute This SQL in Supabase

### 1. Create Migrations Table (Run First)
```sql
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Apply Schema Changes (Run Second)
```sql
-- Add state columns
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT;

-- Create indexes
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

-- Create delivery_rates indexes
CREATE INDEX IF NOT EXISTS idx_delivery_rates_state ON delivery_rates(state, isActive);
CREATE INDEX IF NOT EXISTS idx_delivery_rates_distance ON delivery_rates(minDistance, maxDistance, isActive);

-- Insert default rate
INSERT INTO delivery_rates (id, state, baseFee, isActive)
VALUES ('default-rate', NULL, 2000, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Record migration
INSERT INTO migrations (filename) VALUES ('001_add_state_columns.sql')
ON CONFLICT (filename) DO NOTHING;
```

## ✅ Verify Migration
```bash
cd api
node verify-migration.js
```

## 📍 Supabase Dashboard
https://jwkcvqfevkbribdvlyvo.supabase.co

Navigate to: **SQL Editor** → **New Query** → Paste SQL → **Run**
