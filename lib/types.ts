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
