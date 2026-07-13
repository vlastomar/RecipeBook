-- Ensure the profile images bucket exists
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-images',
  'profile-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Remove old or incorrect policies
drop policy if exists
  "Anyone can read profile images"
on storage.objects;

drop policy if exists
  "Authenticated users can upload profile images to own folder"
on storage.objects;

drop policy if exists
  "Users can update profile images in own folder"
on storage.objects;

drop policy if exists
  "Users can delete profile images in own folder"
on storage.objects;

-- Public read access
create policy "Anyone can read profile images"
on storage.objects
for select
to public
using (
  bucket_id = 'profile-images'
);

-- Authenticated users may upload only into their own folder:
-- <auth-user-id>/<filename>
create policy "Authenticated users can upload profile images to own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- Users may update only files in their own folder
create policy "Users can update profile images in own folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-images'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'profile-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- Users may delete only files in their own folder
create policy "Users can delete profile images in own folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-images'
  and split_part(name, '/', 1) = auth.uid()::text
);