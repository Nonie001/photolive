// Mirrors the rows seeded in supabase/migrations/0002_billing.sql.
// Used for UI rendering when DB is unreachable / SSR fallback.

export type PlanId = "free" | "basic" | "standard" | "pro";

export type PlanDef = {
  id: PlanId;
  name: string;
  storageBytes: number;
  durationDays: number | null; // null = no expiry
  priceThb: number;
  tagline: string;
  features: string[];
  highlight?: boolean;
};

const GB = 1024 * 1024 * 1024;

export const PLANS: PlanDef[] = [
  {
    id: "free",
    name: "Free",
    storageBytes: 1 * GB,
    durationDays: null,
    priceThb: 0,
    tagline: "ทดลองใช้งานก่อนตัดสินใจ",
    features: [
      "พื้นที่เก็บ 1 GB",
      "สร้างอีเวนต์ได้ไม่จำกัด",
      "อัปโหลดผ่านเว็บ + CLI",
      "QR Code + แกลเลอรีสาธารณะ",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    storageBytes: 5 * GB,
    durationDays: 30,
    priceThb: 299,
    tagline: "เหมาะกับงานเล็ก ๆ 1–2 งาน/เดือน",
    features: [
      "พื้นที่เก็บ 5 GB",
      "ใช้งาน 30 วัน",
      "AI ค้นหาด้วยใบหน้า",
      "ดาวน์โหลดทั้งอัลบั้ม (.zip)",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    storageBytes: 10 * GB,
    durationDays: 30,
    priceThb: 399,
    tagline: "ยอดนิยม — งานแต่ง / รับปริญญา",
    features: [
      "พื้นที่เก็บ 10 GB",
      "ใช้งาน 30 วัน",
      "AI ค้นหาด้วยใบหน้า",
      "Realtime upload จาก CLI",
      "ซัพพอร์ตทางอีเมล",
    ],
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    storageBytes: 30 * GB,
    durationDays: 30,
    priceThb: 599,
    tagline: "ช่างภาพมืออาชีพ / สตูดิโอ",
    features: [
      "พื้นที่เก็บ 30 GB",
      "ใช้งาน 30 วัน",
      "ทุกอย่างใน Standard",
      "Priority support",
      "เหมาะกับงานหลายงาน/เดือน",
    ],
  },
];

export function getPlan(id: string): PlanDef | undefined {
  return PLANS.find((p) => p.id === id);
}
