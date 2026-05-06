"use client";

import { useActionState, useEffect, useRef } from "react";
import { ImagePlus, Loader2, CheckCircle, XCircle } from "lucide-react";
import { uploadPhotosAction, type UploadState } from "./upload-actions";

const initial: UploadState = { ok: 0, fail: 0, error: null };

export function MobileUploader({ eventId }: { eventId: string }) {
  const [state, formAction, pending] = useActionState(uploadPhotosAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset file input after successful upload
  useEffect(() => {
    if (!pending && (state.ok > 0 || state.fail > 0)) {
      formRef.current?.reset();
    }
  }, [pending, state]);

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-5">
      <h2 className="font-semibold">อัปโหลดรูปจากมือถือ / เครื่อง</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        เลือกหลายรูปพร้อมกันได้ รองรับ JPG, PNG, HEIC
      </p>

      <form ref={formRef} action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="eventId" value={eventId} />

        <label className="flex min-h-[80px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background p-4 text-sm text-muted-foreground hover:border-foreground/40 transition-colors">
          <ImagePlus className="h-6 w-6" />
          <span>แตะเพื่อเลือกรูป</span>
          <input
            type="file"
            name="photos"
            accept="image/*"
            multiple
            capture={undefined}
            className="hidden"
            disabled={pending}
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              กำลังอัปโหลด...
            </>
          ) : (
            <>
              <ImagePlus className="h-4 w-4" />
              อัปโหลด
            </>
          )}
        </button>
      </form>

      {!pending && state.ok > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
          <CheckCircle className="h-4 w-4 shrink-0" />
          อัปโหลดสำเร็จ {state.ok} รูป
          {state.fail > 0 && ` (ล้มเหลว ${state.fail} รูป)`}
        </div>
      )}
      {!pending && state.error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <XCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}
      {!pending && state.fail > 0 && !state.error && state.ok === 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <XCircle className="h-4 w-4 shrink-0" />
          อัปโหลดล้มเหลว {state.fail} รูป
        </div>
      )}
    </div>
  );
}
