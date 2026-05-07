import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatBytes } from "@/lib/utils";
import { getPlan } from "@/lib/plans";
import { PricingCards } from "./PricingCards";

export const metadata = { title: "แพ็กเกจ — PhotoLive" };

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_id, expires_at, bytes_used")
    .eq("user_id", user!.id)
    .maybeSingle();

  const planId = sub?.plan_id ?? "free";
  const plan = getPlan(planId);
  const used = sub?.bytes_used ?? 0;
  const total = plan?.storageBytes ?? 1;
  const pct = Math.min(100, Math.round((used / total) * 100));
  const expired =
    sub?.expires_at != null && new Date(sub.expires_at) < new Date();

  return (
    <div className="space-y-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับ
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">แพ็กเกจของฉัน</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          จัดการแพ็กเกจและพื้นที่จัดเก็บ
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-muted/30 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              แพ็กเกจปัจจุบัน
            </p>
            <h2 className="mt-1 text-xl font-bold">{plan?.name ?? planId}</h2>
          </div>
          {sub?.expires_at && (
            <p className="text-sm text-muted-foreground">
              {expired ? "หมดอายุเมื่อ " : "หมดอายุ "}
              <span
                className={
                  expired ? "font-semibold text-red-600" : "font-medium"
                }
              >
                {new Date(sub.expires_at).toLocaleDateString("th-TH")}
              </span>
            </p>
          )}
        </div>

        {expired && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              แพ็กเกจหมดอายุแล้ว — ต่ออายุเพื่ออัปโหลดรูปต่อ
              (รูปเดิมยังเข้าดูได้)
            </span>
          </div>
        )}

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">พื้นที่ที่ใช้</span>
            <span className="font-medium">
              {formatBytes(used)} / {formatBytes(total)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-background">
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
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">เลือกแพ็กเกจ</h2>
        <PricingCards currentPlanId={planId} />
        <p className="mt-4 text-xs text-muted-foreground">
          * ระบบชำระเงินจริงยังไม่เปิดใช้งาน — กดสมัครเพื่อเปิดใช้งานทันที
          (สำหรับการทดสอบ)
        </p>
      </section>
    </div>
  );
}
