-- Migration: Add yearly plan variants
-- starter_yearly : 5 GB  | 365 days | ฿2,990  (save 37% vs monthly×12)
-- pro_yearly     : 10 GB | 365 days | ฿5,990  (save 29% vs monthly×12)
-- ultra_yearly   : 30 GB | 365 days | ฿9,990  (save 35% vs monthly×12)

insert into public.plans (id, name, storage_bytes, duration_days, price_thb, sort)
values
  ('pro_yearly',   'Pro (รายปี)',   10737418240, 365, 6999,  12),
  ('ultra_yearly', 'Ultra (รายปี)', 32212254720, 365, 12999, 13)
on conflict (id) do update set
  name          = excluded.name,
  storage_bytes = excluded.storage_bytes,
  duration_days = excluded.duration_days,
  price_thb     = excluded.price_thb,
  sort          = excluded.sort;
