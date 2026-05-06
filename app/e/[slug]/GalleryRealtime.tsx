"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { thumbUrl } from "@/lib/storage";
import type { PhotoRow } from "@/lib/types";
import { Lightbox } from "./Lightbox";
import { DownloadAllButton } from "./DownloadAllButton";

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
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <p className="text-muted-foreground">ยังไม่มีรูป</p>
        <p className="mt-2 text-sm text-muted-foreground">
          รอช่างภาพอัปโหลด รูปจะขึ้นที่นี่อัตโนมัติ
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{photos.length} รูป</p>
        <DownloadAllButton photos={photos} eventName={eventName} />
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 md:grid-cols-4 lg:grid-cols-5">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className="photo-in group relative aspect-square overflow-hidden rounded-md bg-muted"
          >
            <Image
              src={thumbUrl(photo)}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              unoptimized
            />
          </button>
        ))}
      </div>

      <div ref={sentinelRef} className="h-12" />
      {loadingMore && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          กำลังโหลด...
        </p>
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
