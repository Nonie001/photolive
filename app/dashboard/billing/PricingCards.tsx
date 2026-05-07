"use client";

import { useActionState, useState } from "react";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { PLANS, type PlanDef } from "@/lib/plans";
import { formatBytes } from "@/lib/utils";
import { subscribeToPlan, type SubscribeState } from "./actions";
import { useToast } from "@/components/Toast";

const initialState: SubscribeState = { error: null };

export function PricingCards({ currentPlanId }: { currentPlanId: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {PLANS.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          isCurrent={plan.id === currentPlanId}
        />
      ))}
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

      <h3 className="text-lg font-bold">{plan.name}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-bold">
          {plan.priceThb === 0 ? "ฟรี" : `฿${plan.priceThb}`}
        </span>
        {plan.durationDays && plan.priceThb > 0 && (
          <span className="text-sm text-muted-foreground">
            / {plan.durationDays} วัน
          </span>
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
