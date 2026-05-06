"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import JSZip from "jszip";
import { originalUrl } from "@/lib/storage";
import type { PhotoRow } from "@/lib/types";

const MAX_AUTO = 500;

export function DownloadAllButton({
  photos,
  eventName,
}: {
  photos: PhotoRow[];
  eventName: string;
}) {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  async function downloadAll() {
    if (photos.length === 0) return;
    if (photos.length > MAX_AUTO) {
      const ok = window.confirm(
        `อัลบั้มมี ${photos.length} รูป การดาวน์โหลดจะใช้เวลานานและกินแรม ดำเนินการต่อ?`,
      );
      if (!ok) return;
    }

    const zip = new JSZip();
    setProgress({ done: 0, total: photos.length });

    let done = 0;
    for (const photo of photos) {
      try {
        const res = await fetch(originalUrl(photo));
        const blob = await res.blob();
        const name = photo.storage_path.split("/").pop() ?? `${photo.id}.jpg`;
        zip.file(name, blob);
      } catch {
        // skip failed file
      }
      done++;
      setProgress({ done, total: photos.length });
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventName.replace(/[^\w\s-]/g, "_")}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setProgress(null);
  }

  return (
    <button
      type="button"
      onClick={downloadAll}
      disabled={progress !== null}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs disabled:opacity-50"
    >
      <Download className="h-3.5 w-3.5" />
      {progress
        ? `${progress.done}/${progress.total}`
        : "ดาวน์โหลดทั้งหมด"}
    </button>
  );
}
