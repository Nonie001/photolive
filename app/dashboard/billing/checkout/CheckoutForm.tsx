"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { CreditCard, QrCode, Loader2, AlertTriangle, ShieldCheck, CheckCircle2, ExternalLink } from "lucide-react";
import type { PlanDef } from "@/lib/plans";

declare global {
  interface Window {
    Omise: {
      setPublicKey: (key: string) => void;
      createToken: (
        type: string,
        data: {
          name: string;
          number: string;
          expiration_month: number;
          expiration_year: number;
          security_code: string;
        },
        callback: (
          statusCode: number,
          response: { object: string; id?: string; message?: string },
        ) => void,
      ) => void;
    };
  }
}

type ChargeResult =
  | { status: "success"; redirect: string }
  | { status: "pending"; order_id: string; charge_id: string; authorize_uri: string | null; qr_image_url: string | null }
  | { error: string };

export function CheckoutForm({
  plan,
  publicKey,
}: {
  plan: PlanDef;
  publicKey: string;
}) {
  const [tab, setTab] = useState<"card" | "promptpay">("card");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<{ imageUrl: string | null; authorizeUri: string | null; orderId: string } | null>(null);

  const tokenizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, " ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  async function submitCharge(method: "promptpay" | "card", token?: string) {
    setLoading(true);
    setError(null);

    const body: Record<string, string> = { plan_id: plan.id, method };
    if (token) body.token = token;

    const res = await fetch("/api/payment/create-charge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as ChargeResult;
    setLoading(false);

    if ("error" in data) {
      setError(data.error);
      return;
    }

    if (data.status === "success") {
      window.location.href = data.redirect;
      return;
    }

    // pending — show QR or redirect to Omise page
    if (data.qr_image_url) {
      setQrData({ imageUrl: data.qr_image_url, authorizeUri: data.authorize_uri, orderId: data.order_id });
    } else if (data.authorize_uri) {
      window.location.href = data.authorize_uri;
    } else {
      setError("ไม่สามารถสร้าง QR Code ได้ กรุณาลองใหม่");
    }
  }

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.Omise) {
      setError("OmiseJS ยังโหลดไม่เสร็จ — กรุณารอสักครู่แล้วลองใหม่");
      return;
    }
    setError(null);
    setLoading(true);

    const [expMonth, expYear] = expiry.split("/").map((s) => s.trim());

    if (tokenizeTimeoutRef.current) clearTimeout(tokenizeTimeoutRef.current);
    tokenizeTimeoutRef.current = setTimeout(() => {
      setLoading(false);
      setError("หมดเวลาเชื่อมต่อ Omise — กรุณาลองใหม่");
    }, 15000);

    window.Omise.setPublicKey(publicKey);
    window.Omise.createToken(
      "card",
      {
        name: cardName,
        number: cardNumber.replace(/\s/g, ""),
        expiration_month: Number(expMonth),
        expiration_year: Number("20" + expYear),
        security_code: cvv,
      },
      (_, response) => {
        if (tokenizeTimeoutRef.current) clearTimeout(tokenizeTimeoutRef.current);
        if (response.object === "error" || !response.id) {
          setError(response.message ?? "ข้อมูลบัตรไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
          setLoading(false);
        } else {
          submitCharge("card", response.id);
        }
      },
    );
  };

  // QR Code view
  if (qrData) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-muted/20 p-6 text-center">
          <p className="mb-4 text-sm font-semibold">สแกน QR Code เพื่อชำระเงิน</p>
          {qrData.imageUrl ? (
            <div className="mx-auto w-fit rounded-xl bg-white p-4">
              <Image
                src={qrData.imageUrl}
                alt="PromptPay QR Code"
                width={220}
                height={220}
                unoptimized
              />
            </div>
          ) : (
            <QrCode className="mx-auto h-24 w-24 text-muted-foreground" />
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            เปิด mobile banking แล้วสแกน QR Code ด้านบน
          </p>
          {qrData.authorizeUri && (
            <a
              href={qrData.authorizeUri}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              เปิดในหน้าใหม่
            </a>
          )}
        </div>

        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-700/50 dark:bg-yellow-950/30 dark:text-yellow-300">
          <p className="font-semibold">รอการยืนยัน</p>
          <p className="mt-0.5 text-yellow-700 dark:text-yellow-400">
            หลังสแกนและชำระเงินแล้ว แพ็กเกจจะเปิดใช้งานอัตโนมัติภายในไม่กี่นาที
          </p>
        </div>

        <a
          href="/dashboard/billing"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-border bg-background text-sm hover:bg-muted"
        >
          <CheckCircle2 className="h-4 w-4" />
          ชำระแล้ว กลับหน้าแพ็กเกจ
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Payment method tabs */}
      <div className="flex overflow-hidden rounded-xl border border-border">
        <button
          type="button"
          onClick={() => setTab("card")}
          className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            tab === "card"
              ? "bg-foreground text-background"
              : "bg-muted/30 text-muted-foreground hover:text-foreground"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          บัตรเครดิต/เดบิต
        </button>
        <button
          type="button"
          onClick={() => setTab("promptpay")}
          className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            tab === "promptpay"
              ? "bg-foreground text-background"
              : "bg-muted/30 text-muted-foreground hover:text-foreground"
          }`}
        >
          <QrCode className="h-4 w-4" />
          PromptPay
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Card form */}
      {tab === "card" && (
        <form onSubmit={handleCardSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">ชื่อบนบัตร</label>
            <input
              type="text"
              placeholder="JOHN DOE"
              value={cardName}
              onChange={(e) => setCardName(e.target.value.toUpperCase())}
              required
              autoComplete="cc-name"
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">หมายเลขบัตร</label>
            <input
              type="text"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              required
              maxLength={19}
              inputMode="numeric"
              autoComplete="cc-number"
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">วันหมดอายุ</label>
              <input
                type="text"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                required
                maxLength={5}
                inputMode="numeric"
                autoComplete="cc-exp"
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">CVV</label>
              <input
                type="password"
                placeholder="•••"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                required
                maxLength={4}
                inputMode="numeric"
                autoComplete="cc-csc"
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 text-sm font-bold text-white shadow-md disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            ชำระเงิน ฿{plan.priceThb.toLocaleString()}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>ปลอดภัยด้วย Omise — ข้อมูลบัตรไม่ผ่านเซิร์ฟเวอร์ของเรา</span>
          </div>
        </form>
      )}

      {/* PromptPay tab */}
      {tab === "promptpay" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/20 p-6 text-center">
            <QrCode className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-sm font-medium">ชำระผ่าน PromptPay</p>
            <p className="mt-1 text-xs text-muted-foreground">
              กดปุ่มด้านล่างเพื่อสร้าง QR Code สำหรับสแกนจ่ายผ่าน mobile banking
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => submitCharge("promptpay")}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-rose-400 to-orange-400 text-sm font-bold text-white shadow-md disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
            รับ QR Code ฿{plan.priceThb.toLocaleString()}
          </button>
        </div>
      )}
    </div>
  );
}
