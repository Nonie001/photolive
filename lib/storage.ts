import type { PhotoRow } from "./types";

const R2_PHOTOS_URL = (process.env.NEXT_PUBLIC_R2_PHOTOS_URL ?? "").replace(/\/$/, "");
const R2_THUMBS_URL = (process.env.NEXT_PUBLIC_R2_THUMBS_URL ?? "").replace(/\/$/, "");

export function publicUrl(bucket: "photos" | "thumbs", path: string): string {
  const base = bucket === "photos" ? R2_PHOTOS_URL : R2_THUMBS_URL;
  return `${base}/${path}`;
}

export function thumbUrl(p: Pick<PhotoRow, "thumb_path">): string {
  return publicUrl("thumbs", p.thumb_path);
}

export function originalUrl(p: Pick<PhotoRow, "storage_path">): string {
  return publicUrl("photos", p.storage_path);
}
