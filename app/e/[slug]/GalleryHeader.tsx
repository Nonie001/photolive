"use client";

import { useState } from "react";
import Link from "next/link";
import { QrCode, Share2, Sparkles } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { eventPublicUrl } from "@/lib/utils";

type Props = {
  event: { name: string; slug: string; event_date: string | null };
};

export function GalleryHeader({ event }: Props) {
  const [showQr, setShowQr] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : eventPublicUrl(event.slug);

  async function share() {
    const data = { title: event.name, url };
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share(data);
        return;
      } catch {
        // user cancelled or unsupported
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      alert("คัดลอกลิงก์แล้ว");
    } catch {
      // ignore
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold sm:text-lg">
            {event.name}
          </h1>
          {event.event_date && (
            <p className="truncate text-xs text-muted-foreground">
              {event.event_date}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href={`/e/${event.slug}/find`}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">ค้นหารูปตัวเอง</span>
            <span className="sm:hidden">ค้นรูป</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowQr(true)}
            aria-label="แสดง QR"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border"
          >
            <QrCode className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={share}
            aria-label="แชร์"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showQr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setShowQr(false)}
        >
          <div
            className="rounded-2xl bg-white p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <QRCodeSVG value={url} size={240} marginSize={0} level="M" />
            <p className="mt-3 font-mono text-xs text-zinc-700">/e/{event.slug}</p>
            <button
              type="button"
              onClick={() => setShowQr(false)}
              className="mt-4 h-10 rounded-full bg-zinc-900 px-6 text-sm font-medium text-white"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
