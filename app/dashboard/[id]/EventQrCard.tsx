"use client";

import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Download } from "lucide-react";

export function EventQrCard({ url, slug }: { url: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  function downloadQr() {
    const svg = qrRef.current;
    if (!svg) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `qr-${slug}.png`;
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(serialized)));
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-5 transition-all hover:border-fuchsia-500/20">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-white p-2">
          <QRCodeSVG ref={qrRef} value={url} size={96} marginSize={0} level="M" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 bg-clip-text text-xs font-semibold uppercase tracking-wider text-transparent">QR สำหรับแขกสแกน</p>
          <p className="mt-1 truncate font-mono text-sm font-semibold">/e/{slug}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs"
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
            <button
              type="button"
              onClick={downloadQr}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              บันทึก QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
