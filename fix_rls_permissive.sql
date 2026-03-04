-- Nuclear option: Simplify policies to just check bucket_id
-- This rules out any issues with path matching or auth.uid() casting

BEGIN;

-- 1. Drop ALL existing policies related to this bucket to ensure no conflicts
DROP POLICY IF EXISTS "Public Access user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Auth users upload user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Auth users update user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Auth users delete user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own files" ON storage.objects;

-- 2. Ensure bucket is public
UPDATE storage.buckets SET public = true WHERE id = 'user-uploads';

-- 3. Simple Permissive Policies
-- Allow anyone to read (needed for public URLs)
CREATE POLICY "Public Read user-uploads"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'user-uploads' );

-- Allow any authenticated user to INSERT into this bucket (no path restriction)
CREATE POLICY "Auth Insert user-uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'user-uploads' );

-- Allow any authenticated user to UPDATE in this bucket
CREATE POLICY "Auth Update user-uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'user-uploads' );

-- Allow any authenticated user to DELETE in this bucket
CREATE POLICY "Auth Delete user-uploads"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'user-uploads' );

COMMIT;
