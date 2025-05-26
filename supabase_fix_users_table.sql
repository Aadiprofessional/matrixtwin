-- Make the password column nullable since it's handled by Supabase Auth
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Or if you prefer to remove the password column entirely (recommended)
-- ALTER TABLE users DROP COLUMN password; 