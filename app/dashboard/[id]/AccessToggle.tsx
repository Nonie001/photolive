"use client";

import { useState, useTransition } from "react";
import { Globe, ScanFace, Loader2 } from "lucide-react";
import { updateEventAccess } from "@/app/dashboard/actions";

type Access = "public" | "face_only";

export function AccessToggle({
  eventId,
  initial,
}: {
  eventId: string;
  initial: Access;
}) {
  const [access, setAccess] = useState<Access>(initial);
  const [pending, startTransition] = useTransition();

  function toggle(next: Access) {
    if (next === access || pending) return;
    setAccess(next);
    startTransition(async () => {
      await updateEventAccess(eventId, next);
    });
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => toggle("public")}
        disabled={pending}
        className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all disabled:opacity-60 ${
          access === "public"
            ? "border-fuchsia-500/50 bg-fuchsia-500/5"
            : "border-border bg-background/50 hover:bg-muted/30"
        }`}
      >
        {access === "public" && pending ? (
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-fuchsia-400" />
        ) : (
          <Globe className={`mt-0.5 h-4 w-4 shrink-0 ${access === "public" ? "text-fuchsia-400" : "text-muted-foreground"}`} />
        )}
        <div>
          <p className="text-sm font-semibold">สาธารณะ</p>
          <p className="mt-0.5 text-xs text-muted-foreground">แขกทุกคนดูรูปทั้งหมดได้</p>
        </div>
      </button>
      <button
        type="button"
        onClick={() => toggle("face_only")}
        disabled={pending}
        className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all disabled:opacity-60 ${
          access === "face_only"
            ? "border-fuchsia-500/50 bg-fuchsia-500/5"
            : "border-border bg-background/50 hover:bg-muted/30"
        }`}
      >
        {access === "face_only" && pending ? (
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-fuchsia-400" />
        ) : (
          <ScanFace className={`mt-0.5 h-4 w-4 shrink-0 ${access === "face_only" ? "text-fuchsia-400" : "text-muted-foreground"}`} />
        )}
        <div>
          <p className="text-sm font-semibold">สแกนหน้าก่อน</p>
          <p className="mt-0.5 text-xs text-muted-foreground">ดูได้เฉพาะรูปตัวเอง</p>
        </div>
      </button>
    </div>
  );
}
