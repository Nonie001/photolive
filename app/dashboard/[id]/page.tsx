import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { eventPublicUrl } from "@/lib/utils";
import { EventQrCard } from "./EventQrCard";
import { DeleteEventButton } from "./DeleteEventButton";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, name, slug, event_date, created_at")
    .eq("id", id)
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
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับ
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
          {event.event_date && (
            <p className="mt-1 text-sm text-muted-foreground">
              วันที่ {event.event_date}
            </p>
          )}
        </div>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-1.5 self-start rounded-full border border-border px-4 text-sm"
        >
          <ExternalLink className="h-4 w-4" />
          เปิดแกลเลอรี
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-muted/30 p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
            จำนวนรูปทั้งหมด
          </div>
          <p className="mt-2 text-3xl font-bold">{count ?? 0}</p>
        </div>
        <EventQrCard url={publicUrl} slug={event.slug} />
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-5">
        <h2 className="font-semibold">วิธีอัปโหลดรูป</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ใช้ <span className="font-mono">uploader CLI</span> ที่เครื่องของช่างภาพ
          ให้ watch โฟลเดอร์ที่กล้อง tether ลง:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-background p-3 font-mono text-xs">
          npm run upload -- --event {event.slug} --folder &quot;C:\Photos&quot;
        </pre>
      </div>

      <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5 dark:border-red-900/50 dark:bg-red-950/20">
        <h2 className="font-semibold text-red-700 dark:text-red-400">
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
