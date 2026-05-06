import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FaceFinder } from "./FaceFinder";

export const metadata = { title: "ค้นหารูปตัวเอง — PhotoLive" };

export default async function FindPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();
  if (!event) notFound();

  const { data: photos } = await supabase
    .from("photos")
    .select(
      "id, event_id, storage_path, thumb_path, width, height, taken_at, uploaded_at, bytes",
    )
    .eq("event_id", event.id)
    .order("uploaded_at", { ascending: false });

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
          <Link
            href={`/e/${event.slug}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border"
            aria-label="กลับ"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold sm:text-lg">
              ค้นหารูปตัวเอง
            </h1>
            <p className="truncate text-xs text-muted-foreground">{event.name}</p>
          </div>
        </div>
      </header>

      <FaceFinder photos={photos ?? []} />
    </div>
  );
}
