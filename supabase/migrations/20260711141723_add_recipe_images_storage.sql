-- ============================================================
-- SECTION: Storage bucket - recipe images
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SECTION: Storage policies - recipe images
-- ============================================================

-- Allow anyone to read recipe images.
CREATE POLICY "Anyone can read recipe images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'recipe-images');

-- Allow authenticated users to upload only to a folder matching their own user id.
CREATE POLICY "Authenticated users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recipe-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update only files inside their own folder.
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'recipe-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete only files inside their own folder.
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to delete any recipe image.
CREATE POLICY "Admins can delete any recipe image"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND public.is_admin()
);

-- ============================================================
-- SECTION: Storage bucket - profile images
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SECTION: Storage policies - profile images
-- ============================================================

-- Allow anyone to read profile images.
CREATE POLICY "Anyone can read profile images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-images');

-- Allow authenticated users to upload only into their own folder.
CREATE POLICY "Authenticated users can upload profile images to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update only profile images inside their own folder.
CREATE POLICY "Users can update profile images in own folder"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete only profile images inside their own folder.
CREATE POLICY "Users can delete profile images in own folder"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);
