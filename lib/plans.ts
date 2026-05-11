// Mirrors the rows seeded in supabase/migrations/0002_billing.sql + 0005_yearly_plans.sql.
// Used for UI rendering when DB is unreachable / SSR fallback.

export type BillingPeriod = "monthly" | "yearly";

export type PlanId =
  | "free"
  | "starter"
  | "pro" | "pro_yearly"
  | "ultra" | "ultra_yearly";

export type PlanDef = {
  id: PlanId;
  name: string;
  storageBytes: number;
  durationDays: number | null; // null = no expiry
  priceThb: number;
  /** Per-month equivalent price shown for yearly plans */
  monthlyEquivThb?: number;
  /** Discount percentage versus buying monthly × 12 */
  savingsPct?: number;
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

/** Monthly plans — backward-compatible default */
export const PLANS: PlanDef[] = [
  {
    id: "free",
    name: "Free",
    storageBytes: 500 * MB,
    durationDays: null,
    priceThb: 0,
    tagline: "ทดลองใช้งานก่อนตัดสินใจ",
    features: ["พื้นที่เก็บ 500 MB", "ไม่มีวันหมดอายุ", ...ALL_FEATURES],
  },
  {
    id: "starter",
    name: "Basic",
    storageBytes: 5 * GB,
    durationDays: 14,
    priceThb: 349,
    tagline: "เหมาะกับงานเล็ก ๆ หรืองานครั้งเดียว",
    features: ["พื้นที่เก็บ 5 GB", "ใช้งาน 14 วัน", ...ALL_FEATURES],
  },
  {
    id: "pro",
    name: "Pro",
    storageBytes: 15 * GB,
    durationDays: 30,
    priceThb: 699,
    tagline: "ยอดนิยม — งานแต่ง / รับปริญญา",
    features: ["พื้นที่เก็บ 15 GB", "ใช้งาน 30 วัน", ...ALL_FEATURES],
    highlight: true,
  },
  {
    id: "ultra",
    name: "Ultra",
    storageBytes: 40 * GB,
    durationDays: 30,
    priceThb: 1190,
    tagline: "ช่างภาพมืออาชีพ / สตูดิโอ",
    features: ["พื้นที่เก็บ 40 GB", "ใช้งาน 30 วัน", ...ALL_FEATURES],
  },
];

/** Yearly plans — Pro and Ultra only */
export const YEARLY_PLANS: PlanDef[] = [
  {
    id: "pro_yearly",
    name: "Pro",
    storageBytes: 15 * GB,
    durationDays: 365,
    priceThb: 6999,
    monthlyEquivThb: 583,
    savingsPct: 17,
    tagline: "ยอดนิยม — ช่างภาพ full-time",
    features: ["พื้นที่เก็บ 15 GB", "ใช้งาน 1 ปี (365 วัน)", ...ALL_FEATURES],
    highlight: true,
  },
  {
    id: "ultra_yearly",
    name: "Ultra",
    storageBytes: 40 * GB,
    durationDays: 365,
    priceThb: 12999,
    monthlyEquivThb: 1083,
    savingsPct: 16,
    tagline: "สตูดิโอและทีมช่างภาพมืออาชีพ",
    features: ["พื้นที่เก็บ 40 GB", "ใช้งาน 1 ปี (365 วัน)", ...ALL_FEATURES],
  },
];

export function getPlansByPeriod(period: BillingPeriod): PlanDef[] {
  return period === "yearly" ? YEARLY_PLANS : PLANS;
}

export function getPlan(id: string): PlanDef | undefined {
  return [...PLANS, ...YEARLY_PLANS].find((p) => p.id === id);
}
