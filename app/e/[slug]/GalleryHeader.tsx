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
      {/* Brand header */}
      <header className="sticky top-0 z-20">
        {/* gradient brand bar */}
        <div className="bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-2.5">
            {/* logo + event name */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-widest text-white/70 uppercase">PhotoLive</span>
                <span className="text-white/40">·</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-300" />
                  LIVE
                </span>
              </div>
              <h1 className="mt-0.5 truncate text-sm font-bold text-white sm:text-base">{event.name}</h1>
              {dateStr && (
                <p className="text-xs text-white/60">{dateStr}{photoCount !== undefined ? ` · ${photoCount} รูป` : ""}</p>
              )}
            </div>
            {/* actions */}
            <div className="flex items-center gap-1.5">
              <Link
                href={`/e/${event.slug}/find`}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-bold text-violet-700 shadow"
              >
                <Sparkles className="h-3 w-3" />
                ค้นรูปตัวเอง
              </Link>
              <button
                type="button"
                onClick={() => setShowQr(true)}
                aria-label="QR"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur"
              >
                <QrCode className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={share}
                aria-label="แชร์"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur"
              >
                {shared ? <Check className="h-4 w-4 text-green-300" /> : <Share2 className="h-4 w-4" />}
              </button>
            </div>
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
