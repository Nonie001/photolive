import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import chokidar from "chokidar";
import PQueue from "p-queue";
import sharp from "sharp";
import exifr from "exifr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadState, markUploaded, saveState, type State } from "./state.js";

const SUPPORTED = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
]);

export type RunOptions = {
  supabaseUrl: string;
  supabaseKey: string;
  eventSlug: string;
  folder: string;
  concurrency: number;
  thumbSize: number;
  quality: number;
};

export async function run(opts: RunOptions): Promise<void> {
  const folder = path.resolve(opts.folder);
  await fs.mkdir(folder, { recursive: true });

  const supabase = createClient(opts.supabaseUrl, opts.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Resolve event slug -> event id.
  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("id, name")
    .eq("slug", opts.eventSlug)
    .single();
  if (eventErr || !event) {
    throw new Error(`Event not found for slug "${opts.eventSlug}": ${eventErr?.message ?? "no row"}`);
  }
  console.log(`✓ Event: ${event.name} (${event.id})`);
  console.log(`✓ Watching: ${folder}`);
  console.log(`✓ Concurrency: ${opts.concurrency}`);

  const statePath = path.join(folder, ".uploader-state.json");
  const state: State = await loadState(statePath);

  const queue = new PQueue({ concurrency: opts.concurrency });

  const watcher = chokidar.watch(folder, {
    ignored: (p) => {
      const base = path.basename(p);
      return base.startsWith(".") || base === "node_modules";
    },
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 1500,
      pollInterval: 200,
    },
  });

  const stats = { uploaded: 0, skipped: 0, failed: 0 };

  watcher.on("add", (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (!SUPPORTED.has(ext)) return;
    if (state.files[filePath]) {
      stats.skipped++;
      return;
    }

    queue.add(async () => {
      try {
        await processFile({
          filePath,
          eventId: event.id,
          supabase,
          thumbSize: opts.thumbSize,
          quality: opts.quality,
        });
        await markUploaded(statePath, state, filePath);
        stats.uploaded++;
        console.log(
          `↑ ${path.basename(filePath)}  (uploaded:${stats.uploaded} skipped:${stats.skipped} failed:${stats.failed})`,
        );
      } catch (err) {
        stats.failed++;
        console.error(
          `✗ ${path.basename(filePath)}: ${err instanceof Error ? err.message : err}`,
        );
      }
    });
  });

  watcher.on("error", (err) => console.error("Watcher error:", err));

  // Periodic state save (in case of crash).
  const saveInterval = setInterval(() => {
    saveState(statePath, state).catch(() => {});
  }, 10_000);

  process.on("SIGINT", async () => {
    console.log("\nShutting down...");
    clearInterval(saveInterval);
    await watcher.close();
    await queue.onIdle();
    await saveState(statePath, state);
    console.log(
      `Final: uploaded=${stats.uploaded} skipped=${stats.skipped} failed=${stats.failed}`,
    );
    process.exit(0);
  });
}

type ProcessArgs = {
  filePath: string;
  eventId: string;
  supabase: SupabaseClient;
  thumbSize: number;
  quality: number;
};

async function processFile(args: ProcessArgs): Promise<void> {
  const { filePath, eventId, supabase, thumbSize, quality } = args;

  const buf = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase().replace(".", "") || "jpg";
  const id = randomUUID();
  const originalPath = `${eventId}/${id}.${ext}`;
  const thumbPath = `${eventId}/${id}.jpg`;

  // EXIF + dimensions.
  let takenAt: string | null = null;
  try {
    const exif = await exifr.parse(buf, ["DateTimeOriginal", "CreateDate"]);
    const d: Date | undefined = exif?.DateTimeOriginal ?? exif?.CreateDate;
    if (d instanceof Date && !isNaN(d.getTime())) takenAt = d.toISOString();
  } catch {
    // ignore EXIF errors
  }
  if (!takenAt) {
    const stat = await fs.stat(filePath);
    takenAt = stat.mtime.toISOString();
  }

  const image = sharp(buf, { failOn: "none" });
  const meta = await image.metadata();
  const width = meta.width ?? null;
  const height = meta.height ?? null;

  const thumbBuf = await sharp(buf, { failOn: "none" })
    .rotate()
    .resize({
      width: thumbSize,
      height: thumbSize,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  // Upload original + thumb with retries.
  await retry(() =>
    supabase.storage
      .from("photos")
      .upload(originalPath, buf, {
        contentType: mime(ext),
        upsert: false,
      })
      .then(throwIfError),
  );

  await retry(() =>
    supabase.storage
      .from("thumbs")
      .upload(thumbPath, thumbBuf, {
        contentType: "image/jpeg",
        upsert: false,
      })
      .then(throwIfError),
  );

  await retry(() =>
    supabase
      .from("photos")
      .insert({
        event_id: eventId,
        storage_path: originalPath,
        thumb_path: thumbPath,
        width,
        height,
        taken_at: takenAt,
        bytes: buf.byteLength,
      })
      .then(throwIfError),
  );
}

function throwIfError<T extends { error: { message: string } | null }>(res: T): T {
  if (res.error) throw new Error(res.error.message);
  return res;
}

async function retry<T>(fn: () => PromiseLike<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const delay = 500 * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

function mime(ext: string): string {
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
    case "heif":
      return "image/heic";
    default:
      return "application/octet-stream";
  }
}
