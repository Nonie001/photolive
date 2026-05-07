import Link from "next/link";
import { Camera, LogOut, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold"
          >
            <Camera className="h-5 w-5" />
            <span>PhotoLive</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/billing"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm"
            >
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">แพ็กเกจ</span>
            </Link>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user?.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm"
              >
                <LogOut className="h-4 w-4" />
                ออก
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
