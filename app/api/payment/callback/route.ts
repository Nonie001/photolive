import { NextResponse, type NextRequest } from "next/server";
import { omise } from "@/lib/omise";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Omise payment callback — called by Omise after QR payment is scanned.
 * Also used as return_uri so the user lands here after completing payment.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const orderId = searchParams.get("order_id");

  if (!orderId) {
    return NextResponse.redirect(`${origin}/dashboard/billing?error=invalid`);
  }

  const admin = createAdminClient();

  // Load order
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, plan_id, omise_charge_id, status")
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.redirect(`${origin}/dashboard/billing?error=not_found`);
  }

  // Already processed
  if (order.status === "successful") {
    return NextResponse.redirect(`${origin}/dashboard/billing?success=1`);
  }

  // Verify charge with Omise
  let chargeStatus = "unknown";
  try {
    const charge = await omise.charges.retrieve(order.omise_charge_id);
    chargeStatus = charge.status;
  } catch {
    return NextResponse.redirect(`${origin}/dashboard/billing?error=verify_failed`);
  }

  if (chargeStatus === "pending") {
    // Payment not yet confirmed — user returned before bank processed QR scan
    return NextResponse.redirect(`${origin}/dashboard/billing?pending=1`);
  }

  if (chargeStatus !== "successful") {
    await admin.from("orders").update({ status: "failed" }).eq("id", orderId);
    return NextResponse.redirect(`${origin}/dashboard/billing?error=payment_failed`);
  }

  // Mark order successful
  await admin.from("orders").update({ status: "successful" }).eq("id", orderId);

  // Activate subscription via existing RPC
  await admin.rpc("subscribe_to_plan", {
    p_plan_id: order.plan_id,
    p_user_id: order.user_id,
  });

  return NextResponse.redirect(`${origin}/dashboard/billing?success=1`);
}
