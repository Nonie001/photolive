"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { thumbUrl, originalUrl } from "@/lib/storage";
import type { PhotoRow } from "@/lib/types";
import { Lightbox } from "./Lightbox";
import { DownloadAllButton } from "./DownloadAllButton";
import { Check, Download, X } from "lucide-react";

type Props = {
  eventId: string;
  eventName: string;
  initialPhotos: PhotoRow[];
  pageSize: number;
};

export function GalleryRealtime({
  eventId,
  eventName,
  initialPhotos,
  pageSize,
}: Props) {
  const [photos, setPhotos] = useState<PhotoRow[]>(initialPhotos);
  const [hasMore, setHasMore] = useState(initialPhotos.length === pageSize);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Multi-select
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dlProgress, setDlProgress] = useState<{ done: number; total: number } | null>(null);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  async function downloadSelected() {
    const selected = photos.filter((p) => selectedIds.has(p.id));
    if (selected.length === 0) return;
    setDlProgress({ done: 0, total: selected.length });
    let done = 0;
    for (const photo of selected) {
      try {
        const res = await fetch(originalUrl(photo));
        const blob = await res.blob();
        const name = photo.storage_path.split("/").pop() ?? `${photo.id}.jpg`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        // small delay so browser/mobile has time to handle each file
        await new Promise((r) => setTimeout(r, 300));
      } catch { /* skip */ }
      done++;
      setDlProgress({ done, total: selected.length });
    }
    setDlProgress(null);
    exitSelectMode();
  }

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Realtime subscription.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`photos:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "photos",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const newPhoto = payload.new as PhotoRow;
          setPhotos((prev) =>
            prev.some((p) => p.id === newPhoto.id) ? prev : [newPhoto, ...prev],
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "photos",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const oldId = (payload.old as { id?: string }).id;
          if (!oldId) return;
          setPhotos((prev) => prev.filter((p) => p.id !== oldId));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || photos.length === 0) return;
    setLoadingMore(true);
    try {
      const supabase = createClient();
      const cursor = photos[photos.length - 1].uploaded_at;
      const { data } = await supabase
        .from("photos")
        .select(
          "id, event_id, storage_path, thumb_path, width, height, taken_at, uploaded_at, bytes",
        )
        .eq("event_id", eventId)
        .lt("uploaded_at", cursor)
        .order("uploaded_at", { ascending: false })
        .limit(pageSize);

      if (data && data.length > 0) {
        setPhotos((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...data.filter((p) => !seen.has(p.id))];
        });
        if (data.length < pageSize) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [eventId, hasMore, loadingMore, pageSize, photos]);

  // IntersectionObserver -> infinite scroll.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  if (photos.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl">📷</div>
        <p className="font-medium">ยังไม่มีรูปในขณะนี้</p>
        <p className="mt-1 text-sm text-muted-foreground">รูปจะขึ้นที่นี่ทันทีหลังช่างภาพอัปโหลด</p>
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* toolbar */}
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-3 pb-2 pt-3 sm:px-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-900/40 px-2 py-0.5 text-xs font-semibold text-green-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            Live
          </span>
          <span className="text-xs text-muted-foreground">{photos.length} รูป</span>
        </div>
        <div className="flex items-center gap-2">
          {!selectMode ? (
            <>
              <button
                type="button"
                onClick={() => setSelectMode(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs hover:bg-muted transition-colors"
              >
                เลือก
              </button>
              <DownloadAllButton photos={photos} eventName={eventName} />
            </>
          ) : (
            <button
              type="button"
              onClick={exitSelectMode}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              ยกเลิก
            </button>
          )}
        </div>
      </div>

      {/* grid */}
      <div className="grid grid-cols-3 gap-0.5 sm:grid-cols-4 sm:gap-1 md:grid-cols-5 lg:grid-cols-6">
        {photos.map((photo, i) => {
          const isSelected = selectedIds.has(photo.id);
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => {
                if (selectMode) {
                  toggleSelect(photo.id);
                } else {
                  setLightboxIndex(i);
                }
              }}
              className={`photo-in group relative aspect-square overflow-hidden bg-muted ${
                selectMode && isSelected ? "ring-2 ring-inset ring-fuchsia-500" : ""
              }`}
            >
              <Image
                src={thumbUrl(photo)}
                alt=""
                fill
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                className={`object-cover transition-transform duration-300 group-hover:scale-105 group-active:scale-95 ${
                  selectMode && isSelected ? "brightness-75" : ""
                }`}
                unoptimized
              />
              {selectMode && (
                <div className={`absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                  isSelected
                    ? "border-fuchsia-500 bg-fuchsia-500"
                    : "border-white/70 bg-black/30"
                }`}>
                  {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div ref={sentinelRef} className="h-16" />
      {loadingMore && (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* floating download bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <button
            type="button"
            onClick={downloadSelected}
            disabled={dlProgress !== null}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 px-6 text-sm font-semibold text-white shadow-xl shadow-fuchsia-500/30 disabled:opacity-70 transition-transform hover:scale-[1.02]"
          >
            <Download className="h-4 w-4" />
            {dlProgress
              ? `กำลังโหลด ${dlProgress.done}/${dlProgress.total}...`
              : `โหลด ${selectedIds.size} รูป`}
          </button>
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </div>
  );
}
