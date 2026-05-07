"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SubscribeState = { error: string | null; ok?: boolean };

export async function subscribeToPlan(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  const planId = String(formData.get("plan_id") ?? "");
  if (!planId) return { error: "ไม่พบแพ็กเกจ" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("subscribe_to_plan", {
    p_plan_id: planId,
  });
  if (error) {
    return { error: `สมัครไม่สำเร็จ: ${error.message}` };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/billing");
  return { error: null, ok: true };
}
