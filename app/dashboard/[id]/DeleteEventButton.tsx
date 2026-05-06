"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteEvent } from "../actions";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function DeleteEventButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function onConfirm() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await deleteEvent(fd);
      // Server action redirects on success.
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
        {pending ? "กำลังลบ..." : "ลบอีเวนต์"}
      </button>
      <ConfirmDialog
        open={open}
        title={`ลบอีเวนต์ "${name}"?`}
        description="รูปทั้งหมดจะถูกลบถาวร ไม่สามารถกู้คืนได้"
        confirmLabel="ลบถาวร"
        cancelLabel="ยกเลิก"
        variant="danger"
        pending={pending}
        onConfirm={onConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
