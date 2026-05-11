"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Camera, Zap, Users } from "lucide-react";

type Props = {
  eventName: string;
  photoCount: number;
};

export function GallerySplash({ eventName, photoCount }: Props) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // start fade-out after 2.2s
    const fadeTimer = setTimeout(() => setFading(true), 2200);
    // fully remove after fade completes
    const removeTimer = setTimeout(() => setVisible(false), 2800);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-6 transition-opacity duration-500 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* ambient blobs */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-orange-500/8 blur-3xl" />

      <div className="relative flex flex-col items-center gap-6 text-center">
        {/* logo */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/60 shadow-xl shadow-fuchsia-500/10 ring-1 ring-border">
          <Image src="/icon.png" width={56} height={56} alt="PhotoLive" className="h-14 w-14" />
        </div>

        {/* brand + event */}
        <div className="space-y-1.5">
          <p className="bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 bg-clip-text text-sm font-bold uppercase tracking-widest text-transparent">
            PhotoLive
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">{eventName}</h1>
          {photoCount > 0 && (
            <p className="text-sm text-muted-foreground">{photoCount} รูป · ถ่ายทอดสดจากช่างภาพ</p>
          )}
        </div>

        {/* feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium">
            <Zap className="h-3 w-3 text-fuchsia-400" />
            อัปโหลดรูปแบบเรียลไทม์
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium">
            <Camera className="h-3 w-3 text-rose-400" />
            ค้นหารูปตัวเองด้วย AI
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium">
            <Users className="h-3 w-3 text-orange-400" />
            ดาวน์โหลดได้ฟรีทุกรูป
          </span>
        </div>

        {/* loading dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-400 animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
