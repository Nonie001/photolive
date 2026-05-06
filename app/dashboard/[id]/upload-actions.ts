"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Upload a single photo. Designed to be called in parallel from the client
 * for fast multi-file uploads with per-file progress.
 */
export async function uploadOnePhoto(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ไม่ได้เข้าสู่ระบบ" };

  const eventId = String(formData.get("eventId") ?? "");
  const file = formData.get("photo") as File | null;
  if (!eventId || !file || file.size === 0) {
    return { ok: false, error: "ข้อมูลไม่ครบ" };
  }

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("owner_id", user.id)
    .single();
  if (!event) return { ok: false, error: "ไม่พบอีเวนต์" };

  const admin = createAdminClient();
  try {
    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
    const { nanoid } = await import("nanoid");
    const id = nanoid();
    const storagePath = `${eventId}/${id}.${ext}`;
    const thumbPath = `${eventId}/${id}.jpg`;

    const buf = Buffer.from(await file.arrayBuffer());

    const { error: upErr } = await admin.storage
      .from("photos")
      .upload(storagePath, buf, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
    if (upErr) return { ok: false, error: upErr.message };

    const sharp = (await import("sharp")).default;
    const thumbBuf = await sharp(buf)
      .rotate()
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    const meta = await sharp(buf).metadata();

    const { error: thumbErr } = await admin.storage
      .from("thumbs")
      .upload(thumbPath, thumbBuf, {
        contentType: "image/jpeg",
        upsert: false,
      });
    if (thumbErr) return { ok: false, error: thumbErr.message };

    const { error: insErr } = await admin.from("photos").insert({
      event_id: eventId,
      storage_path: storagePath,
      thumb_path: thumbPath,
      width: meta.width ?? null,
      height: meta.height ?? null,
      bytes: file.size,
      taken_at: null,
    });
    if (insErr) return { ok: false, error: insErr.message };

    revalidatePath(`/dashboard/${eventId}`);
    return { ok: true };
  } catch (e) {
    console.error("uploadOnePhoto:", e);
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}
