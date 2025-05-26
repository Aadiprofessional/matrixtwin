-- Check users table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check if is_verified column exists
SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'is_verified'
) AS has_is_verified_column;

-- Add is_verified column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;
END $$;

-- List all users with their verification status
SELECT id, email, name, role, is_verified 
FROM users;

-- Set a specific user as verified (replace with actual user ID or email)
-- UPDATE users SET is_verified = true WHERE email = 'anadi.mpvm@gmail.com'; 