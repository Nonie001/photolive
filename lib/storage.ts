import type { PhotoRow } from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export function publicUrl(bucket: "photos" | "thumbs", path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export function thumbUrl(p: Pick<PhotoRow, "thumb_path">): string {
  return publicUrl("thumbs", p.thumb_path);
}

export function originalUrl(p: Pick<PhotoRow, "storage_path">): string {
  return publicUrl("photos", p.storage_path);
}
