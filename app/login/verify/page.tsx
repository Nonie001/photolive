import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail } from "lucide-react";

export const metadata = { title: "ยืนยันอีเมล — PhotoLive" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปเข้าสู่ระบบ
        </Link>

        <div className="flex justify-center">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <Image src="/icon.png" width={48} height={48} alt="PhotoLive" className="h-12 w-12 rounded-2xl" />
            <span className="text-sm font-semibold">PhotoLive</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-muted/30 p-8 text-center space-y-5">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-fuchsia-500/10">
              <Mail className="h-8 w-8 text-fuchsia-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">ยืนยันอีเมลของคุณ</h1>
            <p className="text-sm text-muted-foreground">
              ส่งลิงก์ยืนยันไปที่
            </p>
            {email && (
              <p className="font-medium text-foreground break-all">{email}</p>
            )}
            <p className="text-sm text-muted-foreground">
              คลิกลิงก์ในอีเมลเพื่อเปิดใช้งานบัญชี
            </p>
          </div>

          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
            ไม่เจออีเมล? ลองเช็ค junk / spam
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4 hover:no-underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
