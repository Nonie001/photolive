"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { PLANS, YEARLY_PLANS, type PlanDef, type BillingPeriod } from "@/lib/plans";
import { formatBytes } from "@/lib/utils";

export function HomePricingSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const plans = period === "yearly" ? YEARLY_PLANS : PLANS;

  return (
    <section id="pricing" className="border-b border-border bg-muted/30">
      <div className="mx-auto w-full max-w-6xl px-5 py-20">
        <div className="text-center">
          <p className="bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 bg-clip-text text-sm font-semibold uppercase tracking-wider text-transparent">
            ราคา
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            เลือกแพ็กเกจที่เหมาะกับคุณ
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            เริ่มฟรี 150 MB ไม่ต้องใส่บัตรเครดิต — อัปเกรดเมื่อพร้อม
          </p>

          {/* Billing period toggle */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="inline-flex items-center rounded-full border border-border bg-muted/50 p-1">
              <button
                onClick={() => setPeriod("monthly")}
                className={`rounded-full px-5 py-1.5 text-sm font-medium transition-all ${
                  period === "monthly"
                    ? "bg-background text-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                รายเดือน
              </button>
              <button
                onClick={() => setPeriod("yearly")}
                className={`rounded-full px-5 py-1.5 text-sm font-medium transition-all ${
                  period === "yearly"
                    ? "bg-background text-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                รายปี
              </button>
            </div>
            <span className="rounded-full bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 px-3 py-0.5 text-[11px] font-bold text-white">
              สมัครรายปี ประหยัดสูงสุด 17%
            </span>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <PlanCard key={`${period}-${plan.id}`} plan={plan} isLoggedIn={isLoggedIn} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanCard({ plan, isLoggedIn }: { plan: PlanDef; isLoggedIn: boolean }) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-background p-6 ${
        plan.highlight
          ? "border-fuchsia-500/40 shadow-xl shadow-fuchsia-500/5"
          : "border-border"
      }`}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 px-3 py-1 text-xs font-semibold text-white">
          <Sparkles className="h-3 w-3" />
          ยอดนิยม
        </span>
      )}

      {plan.savingsPct && (
        <span className="absolute -top-3 right-4 rounded-full border border-emerald-500/30 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
          ประหยัด {plan.savingsPct}%
        </span>
      )}

      <h3 className="text-lg font-extrabold">{plan.name}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>

      <div className="mt-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold">
            {plan.priceThb === 0 ? "ฟรี" : `฿${plan.priceThb.toLocaleString()}`}
          </span>
          {plan.durationDays === 365 && plan.priceThb > 0 && (
            <span className="text-sm text-muted-foreground">/ ปี</span>
          )}
          {plan.durationDays && plan.durationDays !== 365 && plan.priceThb > 0 && (
            <span className="text-sm text-muted-foreground">/ {plan.durationDays} วัน</span>
          )}
        </div>
        {plan.monthlyEquivThb && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            เทียบเท่า ฿{plan.monthlyEquivThb}/เดือน
          </p>
        )}
      </div>

      <p className="mt-2 text-sm font-medium">{formatBytes(plan.storageBytes)} storage</p>

      <ul className="mt-5 flex-1 space-y-2 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-500" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href={isLoggedIn ? "/dashboard/billing" : "/login"}
        className={`mt-6 inline-flex h-10 w-full items-center justify-center rounded-full px-4 text-sm font-semibold transition-transform hover:scale-[1.02] ${
          plan.highlight
            ? "bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 text-white shadow-md shadow-fuchsia-500/20"
            : "border border-border hover:bg-muted"
        }`}
      >
        {plan.priceThb === 0 ? "เริ่มใช้ฟรี" : "เลือกแพ็กเกจ"}
      </Link>
    </div>
  );
}
