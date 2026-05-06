import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewEventForm } from "./NewEventForm";

export const metadata = { title: "สร้างอีเวนต์ใหม่ — PhotoLive" };

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับ
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">สร้างอีเวนต์ใหม่</h1>
      <NewEventForm />
    </div>
  );
}
