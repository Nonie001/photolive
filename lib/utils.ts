import { customAlphabet } from "nanoid";

const slugAlphabet = "abcdefghijkmnpqrstuvwxyz23456789"; // no 0/o/1/l for readability
const slugGenerator = customAlphabet(slugAlphabet, 8);

export function generateEventSlug(): string {
  return slugGenerator();
}

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

export function eventPublicUrl(slug: string): string {
  return `${siteUrl()}/e/${slug}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
