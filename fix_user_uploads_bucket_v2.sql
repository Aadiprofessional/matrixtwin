-- 1. Create the 'user-uploads' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-uploads', 'user-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create policies with UNIQUE names to avoid conflicts with existing "Public Access" policies
-- We use DO $$ blocks to safely create policies only if they don't exist, preventing 42710 errors

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Public Access user-uploads'
    ) THEN
        CREATE POLICY "Public Access user-uploads"
        ON storage.objects FOR SELECT
        TO public
        USING ( bucket_id = 'user-uploads' );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Auth users upload user-uploads'
    ) THEN
        CREATE POLICY "Auth users upload user-uploads"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
          bucket_id = 'user-uploads' AND
          (storage.foldername(name))[1] = 'users' AND
          (storage.foldername(name))[2] = auth.uid()::text
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Auth users update user-uploads'
    ) THEN
        CREATE POLICY "Auth users update user-uploads"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (
          bucket_id = 'user-uploads' AND
          (storage.foldername(name))[1] = 'users' AND
          (storage.foldername(name))[2] = auth.uid()::text
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Auth users delete user-uploads'
    ) THEN
        CREATE POLICY "Auth users delete user-uploads"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
          bucket_id = 'user-uploads' AND
          (storage.foldername(name))[1] = 'users' AND
          (storage.foldername(name))[2] = auth.uid()::text
        );
    END IF;
END $$;
