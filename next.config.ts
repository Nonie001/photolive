import type { NextConfig } from "next";

const r2PhotosHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_R2_PHOTOS_URL
      ? new URL(process.env.NEXT_PUBLIC_R2_PHOTOS_URL).hostname
      : undefined;
  } catch {
    return undefined;
  }
})();

const r2ThumbsHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_R2_THUMBS_URL
      ? new URL(process.env.NEXT_PUBLIC_R2_THUMBS_URL).hostname
      : undefined;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(r2PhotosHost ? [{ protocol: "https" as const, hostname: r2PhotosHost }] : []),
      ...(r2ThumbsHost ? [{ protocol: "https" as const, hostname: r2ThumbsHost }] : []),
      // fallback for custom R2 domains
      { protocol: "https" as const, hostname: "*.r2.dev" },
    ],
  },
  experimental: {
    serverActions: {
      // Allow large photo uploads (default is 1MB).
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
