import Link from "next/link";
import Image from "next/image";
import { ScanFace, Lock } from "lucide-react";

type Props = {
  slug: string;
  eventName: string;
};

export function GalleryGate({ slug, eventName }: Props) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      {/* ambient blobs */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-fuchsia-500/8 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-orange-500/6 blur-3xl" />

      <div className="relative flex flex-col items-center gap-6 max-w-sm">
        {/* logo + lock */}
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/60 shadow-xl shadow-fuchsia-500/10 ring-1 ring-border">
            <Image src="/icon.png" width={56} height={56} alt="PhotoLive" className="h-14 w-14" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-background ring-1 ring-border">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
        </div>

        {/* text */}
        <div className="space-y-2">
          <p className="bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 bg-clip-text text-xs font-bold uppercase tracking-widest text-transparent">
            PhotoLive
          </p>
          <h1 className="text-xl font-extrabold tracking-tight">{eventName}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            อัลบั้มนี้เปิดให้ดูเฉพาะรูปของตัวเอง<br />
            สแกนใบหน้าเพื่อค้นหารูปที่มีคุณ
          </p>
        </div>

        {/* CTA */}
        <Link
          href={`/e/${slug}/find`}
          className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 text-[15px] font-bold text-white shadow-lg shadow-fuchsia-500/20 transition-transform hover:scale-[1.01] active:scale-[0.98]"
        >
          <ScanFace className="h-5 w-5" />
          สแกนหน้าเพื่อดูรูปของฉัน
        </Link>

        <p className="text-xs text-muted-foreground">
          ประมวลผลบนอุปกรณ์ของคุณเท่านั้น · ไม่มีการบันทึกข้อมูล
        </p>
      </div>
    </div>
  );
}
