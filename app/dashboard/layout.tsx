import Link from "next/link";
import Image from "next/image";
import { LogOut, CreditCard } from "lucide-react";
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
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute -right-60 -top-60 h-[500px] w-[500px] rounded-full bg-fuchsia-500/8 blur-3xl" />
      <div className="pointer-events-none absolute -left-60 bottom-0 h-[500px] w-[500px] rounded-full bg-orange-500/8 blur-3xl" />
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3.5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold"
          >
            <Image src="/icon.png" width={32} height={32} alt="PhotoLive" className="h-8 w-8 rounded-lg" />
            <span className="bg-gradient-to-r from-fuchsia-400 via-rose-400 to-orange-400 bg-clip-text text-transparent">PhotoLive</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/billing"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm transition-colors hover:bg-muted"
            >
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">แพ็กเกจ</span>
            </Link>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {user?.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm transition-colors hover:bg-muted"
              >
                <LogOut className="h-4 w-4" />
                ออก
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}
