import Link from "next/link";
import { Plus, Calendar, ImageIcon, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatBytes } from "@/lib/utils";
import { getPlan } from "@/lib/plans";

export const metadata = { title: "หน้าหลัก — PhotoLive" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Single round-trip: events + photo count via embedded relationship.
  const [{ data: events }, { data: sub }] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, slug, event_date, created_at, photos(count)")
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("plan_id, expires_at, bytes_used")
      .eq("user_id", user!.id)
      .maybeSingle(),
  ]);

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

      <Link
        href="/dashboard/billing"
        className="block rounded-2xl border border-border bg-muted/30 p-5 transition-colors hover:bg-muted/60"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              แพ็กเกจ
            </p>
            <p className="mt-0.5 text-base font-semibold">
              {plan?.name ?? planId}
              {expired && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  <AlertTriangle className="h-3 w-3" />
                  หมดอายุ
                </span>
              )}
            </p>
          </div>
          <p className="text-sm font-medium">
            {formatBytes(used)}{" "}
            <span className="text-muted-foreground">
              / {formatBytes(total)}
            </span>
          </p>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-background">
          <div
            className={`h-full rounded-full ${
              pct >= 90
                ? "bg-red-500"
                : pct >= 70
                  ? "bg-amber-500"
                  : "bg-green-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </Link>

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
          {list.map((event) => (
            <li key={event.id}>
              <Link
                href={`/dashboard/${event.id}`}
                className="block rounded-2xl border border-border bg-muted/30 p-5 transition-all hover:bg-muted/60 hover:border-foreground/20 hover:-translate-y-0.5"
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
                    {event.photos?.[0]?.count ?? 0} รูป
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
