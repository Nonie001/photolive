-- Add photo_access setting to events
-- 'public'    = all guests can browse the full gallery (default)
-- 'face_only' = guests must scan their face first; they only see their own photos

alter table public.events
  add column if not exists photo_access text not null default 'public'
  check (photo_access in ('public', 'face_only'));
