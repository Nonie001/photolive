import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, ImageIcon, Monitor, Apple } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { eventPublicUrl } from "@/lib/utils";
import { EventQrCard } from "./EventQrCard";
import { DeleteEventButton } from "./DeleteEventButton";
import { MobileUploader } from "./MobileUploader";

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
    .select("id, name, slug, event_date, created_at")
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

      <MobileUploader eventId={event.id} />

      <div className="rounded-2xl border border-border bg-muted/30 p-5 space-y-4">
        <div>
          <h2 className="font-semibold">โปรแกรมอัปโหลดอัตโนมัติ (ช่างภาพ)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ติดตั้งโปรแกรมที่เครื่องช่างภาพ — เปิดโฟลเดอร์แล้วรูปขึ้นเว็บอัตโนมัติ
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a
            href="/downloads/PhotoLive-Setup.exe"
            className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm transition-colors hover:bg-muted/60"
          >
            <Monitor className="h-5 w-5 shrink-0 text-blue-500" />
            <div>
              <p className="font-medium">Windows</p>
              <p className="text-xs text-muted-foreground">PhotoLive-Setup.exe</p>
            </div>
          </a>
          <a
            href="/downloads/PhotoLive.dmg"
            className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm transition-colors hover:bg-muted/60"
          >
            <Apple className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">macOS</p>
              <p className="text-xs text-muted-foreground">PhotoLive.dmg</p>
            </div>
          </a>
        </div>

        <details className="group">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground list-none flex items-center gap-1">
            <span className="group-open:hidden">▶</span>
            <span className="hidden group-open:inline">▼</span>
            ใช้ CLI แทน
          </summary>
          <div className="mt-2 space-y-1">
            <p className="text-xs text-muted-foreground">Event slug ของงานนี้:</p>
            <pre className="overflow-x-auto rounded-lg bg-background p-3 font-mono text-xs">
{`npm run start -- --event ${event.slug} --folder "C:\\Photos"`}
            </pre>
          </div>
        </details>
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
