"use server";

import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type UploadState = {
  ok: number;
  fail: number;
  error: string | null;
};

export async function uploadPhotosAction(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) return { ok: 0, fail: 0, error: "ไม่พบ event ID" };

  // Verify ownership
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("owner_id", user.id)
    .single();
  if (!event) return { ok: 0, fail: 0, error: "ไม่พบอีเวนต์หรือไม่มีสิทธิ์" };

  const admin = createAdminClient();
  const files = formData.getAll("photos") as File[];
  if (files.length === 0) return { ok: 0, fail: 0, error: "ไม่มีไฟล์" };

  let ok = 0;
  let fail = 0;

  for (const file of files) {
    if (!file || file.size === 0) continue;
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const id = nanoid();
      const storagePath = `${eventId}/${id}.${ext}`;
      const thumbPath = `${eventId}/${id}.jpg`;

      const bytes = await file.arrayBuffer();
      const buf = Buffer.from(bytes);

      // Upload original
      const { error: upErr } = await admin.storage
        .from("photos")
        .upload(storagePath, buf, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });
      if (upErr) { fail++; continue; }

      // Generate thumbnail server-side with sharp
      const sharp = (await import("sharp")).default;
      const thumbBuf = await sharp(buf)
        .resize(800, 800, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Get dimensions
      const meta = await sharp(buf).metadata();

      // Upload thumb
      const { error: thumbErr } = await admin.storage
        .from("thumbs")
        .upload(thumbPath, thumbBuf, {
          contentType: "image/jpeg",
          upsert: false,
        });
      if (thumbErr) { fail++; continue; }

      // Insert DB row (use admin to bypass RLS; ownership already verified)
      const { error: insErr } = await admin.from("photos").insert({
        event_id: eventId,
        storage_path: storagePath,
        thumb_path: thumbPath,
        width: meta.width ?? null,
        height: meta.height ?? null,
        bytes: file.size,
        taken_at: null,
      });
      if (insErr) { fail++; continue; }

      ok++;
    } catch (e) {
      console.error("upload error:", e);
      fail++;
    }
  }

  revalidatePath(`/dashboard/${eventId}`);
  return { ok, fail, error: null };
}
