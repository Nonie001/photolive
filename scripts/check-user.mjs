// Quick diagnostic: check if the user is properly configured in Supabase Auth.
// Run with: node --env-file=.env.local scripts/check-user.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await admin.auth.admin.listUsers();
if (error) {
  console.error("listUsers failed:", error);
  process.exit(1);
}

console.log(`Total users: ${data.users.length}\n`);
for (const u of data.users) {
  console.log(`Email:          ${u.email}`);
  console.log(`ID:             ${u.id}`);
  console.log(`Confirmed at:   ${u.email_confirmed_at ?? "❌ NOT CONFIRMED"}`);
  console.log(`Last sign in:   ${u.last_sign_in_at ?? "never"}`);
  console.log(`Created:        ${u.created_at}`);
  console.log(`Providers:      ${u.app_metadata?.providers?.join(", ") ?? "?"}`);
  console.log("");
}
