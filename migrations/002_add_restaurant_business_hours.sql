-- Migration: Add business hours and scheduling fields to restaurants
-- Date: 2026-02-03
-- Description: Add businessHours, timezone, autoScheduleEnabled, and related fields for restaurant hours automation
-- Requirements: 1.1, 1.3, BR-1.1

-- Add business hours as JSONB column
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{
  "monday": {"open": "09:00", "close": "21:00", "closed": false},
  "tuesday": {"open": "09:00", "close": "21:00", "closed": false},
  "wednesday": {"open": "09:00", "close": "21:00", "closed": false},
  "thursday": {"open": "09:00", "close": "21:00", "closed": false},
  "friday": {"open": "09:00", "close": "21:00", "closed": false},
  "saturday": {"open": "09:00", "close": "21:00", "closed": false},
  "sunday": {"open": "09:00", "close": "21:00", "closed": false}
}'::jsonb;

-- Add timezone column (IANA timezone format)
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Africa/Lagos';

-- Add auto-schedule enabled flag
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS auto_schedule_enabled BOOLEAN DEFAULT false;

-- Add last manual status change timestamp
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS last_manual_status_change TIMESTAMPTZ;

-- Add last auto status change timestamp
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS last_auto_status_change TIMESTAMPTZ;

-- Add notifications sent tracking
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS notifications_sent JSONB DEFAULT '{
  "twoHourWarning": null,
  "thirtyMinuteWarning": null,
  "lastResetDate": null
}'::jsonb;

-- Add is_online column if it doesn't exist (for status tracking)
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- Add last_status_update column if it doesn't exist
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS last_status_update TIMESTAMPTZ;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_restaurants_auto_schedule 
ON restaurants(auto_schedule_enabled) 
WHERE auto_schedule_enabled = true;

CREATE INDEX IF NOT EXISTS idx_restaurants_timezone 
ON restaurants(timezone);

CREATE INDEX IF NOT EXISTS idx_restaurants_is_online 
ON restaurants(is_online);

-- Add comments for documentation
COMMENT ON COLUMN restaurants.business_hours IS 'Business hours for each day of the week in JSONB format';
COMMENT ON COLUMN restaurants.timezone IS 'IANA timezone for accurate scheduling (e.g., Africa/Lagos)';
COMMENT ON COLUMN restaurants.auto_schedule_enabled IS 'Whether automatic status changes based on business hours are enabled';
COMMENT ON COLUMN restaurants.last_manual_status_change IS 'Timestamp of last manual status change by vendor';
COMMENT ON COLUMN restaurants.last_auto_status_change IS 'Timestamp of last automatic status change by system';
COMMENT ON COLUMN restaurants.notifications_sent IS 'Tracking for sent closing notifications (2hr, 30min warnings)';
COMMENT ON COLUMN restaurants.is_online IS 'Current online/offline status of the restaurant';
COMMENT ON COLUMN restaurants.last_status_update IS 'Timestamp of last status update (manual or automatic)';

-- Update existing restaurants with default business hours
-- This ensures all existing restaurants have the new fields populated
UPDATE restaurants 
SET 
  business_hours = '{
    "monday": {"open": "09:00", "close": "21:00", "closed": false},
    "tuesday": {"open": "09:00", "close": "21:00", "closed": false},
    "wednesday": {"open": "09:00", "close": "21:00", "closed": false},
    "thursday": {"open": "09:00", "close": "21:00", "closed": false},
    "friday": {"open": "09:00", "close": "21:00", "closed": false},
    "saturday": {"open": "09:00", "close": "21:00", "closed": false},
    "sunday": {"open": "09:00", "close": "21:00", "closed": false}
  }'::jsonb,
  timezone = 'Africa/Lagos',
  auto_schedule_enabled = false,
  notifications_sent = '{
    "twoHourWarning": null,
    "thirtyMinuteWarning": null,
    "lastResetDate": null
  }'::jsonb
WHERE business_hours IS NULL OR timezone IS NULL;

-- Verification query (commented out, uncomment to verify)
-- SELECT id, name, business_hours, timezone, auto_schedule_enabled 
-- FROM restaurants 
-- LIMIT 5;
