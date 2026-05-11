import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  Zap,
  QrCode,
  Download,
  Sparkles,
  ScanFace,
  ArrowRight,
  Wifi,
  Heart,
  Trophy,
  GraduationCap,
  PartyPopper,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { HomePricingSection } from "@/app/HomePricingSection";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Sticky glass header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Image src="/icon.png" width={32} height={32} alt="PhotoLive" className="h-8 w-8 rounded-lg" />
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
        <div className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-fuchsia-500/8 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-sky-500/8 blur-3xl" />

        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-5 py-20 sm:py-28 lg:flex-row lg:items-center lg:gap-16">

          {/* ── Left ── */}
          <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              Realtime · ถ่ายปุ๊บขึ้นปั๊บ
            </div>

            <h1 className="mt-6 text-5xl font-extrabold tracking-tight sm:text-6xl">
              <span className="block py-1 leading-[1.5]">รูปงานของคุณ</span>
              <span className="block py-1 leading-[1.5]">
                <span className="bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 bg-clip-text text-transparent">
                  ขึ้นเว็บทันที
                </span>{" "}ที่ลั่นชัตเตอร์
              </span>
            </h1>

            <p className="mt-5 max-w-md text-base leading-[1.8] text-muted-foreground">
              แพลตฟอร์มแกลเลอรีสำหรับช่างภาพอีเวนต์ — แขกเห็นรูปสด ๆ ผ่าน QR Code
              พร้อม <span className="font-semibold text-foreground">AI ค้นหารูปด้วยใบหน้า</span>
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link
                href={user ? "/dashboard" : "/login"}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02]"
              >
                เริ่มใช้งานฟรี <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how"
                className="inline-flex h-12 items-center rounded-full border border-border px-7 text-sm font-medium transition-colors hover:bg-muted"
              >
                ดูวิธีใช้งาน
              </a>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground lg:justify-start">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />เริ่มฟรี 150 MB</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />ไม่ต้องลงแอป</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />แชร์ได้ทุกแพลตฟอร์ม</span>
            </div>
          </div>

          {/* ── Right ── */}
          <div className="relative w-full max-w-[300px] shrink-0">
            <PhotoGridMockup />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-20">
          <div className="text-center">
            <p className="bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 bg-clip-text text-sm font-semibold uppercase tracking-wider text-transparent">
              ฟีเจอร์
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              ทุกอย่างที่ช่างภาพต้องการ
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={<Camera className="h-5 w-5" />}
              title="Desktop App อัปโหลดอัตโนมัติ"
              body="ติดตั้ง PhotoLive Desktop ครั้งเดียว — กล้อง tether รูปลงโฟลเดอร์ ระบบอัปขึ้นเว็บอัตโนมัติ ไม่ต้องแตะอะไรเพิ่ม"
              gradient="from-fuchsia-500/20 to-pink-500/20"
              iconBg="bg-fuchsia-500"
            />
            <Feature
              icon={<Zap className="h-5 w-5" />}
              title="Realtime ทันที"
              body="แขกเห็นรูปใหม่บน iPhone/Android โดยไม่ต้องรีเฟรช ใช้ Supabase Realtime"
              gradient="from-rose-500/20 to-orange-500/20"
              iconBg="bg-rose-500"
            />
            <Feature
              icon={<ScanFace className="h-5 w-5" />}
              title="AI ค้นหาด้วยใบหน้า"
              body="แขกถ่ายเซลฟี่ครั้งเดียว ระบบหารูปทั้งหมดที่มีหน้าตัวเองให้อัตโนมัติ ทำงานในเบราว์เซอร์"
              gradient="from-orange-500/20 to-amber-500/20"
              iconBg="bg-orange-500"
              badge="AI"
            />
            <Feature
              icon={<QrCode className="h-5 w-5" />}
              title="QR Code พร้อมพิมพ์"
              body="ทุกอีเวนต์มี QR เฉพาะ พิมพ์แปะหน้างาน แขกสแกนแล้วเข้าได้ทันที ไม่ต้อง login"
              gradient="from-fuchsia-500/20 to-rose-500/20"
              iconBg="bg-fuchsia-600"
            />
            <Feature
              icon={<Download className="h-5 w-5" />}
              title="ดาวน์โหลดทั้งอัลบั้ม"
              body="แขกกดปุ่มเดียว ดาวน์โหลดรูปทั้งงานเป็น .zip ทันที พร้อม share ผ่าน social"
              gradient="from-pink-500/20 to-fuchsia-500/20"
              iconBg="bg-pink-500"
            />
            <Feature
              icon={<Wifi className="h-5 w-5" />}
              title="เชื่อมต่อไม่สะดุด"
              body="อินเทอร์เน็ตสะดุด? ระบบ retry อัตโนมัติ ไม่มีรูปหาย รับประกันทุกรูปถึงมือแขก"
              gradient="from-rose-500/20 to-pink-500/20"
              iconBg="bg-rose-400"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-b border-border bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-5 py-20">
          <div className="text-center">
            <p className="bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 bg-clip-text text-sm font-semibold uppercase tracking-wider text-transparent">
              วิธีใช้งาน
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">เริ่มได้ในไม่กี่นาที</h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Step n="1" title="สร้างอีเวนต์" body="กรอกชื่องาน วันที่ ระบบสร้าง slug + QR ให้อัตโนมัติ" />
            <Step n="2" title="ติดตั้ง PhotoLive Desktop" body="โหลดแอปฟรี เปิดโฟลเดอร์ รูปจากกล้องขึ้นเว็บอัตโนมัติ — รองรับ Windows และ macOS" />
            <Step n="3" title="แขกสแกน QR ดูรูป" body="รูปขึ้นทันทีหลังลั่นชัตเตอร์ — ค้นหาด้วยใบหน้า / ดาวน์โหลด / แชร์" />
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="usecases" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-20">
          <div className="text-center">
            <p className="bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 bg-clip-text text-sm font-semibold uppercase tracking-wider text-transparent">
              เหมาะกับงาน
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
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
      <HomePricingSection isLoggedIn={!!user} />

      {/* CTA */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-20">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-foreground to-foreground/90 p-10 text-center text-background sm:p-16">
            <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-fuchsia-500/30 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 -bottom-20 h-60 w-60 rounded-full bg-orange-500/20 blur-3xl" />
            <Sparkles className="mx-auto h-8 w-8 opacity-80" />
            <h2 className="relative mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              พร้อมยกระดับงานของคุณแล้วหรือยัง?
            </h2>
            <p className="relative mt-3 text-sm opacity-70 sm:text-base">
              สร้างอีเวนต์แรกของคุณวันนี้ — ใช้งานฟรี ไม่ต้องใส่บัตรเครดิต
            </p>
            <Link
              href={user ? "/dashboard" : "/login"}
              className="relative mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 px-8 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition-transform hover:scale-[1.02]"
            >
              {user ? "ไปที่หน้าหลัก" : "เริ่มฟรีเลย"} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Image src="/icon.png" width={24} height={24} alt="PhotoLive" className="h-6 w-6 rounded-md" />
            PhotoLive
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
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 via-rose-400 to-orange-400 text-base font-extrabold text-white shadow-md shadow-fuchsia-500/20">
        {n}
      </div>
      <h3 className="mt-4 font-extrabold">{title}</h3>
      <p className="mt-1.5 text-sm leading-[1.7] text-muted-foreground">{body}</p>
    </div>
  );
}

function UseCase({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-muted/30 px-3 py-6 text-center transition-all hover:border-fuchsia-500/30 hover:bg-muted/60">
      <div className="text-fuchsia-500 transition-transform group-hover:scale-110">{icon}</div>
      <span className="text-sm font-semibold">{label}</span>
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
