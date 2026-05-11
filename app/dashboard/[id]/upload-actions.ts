"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { r2 } from "@/lib/r2";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Step 1 of direct-upload flow.
 * Returns signed upload URLs for both the original photo and thumbnail.
 * No file data passes through Next.js/Vercel — only a nanoid + paths.
 */
export async function getUploadUrls(
  eventId: string,
  ext: string,
): Promise<{
  ok: boolean;
  error?: string;
  photoPath?: string;
  thumbPath?: string;
  photoUploadUrl?: string;
  thumbUploadUrl?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ไม่ได้เข้าสู่ระบบ" };

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("owner_id", user.id)
    .single();
  if (!event) return { ok: false, error: "ไม่พบอีเวนต์" };

  const { nanoid } = await import("nanoid");
  const id = nanoid();
  const safeExt = ext.replace(/[^a-z0-9]/g, "").slice(0, 10) || "jpg";
  const photoPath = `${eventId}/${id}.${safeExt}`;
  const thumbPath = `${eventId}/${id}.jpg`;

  const photoUploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: "photos", Key: photoPath }),
    { expiresIn: 3600 },
  );

  const thumbUploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: "thumbs", Key: thumbPath }),
    { expiresIn: 3600 },
  );

  return { ok: true, photoPath, thumbPath, photoUploadUrl, thumbUploadUrl };
}

/**
 * Step 2 of direct-upload flow.
 * Called after both files are already uploaded to R2.
 * Inserts the DB row (and handles quota/expiry trigger errors).
 */
export async function insertPhotoRecord(params: {
  eventId: string;
  storagePath: string;
  thumbPath: string;
  width: number | null;
  height: number | null;
  bytes: number;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ไม่ได้เข้าสู่ระบบ" };

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", params.eventId)
    .eq("owner_id", user.id)
    .single();
  if (!event) return { ok: false, error: "ไม่พบอีเวนต์" };

  const admin = createAdminClient();
  const { error } = await admin.from("photos").insert({
    event_id: params.eventId,
    storage_path: params.storagePath,
    thumb_path: params.thumbPath,
    width: params.width,
    height: params.height,
    bytes: params.bytes,
    taken_at: null,
  });

  if (error) {
    // Quota/expiry trigger fired — clean up orphaned blobs
    await r2.send(new DeleteObjectCommand({ Bucket: "photos", Key: params.storagePath })).catch(() => {});
    await r2.send(new DeleteObjectCommand({ Bucket: "thumbs", Key: params.thumbPath })).catch(() => {});
    return { ok: false, error: mapDbError(error.message) };
  }

  revalidatePath(`/dashboard/${params.eventId}`);
  return { ok: true };
}

function mapDbError(message: string): string {
  if (message.includes("storage_quota_exceeded"))
    return "พื้นที่เก็บเต็มแล้ว — กรุณาอัปเกรดแพ็กเกจ";
  if (message.includes("subscription_expired"))
    return "แพ็กเกจหมดอายุ — กรุณาต่ออายุก่อนอัปโหลด";
  return message;
}

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

    await r2.send(
      new PutObjectCommand({
        Bucket: "photos",
        Key: storagePath,
        Body: buf,
        ContentType: file.type || "image/jpeg",
      }),
    );

    const sharp = (await import("sharp")).default;
    const thumbBuf = await sharp(buf)
      .rotate()
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    const meta = await sharp(buf).metadata();

    await r2.send(
      new PutObjectCommand({
        Bucket: "thumbs",
        Key: thumbPath,
        Body: thumbBuf,
        ContentType: "image/jpeg",
      }),
    );

    const { error: insErr } = await admin.from("photos").insert({
      event_id: eventId,
      storage_path: storagePath,
      thumb_path: thumbPath,
      width: meta.width ?? null,
      height: meta.height ?? null,
      bytes: file.size,
      taken_at: null,
    });
    if (insErr) {
      // Quota/expiry trigger fired — clean up uploaded blobs so we don't
      // accumulate orphans (and don't double-bill the user's quota).
      await r2.send(new DeleteObjectCommand({ Bucket: "photos", Key: storagePath })).catch(() => {});
      await r2.send(new DeleteObjectCommand({ Bucket: "thumbs", Key: thumbPath })).catch(() => {});
      return { ok: false, error: mapDbError(insErr.message) };
    }

    revalidatePath(`/dashboard/${eventId}`);
    return { ok: true };
  } catch (e) {
    console.error("uploadOnePhoto:", e);
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}
