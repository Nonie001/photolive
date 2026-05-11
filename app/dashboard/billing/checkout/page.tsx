import Link from "next/link";
import Script from "next/script";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PLANS, YEARLY_PLANS } from "@/lib/plans";
import { CheckoutForm } from "./CheckoutForm";

function getAllPlans() {
  return [...PLANS, ...YEARLY_PLANS];
}

export const metadata = { title: "ชำระเงิน — PhotoLive" };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan_id?: string }>;
}) {
  const { plan_id } = await searchParams;
  const plan = getAllPlans().find((p) => p.id === plan_id);
  if (!plan || plan.priceThb === 0) redirect("/dashboard/billing");

  // Pass public key via prop so it renders on client without NEXT_PUBLIC_ prefix
  const publicKey = process.env.OMISE_PUBLIC_KEY ?? "";

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับ
        </Link>
        <p className="mt-4 bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 bg-clip-text text-xs font-semibold uppercase tracking-wider text-transparent">
          ชำระเงิน
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">สรุปคำสั่งซื้อ</h1>
      </div>

      {/* Plan summary */}
      <div className="rounded-2xl border border-border bg-muted/20 p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">แพ็กเกจที่เลือก</p>
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">{plan!.name}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{plan!.tagline}</p>
          </div>
          <span className="shrink-0 text-2xl font-extrabold">
            ฿{plan!.priceThb.toLocaleString()}
          </span>
        </div>
      </div>

      <CheckoutForm plan={plan!} publicKey={publicKey} />
      <Script src="https://cdn.omise.co/omise.js" strategy="lazyOnload" />
    </div>
  );
}
