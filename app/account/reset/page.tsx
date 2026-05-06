import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ResetForm } from "./ResetForm";

export const metadata = { title: "ตั้งรหัสผ่านใหม่ — PhotoLive" };

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปหน้าหลัก
        </Link>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">ตั้งรหัสผ่านใหม่</h1>
          <p className="text-sm text-muted-foreground">
            กรอกรหัสผ่านใหม่ที่จะใช้เข้าระบบครั้งต่อไป
          </p>
        </div>
        <ResetForm />
      </div>
    </div>
  );
}
