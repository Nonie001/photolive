import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import chokidar from "chokidar";
import PQueue from "p-queue";
import sharp from "sharp";
import exifr from "exifr";
import ws from "ws";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadState, markUploaded, saveState, type State } from "./state";

const SUPPORTED = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]);

export type LogEntry = {
  type: "info" | "success" | "skip" | "error";
  filename: string;
  message: string;
};

export type Stats = {
  uploaded: number;
  skipped: number;
  failed: number;
};

export type WatcherOptions = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseAccessToken: string;
  eventSlug: string;
  folder: string;
  concurrency: number;
  thumbSize: number;
  quality: number;
  onLog: (entry: LogEntry) => void;
  onStats: (stats: Stats) => void;
};

export type WatcherHandle = {
  stop: () => Promise<void>;
};

export async function startWatcher(opts: WatcherOptions): Promise<WatcherHandle> {
  const folder = path.resolve(opts.folder);
  await fs.mkdir(folder, { recursive: true });

  const supabase = createClient(opts.supabaseUrl, opts.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws },
    global: { headers: { Authorization: `Bearer ${opts.supabaseAccessToken}` } },
  });

  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("id, name")
    .eq("slug", opts.eventSlug)
    .single();

  if (eventErr || !event) {
    throw new Error(
      `ไม่พบ event "${opts.eventSlug}": ${eventErr?.message ?? "ไม่มีข้อมูล"}`,
    );
  }

  opts.onLog({ type: "info", filename: "", message: `เชื่อมต่อ: ${event.name}` });
  opts.onLog({ type: "info", filename: "", message: `กำลัง watch: ${folder}` });

  const statePath = path.join(folder, ".uploader-state.json");
  const state: State = await loadState(statePath);

  const queue = new PQueue({ concurrency: opts.concurrency });
  const stats: Stats = { uploaded: 0, skipped: 0, failed: 0 };

  const watcher = chokidar.watch(folder, {
    ignored: (p) => {
      const base = path.basename(p as string);
      return base.startsWith(".") || base === "node_modules";
    },
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: { stabilityThreshold: 1500, pollInterval: 200 },
  });

  watcher.on("add", (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (!SUPPORTED.has(ext)) return;

    if (state.files[filePath]) {
      stats.skipped++;
      opts.onStats({ ...stats });
      return;
    }

    queue.add(async () => {
      const filename = path.basename(filePath);
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
        opts.onLog({ type: "success", filename, message: "อัปโหลดสำเร็จ" });
        opts.onStats({ ...stats });
      } catch (err) {
        stats.failed++;
        opts.onLog({
          type: "error",
          filename,
          message: err instanceof Error ? err.message : String(err),
        });
        opts.onStats({ ...stats });
      }
    });
  });

  watcher.on("error", (err) => {
    opts.onLog({ type: "error", filename: "", message: `Watcher error: ${err}` });
  });

  const saveInterval = setInterval(() => {
    saveState(statePath, state).catch(() => {});
  }, 10_000);

  return {
    stop: async () => {
      clearInterval(saveInterval);
      await watcher.close();
      await queue.onIdle();
      await saveState(statePath, state);
      opts.onLog({
        type: "info",
        filename: "",
        message: `หยุดแล้ว — อัปโหลด ${stats.uploaded} | ข้าม ${stats.skipped} | ผิดพลาด ${stats.failed}`,
      });
    },
  };
}

// ── File processing ───────────────────────────────────────────────────────────

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
    .resize({ width: thumbSize, height: thumbSize, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  await retry(() =>
    supabase.storage
      .from("photos")
      .upload(originalPath, buf, { contentType: mime(ext), upsert: false })
      .then(throwIfError),
  );

  await retry(() =>
    supabase.storage
      .from("thumbs")
      .upload(thumbPath, thumbBuf, { contentType: "image/jpeg", upsert: false })
      .then(throwIfError),
  );

  await retry(() =>
    supabase
      .from("photos")
      .insert({ event_id: eventId, storage_path: originalPath, thumb_path: thumbPath, width, height, taken_at: takenAt, bytes: buf.byteLength })
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
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, i)));
    }
  }
  throw lastErr;
}

function mime(ext: string): string {
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
  };
  return map[ext] ?? "application/octet-stream";
}
