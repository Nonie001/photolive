"use client";

import { useActionState } from "react";
import { createEvent, type CreateEventState } from "../actions";

const initialState: CreateEventState = { error: null };

export function NewEventForm() {
  const [state, formAction, pending] = useActionState(createEvent, initialState);

  return (
    <form action={formAction} className="space-y-4">
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
          className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base outline-none focus:border-foreground"
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
          className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base outline-none focus:border-foreground"
          disabled={pending}
        />
      </div>
      {state.error && (
        <p className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {pending ? "กำลังสร้าง..." : "สร้างอีเวนต์"}
      </button>
    </form>
  );
}
