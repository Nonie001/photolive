/**
 * One-time script: delete all files from Supabase Storage (photos + thumbs).
 * Run after migrating to R2.
 *
 * Usage:
 *   node scripts/clear-supabase-storage.mjs
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function clearBucket(bucket) {
  console.log(`\nClearing bucket: ${bucket}`);
  let totalDeleted = 0;

  // List all "folders" (event IDs) first
  const { data: folders, error: listErr } = await supabase.storage
    .from(bucket)
    .list("", { limit: 1000 });

  if (listErr) {
    console.error(`  Error listing ${bucket}:`, listErr.message);
    return;
  }
  if (!folders || folders.length === 0) {
    console.log(`  Already empty.`);
    return;
  }

  for (const folder of folders) {
    const prefix = folder.name;
    const { data: files, error: filesErr } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit: 1000 });

    if (filesErr || !files || files.length === 0) continue;

    const paths = files.map((f) => `${prefix}/${f.name}`);
    const { error: delErr } = await supabase.storage.from(bucket).remove(paths);
    if (delErr) {
      console.error(`  Error deleting from ${prefix}:`, delErr.message);
    } else {
      totalDeleted += paths.length;
      console.log(`  Deleted ${paths.length} files from ${prefix}/`);
    }
  }

  console.log(`  Total deleted: ${totalDeleted} files`);
}

await clearBucket("photos");
await clearBucket("thumbs");
console.log("\nDone!");
