"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteEvent } from "../actions";

export function DeleteEventButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function onDelete() {
    const confirmed = window.confirm(
      `ลบอีเวนต์ "${name}" และรูปทั้งหมดถาวร?`,
    );
    if (!confirmed) return;
    setConfirming(true);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await deleteEvent(fd);
    });
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending || confirming}
      className="inline-flex h-10 items-center gap-1.5 rounded-full bg-red-600 px-4 text-sm font-medium text-white disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
      {pending ? "กำลังลบ..." : "ลบอีเวนต์"}
    </button>
  );
}
