-- Migration: Update plans to match new pricing (May 2026)
-- free    : 500 MB  | no expiry | ฿0
-- starter : 5 GB   | 14 days   | ฿349
-- pro     : 15 GB  | 30 days   | ฿699
-- ultra   : 40 GB  | 30 days   | ฿1,190
-- pro_yearly   : 15 GB | 365 days | ฿6,999
-- ultra_yearly : 40 GB | 365 days | ฿12,999

insert into public.plans (id, name, storage_bytes, duration_days, price_thb, sort)
values
  ('free',         'Free',          524288000,    null, 0,     0),  -- 500 MB
  ('starter',      'Basic',         5368709120,   14,   349,   1),  -- 5 GB  / 14d
  ('pro',          'Pro',           16106127360,  30,   699,   2),  -- 15 GB / 30d
  ('ultra',        'Ultra',         42949672960,  30,   1190,  3),  -- 40 GB / 30d
  ('pro_yearly',   'Pro (รายปี)',   16106127360,  365,  6999,  12), -- 15 GB / 365d
  ('ultra_yearly', 'Ultra (รายปี)', 42949672960,  365,  12999, 13)  -- 40 GB / 365d
on conflict (id) do update set
  name          = excluded.name,
  storage_bytes = excluded.storage_bytes,
  duration_days = excluded.duration_days,
  price_thb     = excluded.price_thb,
  sort          = excluded.sort;
