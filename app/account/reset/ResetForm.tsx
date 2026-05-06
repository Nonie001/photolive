"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { updatePasswordAction, type AuthState } from "./actions";

const initial: AuthState = { error: null, info: null };

export function ResetForm() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initial);
  const [showPw, setShowPw] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">รหัสผ่านใหม่</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="อย่างน้อย 6 ตัวอักษร"
            disabled={pending}
            className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-11 text-base outline-none focus:border-foreground"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            tabIndex={-1}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
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
        {pending ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
      </button>
    </form>
  );
}
