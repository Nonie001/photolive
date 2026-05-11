"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string | null; info?: string | null };

export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    return { error: "กรุณากรอกอีเมลและรหัสผ่าน" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error:
        error.message === "Invalid login credentials"
          ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
          : error.message,
    };
  }
  redirect(next);
}

export async function signUpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    return { error: "กรุณากรอกอีเมลและรหัสผ่าน" };
  }
  if (password.length < 6) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return { error: error.message };
  }
  // Supabase returns identities: [] when the email is already registered
  // (instead of an error, to prevent email enumeration).
  if (data.user && data.user.identities?.length === 0) {
    return { error: "อีเมลนี้มีบัญชีอยู่แล้ว — กรุณาเข้าสู่ระบบหรือใช้ลืมรหัสผ่าน" };
  }
  if (data.session) {
    redirect(next);
  }
  redirect(`/login/verify?email=${encodeURIComponent(email)}`);
}

async function siteOrigin() {
  const h = await headers();
  // Prefer env override (works for local + production), else derive from host header.
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function resetPasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "กรุณากรอกอีเมล" };
  const supabase = await createClient();
  const origin = await siteOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/account/reset`,
  });
  if (error) return { error: error.message };
  return {
    error: null,
    info: "ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว — เช็คกล่องเมล",
  };
}
