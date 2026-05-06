-- Realtime Event Photo Platform — initial schema
-- Run in Supabase SQL editor (or `supabase db push` if using local CLI).

-- ============================================================================
-- Tables
-- ============================================================================

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  event_date date,
  cover_photo_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists events_owner_id_idx on public.events (owner_id);
create index if not exists events_slug_idx on public.events (slug);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  storage_path text not null,
  thumb_path text not null,
  width int,
  height int,
  taken_at timestamptz,
  uploaded_at timestamptz not null default now(),
  bytes bigint
);

create index if not exists photos_event_uploaded_idx
  on public.photos (event_id, uploaded_at desc);

-- Optional FK from events.cover_photo_id (added after table exists).
alter table public.events
  drop constraint if exists events_cover_photo_id_fkey;
alter table public.events
  add constraint events_cover_photo_id_fkey
  foreign key (cover_photo_id) references public.photos(id) on delete set null;

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.events enable row level security;
alter table public.photos enable row level security;

-- events: owner full CRUD; anonymous SELECT (gallery is public via slug)
drop policy if exists "events owner all" on public.events;
create policy "events owner all" on public.events
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "events public read" on public.events;
create policy "events public read" on public.events
  for select
  to anon, authenticated
  using (true);

-- photos: owner CRUD via event ownership; anyone can SELECT
drop policy if exists "photos owner all" on public.photos;
create policy "photos owner all" on public.photos
  for all
  using (
    exists (
      select 1 from public.events e
      where e.id = photos.event_id and e.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = photos.event_id and e.owner_id = auth.uid()
    )
  );

drop policy if exists "photos public read" on public.photos;
create policy "photos public read" on public.photos
  for select
  to anon, authenticated
  using (true);

-- ============================================================================
-- Realtime
-- ============================================================================

-- Add photos to the supabase_realtime publication so clients can subscribe.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'photos'
  ) then
    alter publication supabase_realtime add table public.photos;
  end if;
end $$;

-- ============================================================================
-- Storage buckets
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('thumbs', 'thumbs', true)
on conflict (id) do update set public = true;

-- Storage RLS: public read, owner write (path convention: <eventId>/<file>)
drop policy if exists "photos bucket public read" on storage.objects;
create policy "photos bucket public read" on storage.objects
  for select
  to anon, authenticated
  using (bucket_id in ('photos', 'thumbs'));

drop policy if exists "photos bucket owner write" on storage.objects;
create policy "photos bucket owner write" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id in ('photos', 'thumbs')
    and exists (
      select 1 from public.events e
      where e.id::text = split_part(name, '/', 1)
        and e.owner_id = auth.uid()
    )
  );

drop policy if exists "photos bucket owner delete" on storage.objects;
create policy "photos bucket owner delete" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id in ('photos', 'thumbs')
    and exists (
      select 1 from public.events e
      where e.id::text = split_part(name, '/', 1)
        and e.owner_id = auth.uid()
    )
  );
