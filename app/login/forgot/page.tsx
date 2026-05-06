import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ForgotForm } from "./ForgotForm";

export const metadata = { title: "ลืมรหัสผ่าน — PhotoLive" };

export default function ForgotPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปเข้าสู่ระบบ
        </Link>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">ลืมรหัสผ่าน</h1>
          <p className="text-sm text-muted-foreground">
            กรอกอีเมลที่ลงทะเบียนไว้ ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านให้
          </p>
        </div>
        <Suspense>
          <ForgotForm />
        </Suspense>
      </div>
    </div>
  );
}
