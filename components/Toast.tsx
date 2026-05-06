"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";
type Toast = { id: number; message: string; variant: ToastVariant };

type Ctx = {
  show: (message: string, variant?: ToastVariant) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => setToasts((p) => p.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const Icon = toast.variant === "success" ? CheckCircle : toast.variant === "error" ? XCircle : Info;
  const cls =
    toast.variant === "success"
      ? "border-green-300 bg-green-50 text-green-900 dark:border-green-900/50 dark:bg-green-950/80 dark:text-green-100"
      : toast.variant === "error"
        ? "border-red-300 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/80 dark:text-red-100"
        : "border-border bg-background text-foreground";
  return (
    <div
      className={`pointer-events-auto flex max-w-md items-center gap-2 rounded-full border px-4 py-2.5 text-sm shadow-lg backdrop-blur transition-all duration-200 ${cls} ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{toast.message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
