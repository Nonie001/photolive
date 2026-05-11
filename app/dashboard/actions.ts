"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateEventSlug } from "@/lib/utils";
import { r2 } from "@/lib/r2";
import { ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

export type CreateEventState = { error: string | null };

export async function createEvent(
  _prev: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const name = String(formData.get("name") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "").trim() || null;
  const photoAccess = formData.get("photo_access") === "face_only" ? "face_only" : "public";

  if (!name) {
    return { error: "กรุณาใส่ชื่ออีเวนต์" };
  }
  if (name.length > 100) {
    return { error: "ชื่ออีเวนต์ยาวเกินไป (สูงสุด 100 ตัวอักษร)" };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr) {
    console.error("[createEvent] auth error:", authErr.message);
    return { error: "ไม่สามารถยืนยันตัวตนได้ กรุณาเข้าสู่ระบบใหม่" };
  }
  if (!user) redirect("/login");

  // Try a few times in the (vanishingly rare) case of slug collision.
  let lastError: string | null = null;
  let createdId: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateEventSlug();
    const { data, error } = await supabase
      .from("events")
      .insert({
        owner_id: user.id,
        name,
        slug,
        event_date: eventDate,
        photo_access: photoAccess,
      })
      .select("id, slug")
      .single();

    if (!error && data) {
      createdId = data.id;
      break;
    }
    lastError = error?.message ?? "unknown error";
    console.error(`[createEvent] insert attempt ${attempt + 1} failed:`, lastError, "code:", error?.code);
    // 23505 = unique_violation (slug collision) — retry
    if (error?.code !== "23505") break;
  }

  if (!createdId) {
    return { error: `สร้างอีเวนต์ไม่สำเร็จ: ${lastError}` };
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard/${createdId}`);
}

export async function deleteEvent(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify ownership and load event_id for storage cleanup.
  const { data: event } = await supabase
    .from("events")
    .select("id, owner_id")
    .eq("id", id)
    .single();
  if (!event || event.owner_id !== user.id) {
    return { error: "ไม่พบอีเวนต์หรือไม่มีสิทธิ์" };
  }

  // Best-effort storage cleanup using R2
  for (const bucket of ["photos", "thumbs"] as const) {
    const listed = await r2.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: `${id}/` }),
    );
    const objects = listed.Contents?.map((o) => ({ Key: o.Key! })) ?? [];
    if (objects.length > 0) {
      await r2.send(
        new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects } }),
      );
    }
  }

  // ON DELETE CASCADE removes photo rows.
  await supabase.from("events").delete().eq("id", id);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateEventAccess(
  id: string,
  photoAccess: "public" | "face_only",
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ไม่ได้เข้าสู่ระบบ" };

  const { error } = await supabase
    .from("events")
    .update({ photo_access: photoAccess })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${id}`);
  return {};
}
