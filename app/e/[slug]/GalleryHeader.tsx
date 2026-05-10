"use client";

import { useState } from "react";
import Link from "next/link";
import { QrCode, Share2, Sparkles, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { eventPublicUrl } from "@/lib/utils";

type Props = {
  event: { name: string; slug: string; event_date: string | null };
  photoCount?: number;
};

export function GalleryHeader({ event, photoCount }: Props) {
  const [showQr, setShowQr] = useState(false);
  const [shared, setShared] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : eventPublicUrl(event.slug);

  async function share() {
    const data = { title: event.name, url };
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share(data);
        return;
      } catch {
        // user cancelled
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // ignore
    }
  }

  const dateStr = event.event_date
    ? new Date(event.event_date).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold sm:text-base">{event.name}</h1>
            <p className="text-xs text-muted-foreground">
              {dateStr ?? ""}{dateStr && photoCount !== undefined ? " · " : ""}{photoCount !== undefined ? `${photoCount} รูป` : ""}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Link
              href={`/e/${event.slug}/find`}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm"
            >
              <Sparkles className="h-3 w-3" />
              <span>ค้นรูปตัวเอง</span>
            </Link>
            <button
              type="button"
              onClick={() => setShowQr(true)}
              aria-label="แสดง QR"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/80 transition-colors hover:bg-muted"
            >
              <QrCode className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={share}
              aria-label="แชร์"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/80 transition-colors hover:bg-muted"
            >
              {shared ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {showQr && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setShowQr(false)}
        >
          <div
            className="w-full rounded-t-3xl bg-white p-8 text-center sm:w-auto sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 font-semibold text-zinc-800">{event.name}</p>
            <div className="flex justify-center">
              <QRCodeSVG value={url} size={220} marginSize={2} level="M" />
            </div>
            <p className="mt-3 text-xs text-zinc-400">{url}</p>
            <button
              type="button"
              onClick={() => setShowQr(false)}
              className="mt-5 h-11 w-full rounded-2xl bg-zinc-900 text-sm font-semibold text-white"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </>
  );
}
