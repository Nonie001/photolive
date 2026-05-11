import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatBytes } from "@/lib/utils";
import { getPlan } from "@/lib/plans";
import { PricingCards } from "./PricingCards";

export const metadata = { title: "แพ็กเกจ — PhotoLive" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; pending?: string }>;
}) {
  const { success, error: payError, pending } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let sub: { plan_id: string; expires_at: string | null; bytes_used: number } | null = null;
  try {
    const { data } = await supabase
      .from("subscriptions")
      .select("plan_id, expires_at, bytes_used")
      .eq("user_id", user!.id)
      .maybeSingle();
    sub = data;
  } catch {
    // table not yet created
  }

  const planId = sub?.plan_id ?? "free";
  const plan = getPlan(planId);
  const used = sub?.bytes_used ?? 0;
  const total = plan?.storageBytes ?? 1;
  const pct = Math.min(100, Math.round((used / total) * 100));
  const expired =
    sub?.expires_at != null && new Date(sub.expires_at) < new Date();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับ
        </Link>
        <p className="mt-4 bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 bg-clip-text text-xs font-semibold uppercase tracking-wider text-transparent">แพ็กเกจ</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">แพ็กเกจของฉัน</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          จัดการแพ็กเกจและพื้นที่จัดเก็บ
        </p>
      </div>

      {success === "1" && (
        <div className="flex items-start gap-2 rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>ชำระเงินสำเร็จ — เปิดใช้งานแพ็กเกจใหม่เรียบร้อยแล้ว</span>
        </div>
      )}
      {payError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>การชำระเงินไม่สำเร็จ ({payError}) — ลองใหม่อีกครั้งหรือติดต่อฝ่ายสนับสนุน</span>
        </div>
      )}
      {pending === "1" && (
        <div className="flex items-start gap-2 rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-700/50 dark:bg-yellow-950/30 dark:text-yellow-300">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">รอยืนยันการชำระเงิน</p>
            <p className="mt-0.5 text-yellow-700 dark:text-yellow-400">ระบบกำลังรอการยืนยันจากธนาคาร — หากชำระผ่าน PromptPay แล้ว แพ็กเกจจะเปิดใช้งานอัตโนมัติภายในไม่กี่นาที</p>
            <p className="mt-1.5">
              <a href="/dashboard/billing" className="underline underline-offset-2 hover:opacity-80">รีเฟรชหน้านี้</a>
              {" · "}
              <a href="/dashboard/billing" className="underline underline-offset-2 hover:opacity-80">ลองชำระใหม่</a>
            </p>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-border bg-muted/20 p-6">
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
        <h2 className="mb-6 text-lg font-extrabold">เลือกแพ็กเกจ</h2>
        <PricingCards currentPlanId={planId} />
      </section>
    </div>
  );
}
