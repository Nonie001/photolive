"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Camera, Zap, Download } from "lucide-react";

type Props = {
  eventName: string;
  photoCount: number;
};

export function GallerySplash({ eventName, photoCount }: Props) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  function dismiss() {
    setFading(true);
    setTimeout(() => setVisible(false), 500);
  }

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-500 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* background image */}
      <Image
        src="/bg.jpg"
        alt=""
        fill
        className="object-cover object-center"
        style={{ filter: "blur(3px)", transform: "scale(1.05)" }}
        priority
      />

      {/* overlay */}
      <div className="absolute inset-0 bg-black/55" />

      {/* center card */}
      <div className="relative z-10 mx-6 flex flex-col items-center gap-7 text-center">

        {/* logo */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md shadow-2xl">
          <Image src="/icon.png" width={44} height={44} alt="PhotoLive" className="h-11 w-11" />
        </div>

        {/* brand + event name */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/45">
            PhotoLive
          </p>
          <h1 className="text-[2rem] font-bold leading-tight text-white drop-shadow-lg">{eventName}</h1>
        </div>

        {/* stats row */}
        <div className="flex items-center gap-4">
          {photoCount > 0 && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-lg font-bold text-white">{photoCount}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/45">รูปภาพ</span>
            </div>
          )}
          {photoCount > 0 && <div className="h-8 w-px bg-white/20" />}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg font-bold text-white">Live</span>
            <span className="text-[10px] uppercase tracking-wider text-white/45">อัปเดตสด</span>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg font-bold text-white">AI</span>
            <span className="text-[10px] uppercase tracking-wider text-white/45">ค้นหาตัวเอง</span>
          </div>
        </div>

        {/* thin divider */}
        <div className="h-px w-10 bg-white/20" />

        {/* feature pills */}
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <div className="flex items-center gap-3 rounded-xl bg-white/8 px-4 py-2.5 backdrop-blur-sm ring-1 ring-white/10">
            <Zap className="h-4 w-4 flex-shrink-0 text-white/60" />
            <span className="text-sm text-white/80">อัปโหลดรูปแบบเรียลไทม์จากช่างภาพ</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/8 px-4 py-2.5 backdrop-blur-sm ring-1 ring-white/10">
            <Camera className="h-4 w-4 flex-shrink-0 text-white/60" />
            <span className="text-sm text-white/80">ค้นหารูปตัวเองด้วย Face AI</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/8 px-4 py-2.5 backdrop-blur-sm ring-1 ring-white/10">
            <Download className="h-4 w-4 flex-shrink-0 text-white/60" />
            <span className="text-sm text-white/80">ดาวน์โหลดรูปได้ฟรีทุกใบ</span>
          </div>
        </div>

        {/* CTA button */}
        <button
          type="button"
          onClick={dismiss}
          style={{ height: "52px" }}
          className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-neutral-900 shadow-lg transition-all active:scale-95 hover:bg-white/90"
        >
          เข้าดูอัลบั้ม
          <ArrowRight className="h-4 w-4" />
        </button>

      </div>
    </div>
  );
}
