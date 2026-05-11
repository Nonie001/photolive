import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewEventForm } from "./NewEventForm";

export const metadata = { title: "สร้างอีเวนต์ใหม่ — PhotoLive" };

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับ
      </Link>
      <div>
        <p className="bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 bg-clip-text text-xs font-semibold uppercase tracking-wider text-transparent">อีเวนต์</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">สร้างอีเวนต์ใหม่</h1>
      </div>
      <div className="rounded-2xl border border-border bg-muted/20 p-6">
        <NewEventForm />
      </div>
    </div>
  );
}
