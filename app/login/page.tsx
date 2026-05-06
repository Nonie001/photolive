import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "เข้าสู่ระบบ — PhotoLive" };

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">เข้าสู่ระบบ</h1>
          <p className="text-sm text-muted-foreground">
            เข้าสู่ระบบเพื่อจัดการอีเวนต์และอัปโหลดรูปภาพ
          </p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
