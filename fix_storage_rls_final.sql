-- Drop all potential policies to start fresh and avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own files" ON storage.objects;

DROP POLICY IF EXISTS "Public Access user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Auth users upload user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Auth users update user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Auth users delete user-uploads" ON storage.objects;

-- Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-uploads', 'user-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 1. Public Read Access
CREATE POLICY "Public Access user-uploads"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'user-uploads' );

-- 2. Authenticated Upload (Insert)
-- Using simple string matching which is more robust than foldername() array parsing
CREATE POLICY "Auth users upload user-uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' AND
  name LIKE 'users/' || auth.uid() || '/%'
);

-- 3. Authenticated Update
CREATE POLICY "Auth users update user-uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  name LIKE 'users/' || auth.uid() || '/%'
);

-- 4. Authenticated Delete
CREATE POLICY "Auth users delete user-uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  name LIKE 'users/' || auth.uid() || '/%'
);
