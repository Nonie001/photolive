// Mirrors the rows seeded in supabase/migrations/0002_billing.sql.
// Used for UI rendering when DB is unreachable / SSR fallback.

export type PlanId = "free" | "starter" | "pro" | "ultra";

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
const MB = 1024 * 1024;

const ALL_FEATURES = [
  "อัปโหลดผ่านเว็บ + Desktop App",
  "QR Code + แกลเลอรีสาธารณะ",
  "AI ค้นหาด้วยใบหน้า",
  "Realtime upload จาก Desktop App",
  "ดาวน์โหลดทั้งอัลบั้ม (.zip)",
  "ซัพพอร์ตทางอีเมล",
];

export const PLANS: PlanDef[] = [
  {
    id: "free",
    name: "Free",
    storageBytes: 150 * MB,
    durationDays: null,
    priceThb: 0,
    tagline: "ทดลองใช้งานก่อนตัดสินใจ",
    features: ["พื้นที่เก็บ 150 MB", "ไม่มีวันหมดอายุ", ...ALL_FEATURES],
  },
  {
    id: "starter",
    name: "Starter",
    storageBytes: 5 * GB,
    durationDays: 14,
    priceThb: 399,
    tagline: "เหมาะกับงานเล็ก ๆ หรืองานครั้งเดียว",
    features: ["พื้นที่เก็บ 5 GB", "ใช้งาน 14 วัน", ...ALL_FEATURES],
  },
  {
    id: "pro",
    name: "Pro",
    storageBytes: 10 * GB,
    durationDays: 30,
    priceThb: 699,
    tagline: "ยอดนิยม — งานแต่ง / รับปริญญา",
    features: ["พื้นที่เก็บ 10 GB", "ใช้งาน 30 วัน", ...ALL_FEATURES],
    highlight: true,
  },
  {
    id: "ultra",
    name: "Ultra",
    storageBytes: 30 * GB,
    durationDays: 30,
    priceThb: 1290,
    tagline: "ช่างภาพมืออาชีพ / สตูดิโอ",
    features: ["พื้นที่เก็บ 30 GB", "ใช้งาน 30 วัน", ...ALL_FEATURES],
  },
];

export function getPlan(id: string): PlanDef | undefined {
  return PLANS.find((p) => p.id === id);
}
