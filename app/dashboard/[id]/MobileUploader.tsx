"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, CheckCircle, XCircle, X, Upload } from "lucide-react";
import { getUploadUrls, insertPhotoRecord } from "./upload-actions";
import { useToast } from "@/components/Toast";

type Item = {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

const MAX_PARALLEL = 3;
const MAX_SIZE_MB = 50; // Direct upload bypasses Vercel — Supabase bucket limit is 50 MB
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
// HEIC/HEIF — Canvas API can't decode these. Reject early.
const BLOCKED_EXT = ["heic", "heif"];

/** Generate a resized JPEG thumbnail in the browser using Canvas. */
async function generateThumbnail(
  file: File,
  maxSize = 800,
): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > maxSize || h > maxSize) {
        const ratio = Math.min(maxSize / w, maxSize / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve({ blob, width: img.naturalWidth, height: img.naturalHeight });
          else reject(new Error("thumbnail generation failed"));
        },
        "image/jpeg",
        0.82,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load failed"));
    };
    img.src = url;
  });
}

function prettySize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MobileUploader({ eventId }: { eventId: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // revoke object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      const accepted: File[] = [];
      let rejectedHeic = 0;
      let rejectedSize = 0;
      let rejectedType = 0;

      for (const f of arr) {
        const ext = (f.name.split(".").pop() ?? "").toLowerCase();
        const isImage = f.type.startsWith("image/") || BLOCKED_EXT.includes(ext);
        if (!isImage) {
          rejectedType++;
          continue;
        }
        if (BLOCKED_EXT.includes(ext) || /heic|heif/i.test(f.type)) {
          rejectedHeic++;
          continue;
        }
        if (f.size > MAX_SIZE_BYTES) {
          rejectedSize++;
          continue;
        }
        accepted.push(f);
      }

      if (rejectedHeic > 0)
        toast.show(
          `ไม่รองรับไฟล์ HEIC ${rejectedHeic} ไฟล์ (ตั้งกล้อง iPhone เป็น "เข้ากันได้สูงสุด" หรือแชร์เป็น JPG)`,
          "error",
        );
      if (rejectedSize > 0)
        toast.show(`ไฟล์ใหญ่เกิน ${MAX_SIZE_MB}MB ${rejectedSize} ไฟล์`, "error");
      if (rejectedType > 0)
        toast.show(`ไม่ใช่ไฟล์รูป ${rejectedType} ไฟล์`, "error");

      if (accepted.length === 0) return;
      setItems((prev) => [
        ...prev,
        ...accepted.map((file) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          file,
          previewUrl: URL.createObjectURL(file),
          status: "pending" as const,
        })),
      ]);
    },
    [toast],
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const it = prev.find((x) => x.id === id);
      if (it) URL.revokeObjectURL(it.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  }, []);

  const clearDone = useCallback(() => {
    setItems((prev) => {
      prev.filter((x) => x.status === "done").forEach((x) => URL.revokeObjectURL(x.previewUrl));
      return prev.filter((x) => x.status !== "done");
    });
  }, []);

  async function uploadOne(item: Item) {
    setItems((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, status: "uploading" } : x)),
    );
    try {
      const ext = (item.file.name.split(".").pop() ?? "jpg").toLowerCase();

      // 1. Get signed upload URLs from server (no file data sent to Vercel)
      const urls = await getUploadUrls(eventId, ext);
      if (!urls.ok || !urls.photoPath || !urls.photoUploadUrl || !urls.thumbPath || !urls.thumbUploadUrl) {
        throw new Error(urls.error ?? "ไม่สามารถสร้าง URL ได้");
      }

      // 2. Upload original directly to R2 (bypasses Vercel limit)
      const photoRes = await fetch(urls.photoUploadUrl, {
        method: "PUT",
        body: item.file,
        headers: { "Content-Type": item.file.type || "image/jpeg" },
      });
      if (!photoRes.ok) throw new Error(`อัปโหลดรูปไม่สำเร็จ: ${photoRes.status}`);

      // 3. Generate thumbnail in browser
      const { blob: thumbBlob, width, height } = await generateThumbnail(item.file);

      // 4. Upload thumbnail directly to R2
      const thumbRes = await fetch(urls.thumbUploadUrl, {
        method: "PUT",
        body: thumbBlob,
        headers: { "Content-Type": "image/jpeg" },
      });
      if (!thumbRes.ok) throw new Error(`อัปโหลด thumbnail ไม่สำเร็จ: ${thumbRes.status}`);

      // 5. Insert DB record (only metadata — tiny payload)
      const res = await insertPhotoRecord({
        eventId,
        storagePath: urls.photoPath,
        thumbPath: urls.thumbPath,
        width,
        height,
        bytes: item.file.size,
      });
      if (!res.ok) throw new Error(res.error ?? "บันทึกข้อมูลไม่สำเร็จ");

      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, status: "done" } : x)),
      );
      return true;
    } catch (e) {
      setItems((prev) =>
        prev.map((x) =>
          x.id === item.id
            ? { ...x, status: "error", error: e instanceof Error ? e.message : "error" }
            : x,
        ),
      );
      return false;
    }
  }

  async function startUpload() {
    const pending = items.filter((x) => x.status === "pending" || x.status === "error");
    if (pending.length === 0) return;
    setIsUploading(true);
    let okCount = 0;
    let failCount = 0;

    // Reset errored items back to pending so they show uploading state
    setItems((prev) => prev.map((x) => (x.status === "error" ? { ...x, status: "pending", error: undefined } : x)));

    // Process in chunks of MAX_PARALLEL
    const queue = [...pending];
    const workers: Promise<void>[] = Array.from({ length: Math.min(MAX_PARALLEL, queue.length) }, async () => {
      while (queue.length > 0) {
        const next = queue.shift();
        if (!next) break;
        const ok = await uploadOne(next);
        if (ok) okCount++;
        else failCount++;
      }
    });
    await Promise.all(workers);

    setIsUploading(false);
    if (okCount > 0) toast.show(`อัปโหลดสำเร็จ ${okCount} รูป`, "success");
    if (failCount > 0) toast.show(`ล้มเหลว ${failCount} รูป`, "error");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }

  const pendingCount = items.filter((x) => x.status === "pending" || x.status === "error").length;
  const doneCount = items.filter((x) => x.status === "done").length;

  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 bg-clip-text text-xs font-semibold uppercase tracking-wider text-transparent">อัปโหลด</p>
          <h2 className="mt-0.5 font-extrabold">อัปโหลดรูป</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            ลากวาง หรือเลือกไฟล์ — อัปโหลดพร้อมกันได้หลายรูป
          </p>
        </div>
        {doneCount > 0 && !isUploading && (
          <button
            type="button"
            onClick={clearDone}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            ล้างที่เสร็จแล้ว
          </button>
        )}
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`mt-4 flex min-h-25 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-sm transition-colors ${
          dragOver
            ? "border-fuchsia-500/60 bg-fuchsia-500/5 text-fuchsia-300"
            : "border-border bg-background/50 text-muted-foreground hover:border-fuchsia-500/30 hover:bg-muted/20"
        }`}
      >
        <ImagePlus className="h-6 w-6" />
        <span>แตะเพื่อเลือก หรือลากรูปมาวาง</span>
        <span className="text-xs opacity-70">
          JPG, PNG, WebP — สูงสุด {MAX_SIZE_MB}MB ต่อรูป (ไม่รองรับ HEIC)
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {items.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 mdisplay:grid-cols-5">
            {items.map((it) => (
              <PreviewTile key={it.id} item={it} onRemove={() => removeItem(it.id)} disabled={isUploading} />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {items.length} ไฟล์ · เสร็จแล้ว {doneCount} · รอ {pendingCount}
            </p>
            <button
              type="button"
              onClick={startUpload}
              disabled={isUploading || pendingCount === 0}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 px-5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/20 transition-transform hover:scale-[1.02] disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังอัปโหลด...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  อัปโหลด {pendingCount} รูป
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewTile({
  item,
  onRemove,
  disabled,
}: {
  item: Item;
  onRemove: () => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.previewUrl}
          alt=""
          className={`h-full w-full object-cover transition-opacity ${
            item.status === "uploading" ? "opacity-50" : "opacity-100"
          }`}
        />

        {item.status === "uploading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
        {item.status === "done" && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-green-600/90 py-1 text-xs text-white">
            <CheckCircle className="h-3 w-3" />
            เสร็จ
          </div>
        )}
        {item.status === "error" && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-red-600/90 py-1 text-xs text-white">
            <XCircle className="h-3 w-3" />
            ล้มเหลว
          </div>
        )}

        {!disabled && item.status !== "uploading" && item.status !== "done" && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="ลบ"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <p className="truncate text-[10px] text-muted-foreground" title={item.file.name}>
        {item.file.name} · {prettySize(item.file.size)}
      </p>
      {item.status === "error" && item.error && (
        <p className="text-[10px] text-red-600 dark:text-red-400" title={item.error}>
          {item.error.length > 60 ? item.error.slice(0, 60) + "…" : item.error}
        </p>
      )}
    </div>
  );
}
