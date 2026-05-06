import Link from "next/link";
import { Camera, Zap, QrCode, Download } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Camera className="h-5 w-5" />
            <span>PhotoLive</span>
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-5 py-12 sm:py-20">
        <h1 className="max-w-2xl text-center text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          รูปงานอัปเดต <span className="text-zinc-500">สด ๆ</span> ทันที
          แขกสแกน QR ดูได้เลย
        </h1>
        <p className="mt-6 max-w-xl text-center text-base leading-7 text-muted-foreground sm:text-lg">
          แพลตฟอร์มแกลเลอรีรูปสำหรับช่างภาพงานอีเวนต์ งานแต่ง งานวิ่ง
          งานรับปริญญา ช่างภาพถ่าย รูปขึ้นเว็บอัตโนมัติ
          แขกในงานเปิดดูได้ทันทีจากมือถือ
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground"
          >
            เริ่มใช้งาน — สร้างอีเวนต์แรก
          </Link>
        </div>

        <section className="mt-20 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Feature
            icon={<Camera className="h-5 w-5" />}
            title="ถ่ายปุ๊บขึ้นปั๊บ"
            body="รูปจากกล้องเข้าเว็บอัตโนมัติผ่าน watch folder ไม่ต้องอัปโหลดเอง"
          />
          <Feature
            icon={<Zap className="h-5 w-5" />}
            title="Realtime Gallery"
            body="แขกในงานเห็นรูปใหม่ทันทีโดยไม่ต้องรีเฟรชหน้า"
          />
          <Feature
            icon={<QrCode className="h-5 w-5" />}
            title="QR Code เข้าง่าย"
            body="พิมพ์ QR ติดในงาน แขกสแกนแล้วเปิดอัลบั้มได้ทันที"
          />
          <Feature
            icon={<Download className="h-5 w-5" />}
            title="ดาวน์โหลด & แชร์"
            body="ดาวน์โหลดรูปทีละรูปหรือทั้งอัลบั้ม แชร์ผ่าน social ได้"
          />
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-5 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} PhotoLive
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}
