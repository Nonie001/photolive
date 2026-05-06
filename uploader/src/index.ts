#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import { run } from "./watcher.js";

const program = new Command();

program
  .name("photolive-upload")
  .description("Watch a folder and upload photos to a PhotoLive event")
  .requiredOption("-e, --event <slug>", "event slug")
  .requiredOption("-f, --folder <path>", "folder to watch")
  .option("-c, --concurrency <n>", "parallel uploads", "3")
  .option("-t, --thumb-size <px>", "thumbnail longest edge", "800")
  .option("-q, --quality <n>", "thumbnail JPEG quality (0-100)", "80")
  .parse(process.argv);

const opts = program.opts<{
  event: string;
  folder: string;
  concurrency: string;
  thumbSize: string;
  quality: string;
}>();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.example)",
  );
  process.exit(1);
}

run({
  supabaseUrl,
  supabaseKey,
  eventSlug: opts.event,
  folder: opts.folder,
  concurrency: Number(opts.concurrency),
  thumbSize: Number(opts.thumbSize),
  quality: Number(opts.quality),
}).catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
