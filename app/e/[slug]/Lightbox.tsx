"use client";

import Image from "next/image";
import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { originalUrl, thumbUrl } from "@/lib/storage";
import type { PhotoRow } from "@/lib/types";

type Props = {
  photos: PhotoRow[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
};

export function Lightbox({ photos, index, onClose, onIndexChange }: Props) {
  const photo = photos[index];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
      else if (e.key === "ArrowRight" && index < photos.length - 1)
        onIndexChange(index + 1);
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, photos.length, onClose, onIndexChange]);

  // Touch swipe.
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    function onStart(e: TouchEvent) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }
    function onEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0 && index < photos.length - 1) onIndexChange(index + 1);
        else if (dx > 0 && index > 0) onIndexChange(index - 1);
      }
    }
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [index, photos.length, onIndexChange]);

  async function downloadOne() {
    const url = originalUrl(photo);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = photo.storage_path.split("/").pop() ?? "photo.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between p-3 text-white">
        <p className="text-sm tabular-nums">
          {index + 1} / {photos.length}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadOne}
            aria-label="ดาวน์โหลด"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative flex-1">
        <Image
          key={photo.id}
          src={originalUrl(photo)}
          alt=""
          fill
          sizes="100vw"
          className="object-contain"
          placeholder="blur"
          blurDataURL={thumbUrl(photo)}
          priority
          unoptimized
        />

        {index > 0 && (
          <button
            type="button"
            onClick={() => onIndexChange(index - 1)}
            aria-label="ก่อนหน้า"
            className="absolute left-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white sm:inline-flex"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {index < photos.length - 1 && (
          <button
            type="button"
            onClick={() => onIndexChange(index + 1)}
            aria-label="ถัดไป"
            className="absolute right-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white sm:inline-flex"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
}
