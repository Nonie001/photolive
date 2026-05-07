export type EventRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  event_date: string | null;
  cover_photo_id: string | null;
  created_at: string;
};

export type PhotoRow = {
  id: string;
  event_id: string;
  storage_path: string;
  thumb_path: string;
  width: number | null;
  height: number | null;
  taken_at: string | null;
  uploaded_at: string;
  bytes: number | null;
};

export type PlanRow = {
  id: string;
  name: string;
  storage_bytes: number;
  duration_days: number | null;
  price_thb: number;
  sort: number;
};

export type SubscriptionRow = {
  user_id: string;
  plan_id: string;
  started_at: string;
  expires_at: string | null;
  bytes_used: number;
  updated_at: string;
};
