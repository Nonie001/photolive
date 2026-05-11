"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import {
  signInAction,
  signUpAction,
  type AuthState,
} from "./actions";

type Mode = "signin" | "signup";

const initialState: AuthState = { error: null, info: null };

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const oauthError = searchParams.get("error");

  const [mode, setMode] = useState<Mode>("signin");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const action = mode === "signup" ? signUpAction : signInAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (mode === "signup") {
      const form = e.currentTarget;
      const pw = (form.elements.namedItem("password") as HTMLInputElement).value;
      const cpw = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;
      if (pw !== cpw) {
        e.preventDefault();
        setConfirmError("รหัสผ่านไม่ตรงกัน — กรุณากรอกใหม่");
        return;
      }
    }
    setConfirmError(null);
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1 rounded-full border border-border p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`h-9 rounded-full font-medium transition-all ${
            mode === "signin"
              ? "bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 text-white shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          เข้าสู่ระบบ
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`h-9 rounded-full font-medium transition-all ${
            mode === "signup"
              ? "bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 text-white shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          สมัครสมาชิก
        </button>
      </div>

      <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            อีเมล
          </label>
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
              className="h-12 w-full rounded-xl border border-border bg-background/50 pl-10 pr-4 text-base outline-none focus:border-fuchsia-500/50 transition-colors"
              disabled={pending}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              รหัสผ่าน
            </label>
            {mode === "signin" && (
              <Link
                href="/login/forgot"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ลืมรหัสผ่าน?
              </Link>
            )}
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder={mode === "signup" ? "อย่างน้อย 6 ตัวอักษร" : "••••••••"}
              className="h-12 w-full rounded-xl border border-border bg-background/50 pl-10 pr-11 text-base outline-none focus:border-fuchsia-500/50 transition-colors"
              disabled={pending}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              tabIndex={-1}
              aria-label={showPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {mode === "signup" && (
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              ยืนยันรหัสผ่าน
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPw ? "text" : "password"}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                className="h-12 w-full rounded-xl border border-border bg-background/50 pl-10 pr-11 text-base outline-none focus:border-fuchsia-500/50 transition-colors"
                disabled={pending}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw((v) => !v)}
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                tabIndex={-1}
                aria-label={showConfirmPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        {(confirmError || state.error) && (
          <p className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {confirmError ?? state.error}
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
          className="h-12 w-full rounded-full bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/20 transition-transform hover:scale-[1.01] disabled:opacity-50"
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


