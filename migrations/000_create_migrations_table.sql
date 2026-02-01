-- Migration: Create migrations tracking table
-- Date: 2025-01-31
-- Description: Create table to track applied migrations

CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
