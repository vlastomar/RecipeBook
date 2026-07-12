-- ============================================================
-- SECTION: Storage policies - recipe images
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any recipe image" ON storage.objects;

CREATE POLICY "Authenticated users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recipe-images'
  AND auth.uid() IS NOT NULL
  AND (
    owner_id = auth.uid()::text
    OR name LIKE auth.uid()::text || '/%'
  )
);

CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND auth.uid() IS NOT NULL
  AND name LIKE auth.uid()::text || '/%'
)
WITH CHECK (
  bucket_id = 'recipe-images'
  AND auth.uid() IS NOT NULL
  AND (
    owner_id = auth.uid()::text
    OR name LIKE auth.uid()::text || '/%'
  )
);

CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND auth.uid() IS NOT NULL
  AND (
    owner_id = auth.uid()::text
    OR name LIKE auth.uid()::text || '/%'
  )
);

CREATE POLICY "Admins can delete any recipe image"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND public.is_admin()
);

-- ============================================================
-- SECTION: Storage policies - profile images
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can upload profile images to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update profile images in own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete profile images in own folder" ON storage.objects;

CREATE POLICY "Authenticated users can upload profile images to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
  AND auth.uid() IS NOT NULL
  AND (
    owner_id = auth.uid()::text
    OR name LIKE auth.uid()::text || '/%'
  )
);

CREATE POLICY "Users can update profile images in own folder"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND auth.uid() IS NOT NULL
  AND name LIKE auth.uid()::text || '/%'
)
WITH CHECK (
  bucket_id = 'profile-images'
  AND auth.uid() IS NOT NULL
  AND (
    owner_id = auth.uid()::text
    OR name LIKE auth.uid()::text || '/%'
  )
);

CREATE POLICY "Users can delete profile images in own folder"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND auth.uid() IS NOT NULL
  AND (
    owner_id = auth.uid()::text
    OR name LIKE auth.uid()::text || '/%'
  )
);