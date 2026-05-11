-- orders table: tracks every payment attempt
create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  plan_id      text not null references public.plans(id),
  amount_thb   int not null,
  omise_charge_id text,
  status       text not null default 'pending',  -- pending | successful | failed
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "orders owner read" on public.orders;
create policy "orders owner read" on public.orders
  for select to authenticated using (user_id = auth.uid());
