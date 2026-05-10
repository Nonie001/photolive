-- Restructure plans to new tier model
-- free: 150 MB | no expiry | ฿0
-- starter:  5 GB | 14 days  | ฿399
-- pro:     10 GB | 30 days  | ฿699   ← highlight
-- ultra:   30 GB | 30 days  | ฿1,290

-- 1. Insert new plan IDs that don't exist yet
insert into public.plans (id, name, storage_bytes, duration_days, price_thb, sort) values
  ('starter', 'Starter', 5368709120,  14,  399, 1),
  ('ultra',   'Ultra',   32212254720, 30, 1290, 3)
on conflict (id) do nothing;

-- 2. Migrate subscriptions off retired plan IDs (order matters for FK safety)
update public.subscriptions set plan_id = 'ultra'   where plan_id = 'pro';
update public.subscriptions set plan_id = 'starter' where plan_id = 'basic';
update public.subscriptions set plan_id = 'pro'     where plan_id = 'standard';

-- 3. Update plan data in-place
update public.plans set
  storage_bytes = 157286400,   -- 150 MB
  sort          = 0
where id = 'free';

update public.plans set
  name          = 'Pro',
  storage_bytes = 10737418240, -- 10 GB
  duration_days = 30,
  price_thb     = 699,
  sort          = 2
where id = 'pro';

-- 4. Remove retired plan rows
delete from public.plans where id in ('basic', 'standard');
