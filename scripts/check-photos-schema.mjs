import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Try to get one row to see columns
const { data, error } = await admin.from("photos").select("*").limit(1);
console.log("photos rows:", data);
console.log("error:", error);

// Try inserting a dummy to see what columns it expects
console.log("\n--- attempting test insert ---");
const { data: ins, error: insErr } = await admin
  .from("photos")
  .insert({
    event_id: "aa0af731-57c1-49ee-b2bb-9bfe239a3515",
    storage_path: "test/dummy.jpg",
    thumb_path: "test/dummy.jpg",
    width: 100,
    height: 100,
  })
  .select();
console.log("insert result:", ins);
console.log("insert error:", insErr);

if (ins && ins[0]) {
  console.log("\n--- columns found:", Object.keys(ins[0]));
  // cleanup
  await admin.from("photos").delete().eq("id", ins[0].id);
}
