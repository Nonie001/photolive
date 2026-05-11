"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { omise } from "@/lib/omise";
import { PLANS, YEARLY_PLANS } from "@/lib/plans";

function getAllPlans() {
  return [...PLANS, ...YEARLY_PLANS];
}

async function siteOrigin() {
  const h = await headers();
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function createOmiseCharge(formData: FormData): Promise<void> {
  const planId = String(formData.get("plan_id") ?? "");
  const plan = getAllPlans().find((p) => p.id === planId);
  if (!plan || plan.priceThb === 0) redirect("/dashboard/billing");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const origin = await siteOrigin();

  // Create pending order
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
    redirect("/dashboard/billing?error=order_failed");
  }

  // Create PromptPay source first (required by Omise API)
  const source = await omise.sources.create({
    type: "promptpay",
    amount: plan.priceThb * 100, // satang
    currency: "thb",
  });

  // Create Omise charge using the source
  const charge = await omise.charges.create({
    amount: plan.priceThb * 100,
    currency: "thb",
    source: source.id,
    return_uri: `${origin}/api/payment/callback?order_id=${order.id}`,
    metadata: {
      order_id: order.id,
      user_id: user.id,
      plan_id: plan.id,
    },
  });

  // Save charge id
  await admin
    .from("orders")
    .update({ omise_charge_id: charge.id })
    .eq("id", order.id);

  // Redirect to Omise payment page (QR code)
  redirect(charge.authorize_uri);
}

export async function createCardCharge(formData: FormData): Promise<void> {
  const planId = String(formData.get("plan_id") ?? "");
  const token = String(formData.get("omise_token") ?? "");

  const plan = getAllPlans().find((p) => p.id === planId);
  if (!plan || plan.priceThb === 0 || !token) redirect("/dashboard/billing");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const origin = await siteOrigin();
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

  if (orderErr || !order) redirect("/dashboard/billing?error=order_failed");

  const charge = await omise.charges.create({
    amount: plan.priceThb * 100,
    currency: "thb",
    card: token,
    return_uri: `${origin}/api/payment/callback?order_id=${order.id}`,
    metadata: {
      order_id: order.id,
      user_id: user.id,
      plan_id: plan.id,
    },
  });

  await admin
    .from("orders")
    .update({ omise_charge_id: charge.id })
    .eq("id", order.id);

  // Card can be immediately successful (no 3DS) or need 3DS redirect
  if (charge.status === "successful") {
    await admin.from("orders").update({ status: "successful" }).eq("id", order.id);
    await admin.rpc("subscribe_to_plan", {
      p_plan_id: plan.id,
      p_user_id: user.id,
    });
    redirect("/dashboard/billing?success=1");
  }

  if (charge.authorize_uri) {
    redirect(charge.authorize_uri);
  }

  await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
  redirect("/dashboard/billing?error=payment_failed");
}
