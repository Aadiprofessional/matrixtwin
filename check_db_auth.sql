-- 1. Check auth.users table for your user
SELECT id, email, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data
FROM auth.users 
WHERE email = 'anadi.mpvm@gmail.com';

-- 2. Check custom users table
SELECT *
FROM users
WHERE email = 'anadi.mpvm@gmail.com';

-- 3. Check for missing fields or constraints in users table
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM 
  information_schema.columns
WHERE 
  table_name = 'users'
ORDER BY 
  ordinal_position;

-- 4. Check RLS policies on users table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'users';

-- 5. Check if your user ID actually exists in auth.users
SELECT EXISTS(
  SELECT 1 FROM auth.users 
  WHERE id = (SELECT id FROM users WHERE email = 'anadi.mpvm@gmail.com')
) as auth_user_exists;

-- 6. Check if email has been confirmed in auth system
SELECT email, email_confirmed_at
FROM auth.users 
WHERE email = 'anadi.mpvm@gmail.com';

-- 7. Check if there are duplicate users
SELECT email, COUNT(*) 
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 8. Force update verification status and credentials
UPDATE users 
SET 
  is_verified = true,
  theme_preference = 'dark',
  notifications_enabled = true,
  language_preference = 'en',
  updated_at = NOW()
WHERE email = 'anadi.mpvm@gmail.com'; 