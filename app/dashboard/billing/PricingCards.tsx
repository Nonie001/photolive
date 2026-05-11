"use client";

import { useActionState, useState } from "react";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { PLANS, YEARLY_PLANS, getPlansByPeriod, type PlanDef, type BillingPeriod } from "@/lib/plans";
import { formatBytes } from "@/lib/utils";
import { subscribeToPlan, type SubscribeState } from "./actions";
import { useToast } from "@/components/Toast";

const initialState: SubscribeState = { error: null };

export function PricingCards({ currentPlanId }: { currentPlanId: string }) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const plans = getPlansByPeriod(period);

  return (
    <div>
      {/* Billing period toggle */}
      <div className="mb-6 flex flex-col items-center gap-2">
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <PlanCard
            key={`${period}-${plan.id}`}
            plan={plan}
            isCurrent={plan.id === currentPlanId}
          />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ plan, isCurrent }: { plan: PlanDef; isCurrent: boolean }) {
  const [state, formAction, pending] = useActionState(
    subscribeToPlan,
    initialState,
  );
  const [confirming, setConfirming] = useState(false);
  const toast = useToast();

  // Surface result via toast
  if (state.ok) {
    queueMicrotask(() => toast.show("เปลี่ยนแพ็กเกจสำเร็จ", "success"));
    state.ok = false; // prevent loop
  }
  if (state.error) {
    queueMicrotask(() => toast.show(state.error!, "error"));
    state.error = null;
  }

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 ${
        plan.highlight
          ? "border-foreground/40 bg-muted/40 shadow-lg"
          : "border-border bg-muted/20"
      }`}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
          <Sparkles className="h-3 w-3" />
          ยอดนิยม
        </span>
      )}

      {plan.savingsPct && (
        <span className="absolute -top-3 right-4 rounded-full border border-emerald-500/30 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
          ประหยัด {plan.savingsPct}%
        </span>
      )}

      <h3 className="text-lg font-bold">{plan.name}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>

      <div className="mt-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">
            {plan.priceThb === 0 ? "ฟรี" : `฿${plan.priceThb.toLocaleString()}`}
          </span>
          {plan.durationDays === 365 && plan.priceThb > 0 && (
            <span className="text-sm text-muted-foreground">/ ปี</span>
          )}
          {plan.durationDays && plan.durationDays !== 365 && plan.priceThb > 0 && (
            <span className="text-sm text-muted-foreground">
              / {plan.durationDays} วัน
            </span>
          )}
        </div>
        {plan.monthlyEquivThb && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            เทียบเท่า ฿{plan.monthlyEquivThb}/เดือน
          </p>
        )}
      </div>

      <p className="mt-2 text-sm font-medium">
        {formatBytes(plan.storageBytes)} storage
      </p>

      <ul className="mt-5 flex-1 space-y-2 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {isCurrent ? (
          <div className="inline-flex h-10 w-full items-center justify-center rounded-full border border-border text-sm font-medium text-muted-foreground">
            แพ็กเกจปัจจุบัน
          </div>
        ) : confirming ? (
          <form action={formAction} className="flex gap-2">
            <input type="hidden" name="plan_id" value={plan.id} />
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "ยืนยัน"
              )}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="inline-flex h-10 items-center justify-center rounded-full border border-border px-4 text-sm"
            >
              ยกเลิก
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={`inline-flex h-10 w-full items-center justify-center rounded-full px-4 text-sm font-semibold ${
              plan.highlight
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background hover:bg-muted"
            }`}
          >
            {plan.priceThb === 0 ? "ใช้แพ็กเกจนี้" : "สมัครแพ็กเกจนี้"}
          </button>
        )}
      </div>
    </div>
  );
}
