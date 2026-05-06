import Link from "next/link";
import { Plus, Calendar, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "หน้าหลัก — PhotoLive" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, name, slug, event_date, created_at")
    .order("created_at", { ascending: false });

  // Photo counts per event (single round-trip per event is fine for MVP).
  const counts: Record<string, number> = {};
  if (events) {
    await Promise.all(
      events.map(async (e) => {
        const { count } = await supabase
          .from("photos")
          .select("id", { count: "exact", head: true })
          .eq("event_id", e.id);
        counts[e.id] = count ?? 0;
      }),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">อีเวนต์ของฉัน</h1>
        <Link
          href="/dashboard/new"
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          สร้างอีเวนต์
        </Link>
      </div>

      {!events || events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
          <p className="text-muted-foreground">ยังไม่มีอีเวนต์</p>
          <Link
            href="/dashboard/new"
            className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            สร้างอีเวนต์แรก
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/dashboard/${event.id}`}
                className="block rounded-2xl border border-border bg-muted/30 p-5 transition-colors hover:bg-muted/60"
              >
                <h2 className="font-semibold">{event.name}</h2>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  {event.event_date && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {event.event_date}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5" />
                    {counts[event.id] ?? 0} รูป
                  </span>
                </div>
                <p className="mt-3 font-mono text-xs text-muted-foreground">
                  /e/{event.slug}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
