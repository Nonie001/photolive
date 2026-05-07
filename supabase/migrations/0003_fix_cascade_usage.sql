-- Fix cascade bytes_used decrement
-- When events are deleted, the AFTER DELETE trigger on photos can no longer
-- find the owner (events row already gone). Use a BEFORE DELETE trigger on
-- events to pre-compute and decrement usage before cascade fires.

create or replace function public.on_event_delete_usage()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.subscriptions s
     set bytes_used = greatest(0, s.bytes_used - coalesce((
           select sum(coalesce(p.bytes, 0))
           from public.photos p
           where p.event_id = old.id
         ), 0)),
         updated_at = now()
   where s.user_id = old.owner_id;
  return old;
end $$;

drop trigger if exists trg_event_delete_usage on public.events;
create trigger trg_event_delete_usage
  before delete on public.events
  for each row execute function public.on_event_delete_usage();

-- Recalculate bytes_used to fix current stale state
update public.subscriptions s
   set bytes_used = coalesce((
     select sum(coalesce(p.bytes, 0))
     from public.photos p
     join public.events e on e.id = p.event_id
     where e.owner_id = s.user_id
   ), 0);
