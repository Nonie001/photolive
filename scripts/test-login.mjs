// Test password login directly against Supabase (no browser needed).
// Usage: node --env-file=.env.local scripts/test-login.mjs <email> <password>
import { createClient } from "@supabase/supabase-js";

const [, , email, password] = process.argv;
if (!email || !password) {
  console.error("Usage: node scripts/test-login.mjs <email> <password>");
  process.exit(1);
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } },
);

const { data, error } = await sb.auth.signInWithPassword({ email, password });
if (error) {
  console.error("❌ LOGIN FAILED:", error.message);
  console.error("   Status:", error.status);
  process.exit(1);
}
console.log("✅ LOGIN SUCCESS");
console.log("   User ID:", data.user.id);
console.log("   Email:  ", data.user.email);
console.log("   Token:  ", data.session.access_token.slice(0, 30) + "...");
