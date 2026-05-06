// Set a known password for testing.
// Usage: node --env-file=.env.local scripts/set-password.mjs <email> <newPassword>
import { createClient } from "@supabase/supabase-js";

const [, , email, password] = process.argv;
if (!email || !password) {
  console.error("Usage: node scripts/set-password.mjs <email> <password>");
  process.exit(1);
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: list, error: listErr } = await admin.auth.admin.listUsers();
if (listErr) throw listErr;
const user = list.users.find((u) => u.email === email);
if (!user) {
  console.error(`User ${email} not found`);
  process.exit(1);
}

const { error } = await admin.auth.admin.updateUserById(user.id, {
  password,
  email_confirm: true,
});
if (error) {
  console.error("updateUserById failed:", error);
  process.exit(1);
}
console.log(`✅ Password updated for ${email}`);
console.log(`   New password: ${password}`);
console.log(`   Try logging in at http://localhost:3000/login`);
