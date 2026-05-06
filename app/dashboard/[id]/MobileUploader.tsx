"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, CheckCircle, XCircle, X, Upload } from "lucide-react";
import { uploadOnePhoto } from "./upload-actions";
import { useToast } from "@/components/Toast";

type Item = {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

const MAX_PARALLEL = 3;

export function MobileUploader({ eventId }: { eventId: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // revoke object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) return;
    setItems((prev) => [
      ...prev,
      ...arr.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: "pending" as const,
      })),
    ]);
  }, []);

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
    const fd = new FormData();
    fd.set("eventId", eventId);
    fd.set("photo", item.file, item.file.name);
    try {
      const res = await uploadOnePhoto(fd);
      setItems((prev) =>
        prev.map((x) =>
          x.id === item.id
            ? { ...x, status: res.ok ? "done" : "error", error: res.error }
            : x,
        ),
      );
      return res.ok;
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

    // Refresh server data
    startTransition(() => {
      // revalidate happens server-side; just trigger re-render hydration
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }

  const pendingCount = items.filter((x) => x.status === "pending" || x.status === "error").length;
  const doneCount = items.filter((x) => x.status === "done").length;

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">อัปโหลดรูป</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ลากวาง หรือเลือกไฟล์ — อัปโหลดพร้อมกันได้หลายรูป
          </p>
        </div>
        {doneCount > 0 && !isUploading && (
          <button
            type="button"
            onClick={clearDone}
            className="text-xs text-muted-foreground hover:text-foreground"
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
        className={`mt-4 flex min-h-[100px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-sm transition-colors ${
          dragOver
            ? "border-primary bg-primary/5 text-foreground"
            : "border-border bg-background text-muted-foreground hover:border-foreground/40"
        }`}
      >
        <ImagePlus className="h-6 w-6" />
        <span>แตะเพื่อเลือก หรือลากรูปมาวาง</span>
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
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-50"
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
    <div className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.previewUrl}
        alt=""
        className={`h-full w-full object-cover transition-opacity ${
          item.status === "uploading" ? "opacity-50" : "opacity-100"
        }`}
      />

      {/* status overlay */}
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
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-red-600/90 py-1 text-xs text-white" title={item.error}>
          <XCircle className="h-3 w-3" />
          ล้มเหลว
        </div>
      )}

      {/* remove button (hidden while uploading) */}
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
  );
}
