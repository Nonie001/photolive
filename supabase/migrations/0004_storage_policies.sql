-- Storage bucket policies for authenticated event owners
-- Allows the desktop uploader (using user JWT) to upload directly
-- without needing the service-role key.

-- photos bucket
drop policy if exists "event owners can upload photos" on storage.objects;
create policy "event owners can upload photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] in (
      select id::text from public.events where owner_id = auth.uid()
    )
  );

drop policy if exists "event owners can delete photos" on storage.objects;
create policy "event owners can delete photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] in (
      select id::text from public.events where owner_id = auth.uid()
    )
  );

-- thumbs bucket
drop policy if exists "event owners can upload thumbs" on storage.objects;
create policy "event owners can upload thumbs"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'thumbs'
    and (storage.foldername(name))[1] in (
      select id::text from public.events where owner_id = auth.uid()
    )
  );

drop policy if exists "event owners can delete thumbs" on storage.objects;
create policy "event owners can delete thumbs"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'thumbs'
    and (storage.foldername(name))[1] in (
      select id::text from public.events where owner_id = auth.uid()
    )
  );
