import Link from "next/link";
import {
  Camera,
  Zap,
  QrCode,
  Download,
  Sparkles,
  ScanFace,
  ArrowRight,
  Aperture,
  Wifi,
  Heart,
  Trophy,
  GraduationCap,
  PartyPopper,
  Briefcase,
  CheckCircle2,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/plans";
import { formatBytes } from "@/lib/utils";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Sticky glass header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
              <Aperture className="h-4 w-4" />
            </div>
            <span>PhotoLive</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">ฟีเจอร์</a>
            <a href="#how" className="hover:text-foreground">วิธีใช้</a>
            <a href="#pricing" className="hover:text-foreground">ราคา</a>
            <a href="#usecases" className="hover:text-foreground">เหมาะกับงาน</a>
          </nav>
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              ไปที่หน้าหลัก <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Decorative gradient orbs */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-40 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:py-24 lg:grid-cols-12">
          <div className="flex flex-col justify-center lg:col-span-7">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              Realtime · ถ่ายปุ๊บขึ้นปั๊บ
            </div>

            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              รูปงานของคุณ <br />
              <span className="bg-gradient-to-r from-fuchsia-500 via-rose-500 to-orange-500 bg-clip-text text-transparent">
                ขึ้นเว็บทันที
              </span>{" "}
              ที่ลั่นชัตเตอร์
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              แพลตฟอร์มแกลเลอรีสำหรับช่างภาพอีเวนต์ — ลูกค้าและแขกในงานเห็นรูปสด ๆ
              ผ่าน QR Code พร้อมระบบ <span className="font-semibold text-foreground">AI ค้นหารูปด้วยใบหน้า</span>
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={user ? "/dashboard" : "/login"}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02]"
              >
                เริ่มใช้งานฟรี <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how"
                className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background px-7 text-sm font-medium hover:bg-muted"
              >
                ดูวิธีใช้งาน
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                เริ่มฟรี 1 GB
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                ไม่ต้องลงแอป
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                แชร์ได้ทุกแพลตฟอร์ม
              </span>
            </div>
          </div>

          {/* Photo grid mockup */}
          <div className="relative lg:col-span-5">
            <PhotoGridMockup />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-20">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">ฟีเจอร์</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              ทุกอย่างที่ช่างภาพต้องการ
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={<Camera className="h-5 w-5" />}
              title="Watch folder อัตโนมัติ"
              body="ตั้ง CLI ครั้งเดียว — กล้อง tether รูปลงโฟลเดอร์ ระบบอัปขึ้นเว็บอัตโนมัติ ไม่ต้องแตะอะไรเพิ่ม"
              gradient="from-fuchsia-500/20 to-pink-500/20"
              iconBg="bg-fuchsia-500"
            />
            <Feature
              icon={<Zap className="h-5 w-5" />}
              title="Realtime ทันที"
              body="แขกเห็นรูปใหม่บน iPhone/Android โดยไม่ต้องรีเฟรช ใช้ Supabase Realtime"
              gradient="from-amber-500/20 to-orange-500/20"
              iconBg="bg-amber-500"
            />
            <Feature
              icon={<ScanFace className="h-5 w-5" />}
              title="AI ค้นหาด้วยใบหน้า"
              body="แขกถ่ายเซลฟี่ครั้งเดียว ระบบหารูปทั้งหมดที่มีหน้าตัวเองให้อัตโนมัติ ทำงานในเบราว์เซอร์"
              gradient="from-sky-500/20 to-indigo-500/20"
              iconBg="bg-sky-500"
              badge="AI"
            />
            <Feature
              icon={<QrCode className="h-5 w-5" />}
              title="QR Code พร้อมพิมพ์"
              body="ทุกอีเวนต์มี QR เฉพาะ พิมพ์แปะหน้างาน แขกสแกนแล้วเข้าได้ทันที ไม่ต้อง login"
              gradient="from-emerald-500/20 to-teal-500/20"
              iconBg="bg-emerald-500"
            />
            <Feature
              icon={<Download className="h-5 w-5" />}
              title="ดาวน์โหลดทั้งอัลบั้ม"
              body="แขกกดปุ่มเดียว ดาวน์โหลดรูปทั้งงานเป็น .zip ทันที พร้อม share ผ่าน social"
              gradient="from-violet-500/20 to-purple-500/20"
              iconBg="bg-violet-500"
            />
            <Feature
              icon={<Wifi className="h-5 w-5" />}
              title="ใช้งานออฟไลน์ได้บางส่วน"
              body="กล้องอินเทอร์เน็ตสะดุด? ระบบ retry อัตโนมัติ ไม่มีรูปหาย"
              gradient="from-rose-500/20 to-red-500/20"
              iconBg="bg-rose-500"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-b border-border bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-5 py-20">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">วิธีใช้งาน</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">เริ่มได้ในไม่กี่นาที</h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Step
              n="1"
              title="สร้างอีเวนต์"
              body="กรอกชื่องาน วันที่ ระบบสร้าง slug + QR ให้อัตโนมัติ"
            />
            <Step
              n="2"
              title="เชื่อมกล้องหรืออัปจากมือถือ"
              body="ตั้ง CLI watch folder ที่เครื่องช่างภาพ หรืออัปจากเว็บโดยตรง"
            />
            <Step
              n="3"
              title="แขกสแกน QR ดูรูป"
              body="รูปขึ้นทันทีหลังลั่นชัตเตอร์ — ค้นหาด้วยใบหน้า / ดาวน์โหลด / แชร์"
            />
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="usecases" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-20">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">เหมาะกับงาน</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              ทุกงานที่ต้องการความว้าว
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            <UseCase icon={<Heart className="h-5 w-5" />} label="งานแต่ง" />
            <UseCase icon={<GraduationCap className="h-5 w-5" />} label="รับปริญญา" />
            <UseCase icon={<Trophy className="h-5 w-5" />} label="งานวิ่ง / กีฬา" />
            <UseCase icon={<PartyPopper className="h-5 w-5" />} label="ปาร์ตี้ / วันเกิด" />
            <UseCase icon={<Briefcase className="h-5 w-5" />} label="คอร์ปอเรท" />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-border bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-5 py-20">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              ราคา
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              เลือกแพ็กเกจที่เหมาะกับคุณ
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              เริ่มฟรี 1 GB ไม่ต้องใส่บัตรเครดิต — อัปเกรดเมื่อพร้อม
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border bg-background p-6 ${
                  plan.highlight
                    ? "border-foreground/40 shadow-xl"
                    : "border-border"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
                    <Sparkles className="h-3 w-3" />
                    ยอดนิยม
                  </span>
                )}
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {plan.tagline}
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    {plan.priceThb === 0 ? "ฟรี" : `฿${plan.priceThb}`}
                  </span>
                  {plan.durationDays && plan.priceThb > 0 && (
                    <span className="text-sm text-muted-foreground">
                      / {plan.durationDays} วัน
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm font-medium">
                  {formatBytes(plan.storageBytes)} storage
                </p>
                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={user ? "/dashboard/billing" : "/login"}
                  className={`mt-6 inline-flex h-10 w-full items-center justify-center rounded-full px-4 text-sm font-semibold ${
                    plan.highlight
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:bg-muted"
                  }`}
                >
                  {plan.priceThb === 0 ? "เริ่มใช้ฟรี" : "เลือกแพ็กเกจ"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-20">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-foreground to-foreground/90 p-10 text-center text-background sm:p-16">
            <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-fuchsia-500/30 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 -bottom-20 h-60 w-60 rounded-full bg-sky-500/30 blur-3xl" />
            <Sparkles className="mx-auto h-8 w-8 opacity-80" />
            <h2 className="relative mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              พร้อมยกระดับงานของคุณแล้วหรือยัง?
            </h2>
            <p className="relative mt-3 text-sm opacity-80 sm:text-base">
              สร้างอีเวนต์แรกของคุณวันนี้ — ใช้งานฟรี ไม่ต้องใส่บัตรเครดิต
            </p>
            <Link
              href={user ? "/dashboard" : "/login"}
              className="relative mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-background px-8 text-sm font-semibold text-foreground hover:scale-[1.02]"
            >
              {user ? "ไปที่หน้าหลัก" : "เริ่มฟรีเลย"} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Aperture className="h-4 w-4" />
            <span>PhotoLive</span>
          </div>
          <p>© {new Date().getFullYear()} PhotoLive · Made for photographers</p>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
  gradient,
  iconBg,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  gradient: string;
  iconBg: string;
  badge?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-muted/20 p-6 transition-all hover:-translate-y-1 hover:border-foreground/20 hover:shadow-xl">
      <div className={`absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100 ${gradient}`} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-white ${iconBg}`}>
            {icon}
          </div>
          {badge && (
            <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>
        <h3 className="mt-4 font-semibold">{title}</h3>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-6">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted text-base font-bold">
        {n}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function UseCase({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-muted/30 px-3 py-6 text-center transition-colors hover:bg-muted/60">
      <div className="text-foreground/70">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

/**
 * Phone mockup with real event photos from Unsplash (free, no auth required).
 */
function PhotoGridMockup() {
  // Curated wedding / event photography from Unsplash.
  // Using ?w=240&h=240&fit=crop for fast tiny thumbnails.
  const photos = [
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=240&h=240&fit=crop", // wedding rings
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=240&h=240&fit=crop", // bride bouquet
    "https://images.unsplash.com/photo-1529636798458-92182e662485?w=240&h=240&fit=crop", // wedding couple
    "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=240&h=240&fit=crop", // wedding party
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=240&h=240&fit=crop", // cheers glasses
    "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=240&h=240&fit=crop", // dance floor
    "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=240&h=240&fit=crop", // bridesmaids
    "https://images.unsplash.com/photo-1525772764200-be829a350797?w=240&h=240&fit=crop", // wedding cake
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=240&h=240&fit=crop", // celebration
  ];


  return (
    <div className="relative">
      {/* Ultra-thin glass phone frame with float animation */}
      <div className="phone-float relative mx-auto aspect-[9/19] w-full max-w-[260px] rounded-[2.2rem] border-4 border-white/60 bg-white/30 shadow-xl backdrop-blur-lg dark:border-black/40 dark:bg-black/30 p-1.5" style={{ boxShadow: "0 8px 32px 0 rgba(0,0,0,0.18)" }}>
        {/* Notch (smaller, more iPhone-like) */}
        <div className="absolute left-1/2 top-1.5 z-10 h-3 w-16 -translate-x-1/2 rounded-b-xl bg-white/80 dark:bg-black/60 shadow" />

        <div className="relative h-full w-full overflow-hidden rounded-[1.5rem] bg-background">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 px-2.5 py-2">
            <div>
              <p className="text-[10px] font-semibold">งานแต่ง · นิว & เจน</p>
              <p className="text-[9px] text-muted-foreground">142 รูป · LIVE</p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-1 py-0.5 text-[8px] font-semibold text-rose-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
              LIVE
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-3 gap-0.5 p-1.5">
            {photos.map((src, i) => (
              <div
                key={i}
                style={{ animationDelay: `${i * 70}ms` }}
                className="photo-in aspect-square overflow-hidden rounded-lg bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating "ค้นหาด้วยใบหน้า" badge */}
      <div className="absolute -left-6 top-16 hidden rounded-2xl border border-border bg-background p-3 shadow-xl sm:block">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-white">
            <ScanFace className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold">AI หาหน้าตัวเอง</p>
            <p className="text-[10px] text-muted-foreground">เจอ 12 รูป</p>
          </div>
        </div>
      </div>

      {/* Floating "อัปโหลดสำเร็จ" badge */}
      <div className="absolute -right-2 bottom-16 hidden rounded-2xl border border-border bg-background p-3 shadow-xl sm:block">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold">+5 รูปใหม่</p>
            <p className="text-[10px] text-muted-foreground">ทันทีจากกล้อง</p>
          </div>
        </div>
      </div>
    </div>
  );
}
