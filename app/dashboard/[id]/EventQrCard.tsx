"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check } from "lucide-react";

export function EventQrCard({ url, slug }: { url: string; slug: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-5">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-white p-2">
          <QRCodeSVG value={url} size={96} marginSize={0} level="M" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">QR สำหรับแขกสแกน</p>
          <p className="mt-1 truncate font-mono text-sm">/e/{slug}</p>
          <button
            type="button"
            onClick={copy}
            className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                คัดลอกแล้ว
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                คัดลอกลิงก์
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
