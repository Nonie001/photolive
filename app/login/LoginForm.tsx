"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signInAction, signUpAction, type AuthState } from "./actions";

type Mode = "signin" | "signup";

const initialState: AuthState = { error: null };

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [mode, setMode] = useState<Mode>("signin");
  const action = mode === "signup" ? signUpAction : signInAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-1 rounded-full border border-border p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`h-9 rounded-full transition ${
            mode === "signin"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground"
          }`}
        >
          เข้าสู่ระบบ
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`h-9 rounded-full transition ${
            mode === "signup"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground"
          }`}
        >
          สมัครสมาชิก
        </button>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            อีเมล
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base outline-none focus:border-foreground"
            disabled={pending}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            รหัสผ่าน
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder={mode === "signup" ? "อย่างน้อย 6 ตัวอักษร" : "••••••••"}
            className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base outline-none focus:border-foreground"
            disabled={pending}
          />
        </div>

        {state.error && (
          <p className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {pending
            ? "กำลังดำเนินการ..."
            : mode === "signup"
              ? "สมัครสมาชิก"
              : "เข้าสู่ระบบ"}
        </button>
      </form>
    </div>
  );
}
