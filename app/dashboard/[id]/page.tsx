import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { eventPublicUrl } from "@/lib/utils";
import { EventQrCard } from "./EventQrCard";
import { DeleteEventButton } from "./DeleteEventButton";
import { MobileUploader } from "./MobileUploader";
import { AccessToggle } from "./AccessToggle";
import { SoftwareDownloads } from "./SoftwareDownloads";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: event } = await supabase
    .from("events")
    .select("id, name, slug, event_date, created_at, photo_access")
    .eq("id", id)
    .eq("owner_id", user!.id)
    .single();

  if (!event) notFound();

  const { count } = await supabase
    .from("photos")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event.id);

  const publicUrl = eventPublicUrl(event.slug);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับ
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 bg-clip-text text-xs font-semibold uppercase tracking-wider text-transparent">อีเวนต์</p>
          <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight">{event.name}</h1>
          {event.event_date && (
            <p className="mt-1 text-sm text-muted-foreground">วันที่ {event.event_date}</p>
          )}
        </div>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-1.5 self-start rounded-full bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 px-5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/20 transition-transform hover:scale-[1.02]"
        >
          <ExternalLink className="h-4 w-4" />
          เปิดแกลเลอรี
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-muted/20 p-5 transition-all hover:border-fuchsia-500/20">
          <p className="bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 bg-clip-text text-xs font-semibold uppercase tracking-wider text-transparent">รูปทั้งหมด</p>
          <p className="mt-2 text-4xl font-extrabold">{count ?? 0}</p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ImageIcon className="h-3.5 w-3.5" />
            ภาพถ่าย
          </div>
        </div>
        <EventQrCard url={publicUrl} slug={event.slug} />
      </div>

      <MobileUploader eventId={event.id} />

      {/* Access setting */}
      <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-3">
        <div>
          <p className="bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 bg-clip-text text-xs font-semibold uppercase tracking-wider text-transparent">การเข้าถึง</p>
          <h2 className="mt-0.5 font-extrabold">การแสดงรูป</h2>
          <p className="mt-1 text-sm text-muted-foreground">เลือกว่าแขกทุกคนดูรูปได้ทั้งหมด หรือต้องสแกนใบหน้าก่อนเพื่อดูเฉพาะรูปตัวเอง</p>
        </div>
        <AccessToggle eventId={event.id} initial={(event.photo_access as "public" | "face_only") ?? "public"} />
      </div>

      <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4">
        <div>
          <p className="bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 bg-clip-text text-xs font-semibold uppercase tracking-wider text-transparent">ซอฟต์แวร์</p>
          <h2 className="mt-0.5 font-extrabold">โปรแกรมอัปโหลดอัตโนมัติ (ช่างภาพ)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ติดตั้งโปรแกรมที่เครื่องช่างภาพ — เปิดโฟลเดอร์แล้วรูปขึ้นเว็บอัตโนมัติ
          </p>
        </div>

        <SoftwareDownloads />

      </div>

      <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-5">
        <h2 className="font-extrabold text-red-400">
          ลบอีเวนต์
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ลบอีเวนต์นี้พร้อมกับรูปทั้งหมด ไม่สามารถกู้คืนได้
        </p>
        <div className="mt-3">
          <DeleteEventButton id={event.id} name={event.name} />
        </div>
      </div>
    </div>
  );
}
