-- SaaS billing: plans, subscriptions, storage quota enforcement
-- Run after 0001_init.sql

-- ============================================================================
-- Plans (catalog)
-- ============================================================================

create table if not exists public.plans (
  id text primary key,                -- 'free' | 'basic' | 'standard' | 'pro'
  name text not null,
  storage_bytes bigint not null,      -- quota
  duration_days int,                  -- null = perpetual (free tier)
  price_thb int not null default 0,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

insert into public.plans (id, name, storage_bytes, duration_days, price_thb, sort) values
  ('free',     'Free',      1073741824,   null, 0,   0),  -- 1 GB
  ('basic',    'Basic',     5368709120,   30,   299, 1),  -- 5 GB / 30d
  ('standard', 'Standard',  10737418240,  30,   399, 2),  -- 10 GB / 30d
  ('pro',      'Pro',       32212254720,  30,   599, 3)   -- 30 GB / 30d
on conflict (id) do update set
  name = excluded.name,
  storage_bytes = excluded.storage_bytes,
  duration_days = excluded.duration_days,
  price_thb = excluded.price_thb,
  sort = excluded.sort;

alter table public.plans enable row level security;
drop policy if exists "plans public read" on public.plans;
create policy "plans public read" on public.plans
  for select to anon, authenticated using (true);

-- ============================================================================
-- Subscriptions (one row per user)
-- ============================================================================

create table if not exists public.subscriptions (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  plan_id    text not null references public.plans(id),
  started_at timestamptz not null default now(),
  expires_at timestamptz,                       -- null = no expiry (free)
  bytes_used bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "subs owner read" on public.subscriptions;
create policy "subs owner read" on public.subscriptions
  for select using (auth.uid() = user_id);
-- writes happen via SECURITY DEFINER functions / service role only

-- ============================================================================
-- Auto-create free subscription on signup + backfill existing users
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions (user_id, plan_id, started_at, expires_at)
  values (new.id, 'free', now(), null)
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.subscriptions (user_id, plan_id)
select id, 'free' from auth.users
on conflict (user_id) do nothing;

-- ============================================================================
-- Quota enforcement (BEFORE INSERT on photos)
-- ============================================================================

create or replace function public.enforce_photo_quota()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner       uuid;
  v_plan_bytes  bigint;
  v_used        bigint;
  v_expires     timestamptz;
  v_size        bigint;
begin
  select owner_id into v_owner from public.events where id = new.event_id;
  if v_owner is null then
    raise exception 'event_not_found';
  end if;

  select p.storage_bytes, s.bytes_used, s.expires_at
    into v_plan_bytes, v_used, v_expires
  from public.subscriptions s
  join public.plans p on p.id = s.plan_id
  where s.user_id = v_owner;

  if v_plan_bytes is null then
    -- Safety net: create free subscription if missing
    insert into public.subscriptions (user_id, plan_id) values (v_owner, 'free')
    on conflict (user_id) do nothing;
    select p.storage_bytes, s.bytes_used, s.expires_at
      into v_plan_bytes, v_used, v_expires
    from public.subscriptions s
    join public.plans p on p.id = s.plan_id
    where s.user_id = v_owner;
  end if;

  if v_expires is not null and v_expires < now() then
    raise exception 'subscription_expired';
  end if;

  v_size := coalesce(new.bytes, 0);
  if v_used + v_size > v_plan_bytes then
    raise exception 'storage_quota_exceeded';
  end if;

  return new;
end $$;

drop trigger if exists trg_enforce_photo_quota on public.photos;
create trigger trg_enforce_photo_quota
  before insert on public.photos
  for each row execute function public.enforce_photo_quota();

-- ============================================================================
-- Maintain bytes_used (AFTER INSERT/DELETE on photos)
-- ============================================================================

create or replace function public.update_subscription_usage()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner    uuid;
  v_event_id uuid;
begin
  v_event_id := coalesce(new.event_id, old.event_id);
  select owner_id into v_owner from public.events where id = v_event_id;
  if v_owner is null then
    return coalesce(new, old);
  end if;

  if (tg_op = 'INSERT') then
    update public.subscriptions
       set bytes_used = bytes_used + coalesce(new.bytes, 0),
           updated_at = now()
     where user_id = v_owner;
  elsif (tg_op = 'DELETE') then
    update public.subscriptions
       set bytes_used = greatest(0, bytes_used - coalesce(old.bytes, 0)),
           updated_at = now()
     where user_id = v_owner;
  end if;

  return coalesce(new, old);
end $$;

drop trigger if exists trg_update_sub_usage_ins on public.photos;
create trigger trg_update_sub_usage_ins
  after insert on public.photos
  for each row execute function public.update_subscription_usage();

drop trigger if exists trg_update_sub_usage_del on public.photos;
create trigger trg_update_sub_usage_del
  after delete on public.photos
  for each row execute function public.update_subscription_usage();

-- Backfill bytes_used for existing data
update public.subscriptions s
   set bytes_used = coalesce((
     select sum(coalesce(p.bytes, 0))
     from public.photos p
     join public.events e on e.id = p.event_id
     where e.owner_id = s.user_id
   ), 0);

-- ============================================================================
-- RPC: subscribe_to_plan (no real payment yet — instant activation)
-- ============================================================================

create or replace function public.subscribe_to_plan(p_plan_id text)
returns public.subscriptions
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_dur int;
  v_row public.subscriptions;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select duration_days into v_dur from public.plans where id = p_plan_id;
  if not found then
    raise exception 'invalid_plan';
  end if;

  insert into public.subscriptions (user_id, plan_id, started_at, expires_at, updated_at)
  values (
    v_uid,
    p_plan_id,
    now(),
    case when v_dur is null then null else now() + make_interval(days => v_dur) end,
    now()
  )
  on conflict (user_id) do update set
    plan_id    = excluded.plan_id,
    started_at = excluded.started_at,
    expires_at = excluded.expires_at,
    updated_at = now()
  returning * into v_row;

  return v_row;
end $$;

grant execute on function public.subscribe_to_plan(text) to authenticated;
