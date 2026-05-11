"use client";

import { useActionState, useState } from "react";
import { Loader2, Globe, ScanFace } from "lucide-react";
import { createEvent, type CreateEventState } from "../actions";

const initialState: CreateEventState = { error: null };

export function NewEventForm() {
  const [state, formAction, pending] = useActionState(createEvent, initialState);
  const [access, setAccess] = useState<"public" | "face_only">("public");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="photo_access" value={access} />

      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          ชื่ออีเวนต์
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={100}
          placeholder="งานแต่ง คุณ A & คุณ B"
          className="h-12 w-full rounded-xl border border-border bg-background/50 px-4 text-base outline-none focus:border-fuchsia-500/50 transition-colors"
          disabled={pending}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="event_date" className="text-sm font-medium">
          วันที่จัดงาน <span className="text-muted-foreground">(ไม่บังคับ)</span>
        </label>
        <input
          id="event_date"
          name="event_date"
          type="date"
          className="h-12 w-full rounded-xl border border-border bg-background/50 px-4 text-base outline-none focus:border-fuchsia-500/50 transition-colors"
          disabled={pending}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">การแสดงรูป</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setAccess("public")}
            className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
              access === "public"
                ? "border-fuchsia-500/50 bg-fuchsia-500/5"
                : "border-border bg-background/50 hover:bg-muted/30"
            }`}
          >
            <Globe className={`mt-0.5 h-4 w-4 shrink-0 ${access === "public" ? "text-fuchsia-400" : "text-muted-foreground"}`} />
            <div>
              <p className="text-sm font-semibold">สาธารณะ</p>
              <p className="mt-0.5 text-xs text-muted-foreground">แขกทุกคนดูรูปทั้งหมดได้</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setAccess("face_only")}
            className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
              access === "face_only"
                ? "border-fuchsia-500/50 bg-fuchsia-500/5"
                : "border-border bg-background/50 hover:bg-muted/30"
            }`}
          >
            <ScanFace className={`mt-0.5 h-4 w-4 shrink-0 ${access === "face_only" ? "text-fuchsia-400" : "text-muted-foreground"}`} />
            <div>
              <p className="text-sm font-semibold">สแกนหน้าก่อน</p>
              <p className="mt-0.5 text-xs text-muted-foreground">ดูได้เฉพาะรูปตัวเอง</p>
            </div>
          </button>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm font-medium text-red-300">
          ❌ {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/20 transition-transform hover:scale-[1.01] disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            กำลังสร้าง...
          </>
        ) : (
          "สร้างอีเวนต์"
        )}
      </button>
    </form>
  );
}
