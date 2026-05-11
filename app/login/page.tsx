import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "เข้าสู่ระบบ — PhotoLive" };

export default function LoginPage() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-5 py-12">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-orange-500/10 blur-3xl" />

      {/* Back button */}
      <div className="relative z-10 w-full max-w-sm mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับหน้าหลัก
        </Link>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm space-y-8 rounded-2xl border border-border bg-muted/30 p-8 backdrop-blur">
        {/* Logo */}
        <div className="space-y-3 text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <Image src="/icon.png" width={56} height={56} alt="PhotoLive" className="h-14 w-14 rounded-2xl" />
            <span className="bg-gradient-to-r from-fuchsia-400 via-rose-400 to-orange-400 bg-clip-text text-sm font-bold text-transparent">
              PhotoLive
            </span>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight">เข้าสู่ระบบ</h1>
          <p className="text-sm text-muted-foreground">
            จัดการอีเวนต์ อัปโหลดรูป และแชร์แกลเลอรีได้ทันที
          </p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
