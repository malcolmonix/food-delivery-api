-- Add user_type column to users table
-- This column identifies the role of the user: customer, rider, vendor, admin

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'customer';

-- Add comment
COMMENT ON COLUMN users.user_type IS 'User role: customer, rider, vendor, admin';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- Update any existing riders (if we can identify them)
-- This is a placeholder - you may need to manually identify riders
-- UPDATE users SET user_type = 'rider' WHERE uid IN ('rider-uid-1', 'rider-uid-2');
