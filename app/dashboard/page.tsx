import Link from "next/link";
import { Plus, Calendar, ImageIcon, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatBytes } from "@/lib/utils";
import { getPlan } from "@/lib/plans";

export const metadata = { title: "หน้าหลัก — PhotoLive" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Single round-trip: events + photo count via embedded relationship.
  // Filter by owner_id explicitly — RLS allows public SELECT on events
  // (for the gallery), so without this we'd see other users' events too.
  // NOTE: events<->photos has two FKs (photos.event_id and events.cover_photo_id).
  // Hint with !event_id to tell PostgREST which relationship to use, otherwise
  // it returns an "ambiguous relationship" error and data comes back null.
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, name, slug, event_date, created_at, photos!event_id(count)")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false });

  if (eventsError) {
    console.error("[dashboard] events query error:", eventsError.message, eventsError.details);
  }

  // subscriptions may not exist yet if migration hasn't run — fall back gracefully
  let sub: { plan_id: string; expires_at: string | null; bytes_used: number } | null = null;
  try {
    const { data } = await supabase
      .from("subscriptions")
      .select("plan_id, expires_at, bytes_used")
      .eq("user_id", user!.id)
      .maybeSingle();
    sub = data;
  } catch {
    // table not yet created — ignore
  }

  const planId = sub?.plan_id ?? "free";
  const plan = getPlan(planId);
  const used = sub?.bytes_used ?? 0;
  const total = plan?.storageBytes ?? 1;
  const pct = Math.min(100, Math.round((used / total) * 100));
  const expired =
    sub?.expires_at != null && new Date(sub.expires_at) < new Date();

  type EventRow = {
    id: string;
    name: string;
    slug: string;
    event_date: string | null;
    created_at: string;
    photos: { count: number }[];
  };
  const list = (events as EventRow[] | null) ?? [];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 bg-clip-text text-xs font-semibold uppercase tracking-wider text-transparent">Dashboard</p>
          <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight">อีเวนต์ของฉัน</h1>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 px-5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/20 transition-transform hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          สร้างอีเวนต์
        </Link>
      </div>

      {/* Storage / Plan card */}
      <Link
        href="/dashboard/billing"
        className="group block rounded-2xl border border-border bg-muted/20 p-5 transition-all hover:border-fuchsia-500/30 hover:bg-muted/40"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 bg-clip-text text-xs font-semibold uppercase tracking-wider text-transparent">แพ็กเกจ</p>
            <p className="mt-0.5 text-lg font-extrabold">
              {plan?.name ?? planId}
              {expired && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-950/40 px-2 py-0.5 text-xs font-medium text-red-300">
                  <AlertTriangle className="h-3 w-3" />
                  หมดอายุ
                </span>
              )}
            </p>
          </div>
          <p className="text-sm font-semibold">
            {formatBytes(used)}
            <span className="font-normal text-muted-foreground"> / {formatBytes(total)}</span>
          </p>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className={`h-full rounded-full transition-all ${
              pct >= 90
                ? "bg-gradient-to-r from-red-500 to-rose-400"
                : pct >= 70
                  ? "bg-gradient-to-r from-amber-500 to-orange-400"
                  : "bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-right text-xs text-muted-foreground group-hover:text-fuchsia-400 transition-colors">ดูแพ็กเกจ →</p>
      </Link>

      {!events || events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-14 text-center">
          <p className="text-muted-foreground">ยังไม่มีอีเวนต์</p>
          <Link
            href="/dashboard/new"
            className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 px-5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/20"
          >
            <Plus className="h-4 w-4" />
            สร้างอีเวนต์แรก
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {list.map((event) => (
            <li key={event.id}>
              <Link
                href={`/dashboard/${event.id}`}
                className="group block rounded-2xl border border-border bg-muted/20 p-5 transition-all hover:border-fuchsia-500/30 hover:bg-muted/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-fuchsia-500/5"
              >
                <h2 className="font-extrabold tracking-tight">{event.name}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {event.event_date && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {event.event_date}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                    <ImageIcon className="h-3 w-3" />
                    {event.photos?.[0]?.count ?? 0} รูป
                  </span>
                </div>
                <p className="mt-3 bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 bg-clip-text font-mono text-xs text-transparent">
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
