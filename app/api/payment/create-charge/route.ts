import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { omise } from "@/lib/omise";
import { PLANS, YEARLY_PLANS } from "@/lib/plans";
import { headers } from "next/headers";

function getAllPlans() {
  return [...PLANS, ...YEARLY_PLANS];
}

async function siteOrigin(req: NextRequest) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { plan_id, method } = body as { plan_id: string; method: "promptpay" | "card"; token?: string };

  const plan = getAllPlans().find((p) => p.id === plan_id);
  if (!plan || plan.priceThb === 0) {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const origin = await siteOrigin(request);
  const admin = createAdminClient();

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      plan_id: plan.id,
      amount_thb: plan.priceThb,
      status: "pending",
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "order_failed" }, { status: 500 });
  }

  const returnUri = `${origin}/api/payment/callback?order_id=${order.id}`;

  try {
    let charge: Record<string, unknown>;

    if (method === "promptpay") {
      const source = await omise.sources.create({
        type: "promptpay",
        amount: plan.priceThb * 100,
        currency: "thb",
      });

      charge = await omise.charges.create({
        amount: plan.priceThb * 100,
        currency: "thb",
        source: source.id,
        return_uri: returnUri,
        metadata: { order_id: order.id, user_id: user.id, plan_id: plan.id },
      });
    } else {
      // card — token passed from OmiseJS
      const token = body.token as string;
      if (!token) return NextResponse.json({ error: "missing_token" }, { status: 400 });

      charge = await omise.charges.create({
        amount: plan.priceThb * 100,
        currency: "thb",
        card: token,
        return_uri: returnUri,
        metadata: { order_id: order.id, user_id: user.id, plan_id: plan.id },
      });
    }

    await admin.from("orders").update({ omise_charge_id: charge.id }).eq("id", order.id);

    // Card immediately successful
    if (charge.status === "successful") {
      await admin.from("orders").update({ status: "successful" }).eq("id", order.id);
      await admin.rpc("subscribe_to_plan", { p_plan_id: plan.id, p_user_id: user.id });
      return NextResponse.json({ status: "success", redirect: "/dashboard/billing?success=1" });
    }

    // PromptPay or 3DS — return QR image URL + authorize_uri
    const source = (charge.source ?? {}) as Record<string, unknown>;
    const scannableCode = (source.scannable_code ?? {}) as Record<string, unknown>;
    const image = (scannableCode.image ?? {}) as Record<string, unknown>;
    const qrImageUrl = (image.download_uri ?? image.uri ?? null) as string | null;

    return NextResponse.json({
      status: "pending",
      order_id: order.id,
      charge_id: charge.id,
      authorize_uri: charge.authorize_uri ?? null,
      qr_image_url: qrImageUrl,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
