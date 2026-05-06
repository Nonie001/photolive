"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { resetPasswordAction, type AuthState } from "../actions";

const initial: AuthState = { error: null, info: null };

export function ForgotForm() {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initial);
  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">อีเมล</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            disabled={pending}
            className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-base outline-none focus:border-foreground"
          />
        </div>
      </div>

      {state.error && (
        <p className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state.info && (
        <p className="rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
          {state.info}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {pending ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ต"}
      </button>
    </form>
  );
}
