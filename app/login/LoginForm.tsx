"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import {
  signInAction,
  signUpAction,
  signInWithGoogleAction,
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
  const action = mode === "signup" ? signUpAction : signInAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="space-y-5">
      {/* Google */}
      <form action={signInWithGoogleAction}>
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-border bg-background/50 text-sm font-medium hover:bg-muted transition-colors"
        >
          <GoogleIcon />
          เข้าสู่ระบบด้วย Google
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>หรือ</span>
        <div className="h-px flex-1 bg-border" />
      </div>

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

      <form action={formAction} className="space-y-4">
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
        {oauthError && !state.error && (
          <p className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            ล็อกอินด้วย Google ไม่สำเร็จ — ลองใหม่อีกครั้ง
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
