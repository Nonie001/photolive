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

