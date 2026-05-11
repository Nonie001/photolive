"use client";

import { useState } from "react";
import { Monitor, Apple, Download, X } from "lucide-react";

type DownloadItem = {
  label: string;
  filename: string;
  url: string;
  icon: React.ReactNode;
};

function ConfirmDownloadModal({
  item,
  onConfirm,
  onCancel,
}: {
  item: DownloadItem;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onCancel}
    >
      <div
        className="w-full rounded-t-3xl bg-background border border-border p-6 space-y-4 sm:w-full sm:max-w-sm sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/40">
              {item.icon}
            </div>
            <div>
              <p className="font-extrabold">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.filename}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          ติดตั้งโปรแกรมนี้ที่เครื่อง<strong className="text-foreground">ช่างภาพ</strong>เท่านั้น
          เมื่อเปิดโฟลเดอร์ รูปจะอัปโหลดขึ้นเว็บอัตโนมัติแบบเรียลไทม์
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-muted/40 transition-colors"
          >
            ยกเลิก
          </button>
          <a
            href={item.url}
            download
            onClick={onConfirm}
            className="flex flex-1 h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 text-sm font-bold text-white shadow-md shadow-fuchsia-500/20 transition-transform hover:scale-[1.01]"
          >
            <Download className="h-4 w-4" />
            ดาวน์โหลด
          </a>
        </div>
      </div>
    </div>
  );
}

export function SoftwareDownloads() {
  const [pending, setPending] = useState<DownloadItem | null>(null);

  const items: DownloadItem[] = [
    {
      label: "Windows",
      filename: "PhotoLive-Setup.exe",
      url: "https://github.com/Nonie001/photolive/releases/latest/download/PhotoLive-Setup.exe",
      icon: <Monitor className="h-5 w-5 text-blue-400" />,
    },
    {
      label: "macOS",
      filename: "PhotoLive.dmg",
      url: "https://github.com/Nonie001/photolive/releases/latest/download/PhotoLive.dmg",
      icon: <Apple className="h-5 w-5 text-muted-foreground" />,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setPending(item)}
            className="flex items-center gap-3 rounded-xl border border-border bg-background/50 px-4 py-3 text-sm transition-all hover:border-fuchsia-500/30 hover:bg-muted/40 text-left"
          >
            {item.icon}
            <div>
              <p className="font-semibold">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.filename}</p>
            </div>
          </button>
        ))}
      </div>

      {pending && (
        <ConfirmDownloadModal
          item={pending}
          onConfirm={() => setPending(null)}
          onCancel={() => setPending(null)}
        />
      )}
    </>
  );
}
