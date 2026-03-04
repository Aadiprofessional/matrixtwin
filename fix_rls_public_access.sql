BEGIN;

-- 1. Drop ALL existing policies for this bucket to ensure no conflicts
DROP POLICY IF EXISTS "Public Access user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Auth users upload user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Auth users update user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Auth users delete user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Read user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own files" ON storage.objects;

-- 2. Ensure bucket is public
UPDATE storage.buckets SET public = true WHERE id = 'user-uploads';

-- 3. Create PUBLIC (Anon) Access Policies
-- Since the app uses custom auth (not Supabase Auth), the Supabase client is effectively anonymous.
-- We must allow the 'public' role to perform these operations.

CREATE POLICY "Public Select user-uploads"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'user-uploads' );

CREATE POLICY "Public Insert user-uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'user-uploads' );

CREATE POLICY "Public Update user-uploads"
ON storage.objects FOR UPDATE
TO public
USING ( bucket_id = 'user-uploads' );

CREATE POLICY "Public Delete user-uploads"
ON storage.objects FOR DELETE
TO public
USING ( bucket_id = 'user-uploads' );

COMMIT;
