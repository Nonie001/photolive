import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { thumbUrl } from "@/lib/storage";
import { GalleryRealtime } from "./GalleryRealtime";
import { GalleryHeader } from "./GalleryHeader";

const PAGE_SIZE = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("name, cover_photo_id")
    .eq("slug", slug)
    .single();

  if (!event) return { title: "ไม่พบอีเวนต์ — PhotoLive" };

  let cover: string | undefined;
  if (event.cover_photo_id) {
    const { data: photo } = await supabase
      .from("photos")
      .select("thumb_path")
      .eq("id", event.cover_photo_id)
      .single();
    if (photo) cover = thumbUrl(photo);
  }

  return {
    title: `${event.name} — PhotoLive`,
    openGraph: {
      title: event.name,
      images: cover ? [cover] : undefined,
    },
  };
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, name, slug, event_date")
    .eq("slug", slug)
    .single();

  if (!event) notFound();

  const { data: initialPhotos } = await supabase
    .from("photos")
    .select("id, event_id, storage_path, thumb_path, width, height, taken_at, uploaded_at, bytes")
    .eq("event_id", event.id)
    .order("uploaded_at", { ascending: false })
    .limit(PAGE_SIZE);

  return (
    <div className="flex flex-1 flex-col">
      <GalleryHeader event={event} />
      <GalleryRealtime
        eventId={event.id}
        eventName={event.name}
        initialPhotos={initialPhotos ?? []}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
