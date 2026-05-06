import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, key);

console.log("=== STORAGE BUCKETS ===");
const { data: buckets, error: bErr } = await admin.storage.listBuckets();
if (bErr) console.error("Error:", bErr);
else console.log(buckets.map((b) => `${b.name} (public=${b.public})`));

console.log("\n=== PHOTOS TABLE (last 5) ===");
const { data: photos, error: pErr } = await admin
  .from("photos")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(5);
if (pErr) console.error("Error:", pErr);
else console.log(photos);

console.log("\n=== EVENTS TABLE ===");
const { data: events, error: eErr } = await admin
  .from("events")
  .select("id, name, slug, owner_id");
if (eErr) console.error("Error:", eErr);
else console.log(events);
