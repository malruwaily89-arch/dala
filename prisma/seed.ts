import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * مولّد أرقام عشوائية حتمي (Mulberry32) — يُنتج نفس البيانات عند كل تشغيل
 * لتسهيل التحقق الحسابي من التقارير (قابلية التكرار).
 */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;
function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function pick<T>(rng: Rng, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
function round5(n: number): number {
  return Math.round(n / 5) * 5;
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genBookingCode(rng: Rng, used: Set<string>): string {
  for (;;) {
    let code = "";
    for (let i = 0; i < 6; i++) code += CODE_ALPHABET[Math.floor(rng() * CODE_ALPHABET.length)];
    const full = `SY-${code}`;
    if (!used.has(full)) {
      used.add(full);
      return full;
    }
  }
}

// ===== كتالوج الخدمات (الأسعار ضمن النطاقات المطلوبة) =====
const SERVICE_CATALOG = [
  { name: "قص شعر", duration: 45, min: 80, max: 150 },
  { name: "صبغة", duration: 120, min: 200, max: 500 },
  { name: "بروتين", duration: 150, min: 300, max: 800 },
  { name: "تنظيف بشرة", duration: 60, min: 150, max: 300 },
  { name: "ليزر", duration: 60, min: 500, max: 1500 },
  { name: "مكياج", duration: 90, min: 200, max: 600 },
  { name: "مانيكير وبديكير", duration: 60, min: 50, max: 150 },
];

const STAFF_POOL = [
  "نورة", "ريم", "سارة", "منى", "هند", "عبير", "لجين", "شهد",
  "رغد", "أمل", "دانة", "لمى", "جود", "رهف", "مي", "تالا",
];

const CUSTOMER_POOL = [
  "هيفاء", "لمياء", "دلال", "منيرة", "عبير", "نوف", "غادة", "ريما",
  "مها", "سلطانة", "البندري", "وجدان", "أسماء", "حصة", "شوق", "لطيفة",
  "موضي", "عائشة", "زينب", "فاطمة", "حنان", "مريم", "جوهرة", "سارة",
];

const RATING_COMMENTS = [
  "خدمة رائعة وموظفات محترفات 🌸",
  "تجربة ممتازة، سأعود بالتأكيد.",
  "النتيجة أكثر من رائعة، شكراً لكن.",
  "دقة في المواعيد ونظافة عالية.",
  "أفضل صالون جربته، النتيجة طبيعية جداً.",
  "استقبال راقٍ وأسعار مناسبة.",
  "تعامل لطيف وإتقان في الشغل.",
  "المواعيد منضبطة وما فيه انتظار طويل.",
  "شغل متقن والمنتج ممتاز على الشعر.",
  "أحببت النتيجة، وأوصي فيه صديقاتي.",
  "مكان نظيف ومرتّب وأجواء هادئة.",
  "خدمة العميل ممتازة والتزام تام بالموعد.",
  "نتيجة مرضية جداً وسعر عادل.",
  null, null, null,
];

// ===== توزيع الحالات لكل صالون =====
type StatusPlan = {
  status: string; // done | no_show | cancelled | confirmed | pending_deposit
  daysMin: number;
  daysMax: number;
  deposit: "paid" | "none" | "unpaid";
};

const PLAN_PRICES: Record<string, number> = {
  BASIC: 300,
  PRO: 600,
  ADVANCED: 1200,
  BASIC_PRO: 299,
  PRO_PRO: 599,
  ADVANCED_PRO: 1299,
};

const SALONS = [
  { name: "صالون نور", slug: "noor-salon", plan: "PRO_PRO", staffCount: 5, city: "الرياض", phone: "0502222222", brandColor: "#be185d" },
  { name: "صالون ليان", slug: "liyan-salon", plan: "BASIC", staffCount: 2, city: "جدة", phone: "0501111111", brandColor: "#0e7490" },
  { name: "صالون أمل", slug: "amal-salon", plan: "ADVANCED", staffCount: 8, city: "الدمام", phone: "0503333333", brandColor: "#7c3aed" },
];

function buildStatusPlan(): StatusPlan[] {
  const plan: StatusPlan[] = [];
  // 22 مكتملة (past) — غالبها بعربون مدفوع
  for (let i = 0; i < 22; i++) {
    plan.push({ status: "done", daysMin: -90, daysMax: -1, deposit: i % 5 === 0 ? "none" : "paid" });
  }
  // 3 لم تحضر (past) — 2 بعربون مدفوع و1 بلا عربون
  plan.push({ status: "no_show", daysMin: -90, daysMax: -1, deposit: "paid" });
  plan.push({ status: "no_show", daysMin: -90, daysMax: -1, deposit: "paid" });
  plan.push({ status: "no_show", daysMin: -90, daysMax: -1, deposit: "none" });
  // 3 ملغية (past) — بلا عربون
  for (let i = 0; i < 3; i++) {
    plan.push({ status: "cancelled", daysMin: -90, daysMax: -1, deposit: "none" });
  }
  // 6 مؤكدة مستقبلية (5-10 أيام قادمة) — بعربون مدفوع
  for (let i = 0; i < 6; i++) {
    plan.push({ status: "confirmed", daysMin: 1, daysMax: 10, deposit: "paid" });
  }
  // 2 بانتظار العربون مستقبلياً (عربون غير مدفوع بعد)
  for (let i = 0; i < 2; i++) {
    plan.push({ status: "pending_deposit", daysMin: 1, daysMax: 4, deposit: "unpaid" });
  }
  return plan;
}

async function seedSalon(
  salon: (typeof SALONS)[number],
  salonIndex: number,
  usedCodes: Set<string>
) {
  const rng = mulberry32(salonIndex * 1000 + 1);
  const now = new Date();

  const tenant = await db.tenant.create({
    data: {
      name: salon.name,
      slug: salon.slug,
      phone: salon.phone,
      city: salon.city,
      plan: salon.plan.toLowerCase(),
      brandColor: salon.brandColor,
    },
  });

  // مالكة الصالون
  await db.user.create({
    data: {
      tenantId: tenant.id,
      email: `owner@${salon.slug}.sa`,
      passwordHash: hashPassword("123456"),
      name: `مالكة ${salon.name}`,
      role: "OWNER",
    },
  });

  // الاشتراك + دفعة مدفوعة
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const subscription = await db.subscription.create({
    data: {
      tenantId: tenant.id,
      plan: salon.plan,
      status: "active",
      startedAt: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
  });
  await db.payment.create({
    data: {
      tenantId: tenant.id,
      subscriptionId: subscription.id,
      amount: PLAN_PRICES[salon.plan],
      currency: "SAR",
      status: "paid",
      provider: "moyasar",
      providerRef: `moy_${tenant.id.slice(-6)}_prev`,
      paidAt: new Date(now.getFullYear(), now.getMonth() - 1, 5),
      createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    },
  });

  // الخدمات
  const services: { id: string; name: string; price: number; duration: number; deposit: number }[] = [];
  for (const s of SERVICE_CATALOG) {
    const price = round5(s.min + rng() * (s.max - s.min));
    const deposit = Math.round(price * 0.2); // 20% عربون
    const created = await db.service.create({
      data: {
        tenantId: tenant.id,
        name: s.name,
        durationMinutes: s.duration,
        price,
        depositAmount: deposit,
      },
    });
    services.push({ id: created.id, name: s.name, price, duration: s.duration, deposit });
  }

  // الموظفات (أسماء غير متداخلة بين الصالونات قدر الإمكان)
  const staffOffset = salonIndex * 6;
  const staff: { id: string; name: string }[] = [];
  for (let i = 0; i < salon.staffCount; i++) {
    const name = STAFF_POOL[(staffOffset + i) % STAFF_POOL.length];
    const created = await db.staff.create({
      data: { tenantId: tenant.id, name },
    });
    staff.push({ id: created.id, name });
  }

  // العميلات (16 عميلة لكل صالون)
  const customers: { id: string; name: string; phone: string; noShow: number }[] = [];
  for (let i = 0; i < 16; i++) {
    const name = CUSTOMER_POOL[(salonIndex * 8 + i) % CUSTOMER_POOL.length];
    const phone = `05${String(30000000 + salonIndex * 100000 + i)}`;
    const created = await db.customer.create({
      data: { tenantId: tenant.id, name, phone, noShowCount: 0 },
    });
    customers.push({ id: created.id, name, phone, noShow: 0 });
  }

  // الحجوزات
  const statusPlan = buildStatusPlan();
  let createdCount = 0;
  let ratingsCount = 0;

  for (let i = 0; i < statusPlan.length; i++) {
    const p = statusPlan[i];
    const service = pick(rng, services);
    const staffMember = pick(rng, staff);

    // عميلات وفيّات (أول 3) تظهر بشكل متكرر أكثر
    let customer;
    if (rng() < 0.35) {
      customer = customers[randInt(rng, 0, 2)];
    } else {
      customer = pick(rng, customers);
    }

    const days = randInt(rng, p.daysMin, p.daysMax);
    const hour = randInt(rng, 9, 20);
    const minute = [0, 15, 30, 45][randInt(rng, 0, 3)];
    const startsAt = new Date(now);
    startsAt.setDate(startsAt.getDate() + days);
    startsAt.setHours(hour, minute, 0, 0);
    const endsAt = new Date(startsAt.getTime() + service.duration * 60 * 1000);

    const hasDeposit = p.deposit !== "none";
    const depositPaid = p.deposit === "paid";
    const depositAmount = hasDeposit ? service.deposit : 0;
    const depositPaidAt = depositPaid
      ? new Date(Math.min(startsAt.getTime() - 24 * 3600 * 1000, now.getTime() - 3600 * 1000))
      : null;
    const paymentMethod = depositPaid
      ? rng() < 0.5
        ? "gateway"
        : "manual_transfer"
      : null;
    const paymentRef = paymentMethod === "gateway" ? `sim_pay_${salonIndex}_${i}` : null;

    // ~20% من الحجوزات المكتملة/المؤكدة معاد جدولتها
    const rescheduled = (p.status === "done" || p.status === "confirmed") && rng() < 0.2;
    const rescheduledAt = rescheduled ? new Date(startsAt.getTime() - 48 * 3600 * 1000) : null;

    const appt = await db.appointment.create({
      data: {
        tenantId: tenant.id,
        bookingCode: genBookingCode(rng, usedCodes),
        customerId: customer.id,
        staffId: staffMember.id,
        serviceId: service.id,
        startsAt,
        endsAt,
        status: p.status,
        depositAmount,
        depositPaidAt,
        paymentMethod,
        paymentRef,
        rescheduledAt,
        createdVia: pick(rng, ["dashboard", "whatsapp", "link"]),
      },
    });
    createdCount++;

    // رفع عداد الغياب للعميلة
    if (p.status === "no_show") {
      customer.noShow += 1;
      await db.customer.update({
        where: { id: customer.id },
        data: { noShowCount: { increment: 1 } },
      });
    }

    // تقييم للحجوزات المكتملة فقط (1-5 نجوم)
    if (p.status === "done") {
      await db.rating.create({
        data: {
          appointmentId: appt.id,
          tenantId: tenant.id,
          customerId: customer.id,
          score: rng() < 0.7 ? randInt(rng, 4, 5) : randInt(rng, 1, 3),
          comment: pick(rng, RATING_COMMENTS),
        },
      });
      ratingsCount++;
    }
  }

  console.log(
    `✔ ${salon.name} (${salon.slug}) [${salon.plan}] — ${createdCount} موعداً، ${ratingsCount} تقييماً، ${customers.length} عميلة، ${staff.length} موظفات، ${services.length} خدمات`
  );
}

async function main() {
  // تنظيف شامل بترتيب يضمن سلامة قيود المفاتيح
  await db.rating.deleteMany();
  await db.messageLog.deleteMany();
  await db.waitlist.deleteMany();
  await db.appointment.deleteMany();
  await db.payment.deleteMany();
  await db.subscription.deleteMany();
  await db.session.deleteMany();
  await db.customer.deleteMany();
  await db.staff.deleteMany();
  await db.service.deleteMany();
  await db.user.deleteMany();
  await db.tenant.deleteMany();

  // مستأجر المنصة + مدير المنصة
  const platformTenant = await db.tenant.create({
    data: {
      name: "دلال — المنصة",
      slug: "dalal-platform",
      phone: "0500000000",
      city: "الرياض",
      plan: "pro",
      brandColor: "#be185d",
    },
  });
  await db.user.create({
    data: {
      tenantId: platformTenant.id,
      email: "admin@dalal.sa",
      passwordHash: hashPassword("123456"),
      name: "مدير المنصة",
      role: "SUPER_ADMIN",
    },
  });

  const usedCodes = new Set<string>();
  for (let i = 0; i < SALONS.length; i++) {
    await seedSalon(SALONS[i], i, usedCodes);
  }

  console.log("✅ Seed completed: 1 SUPER_ADMIN + 3 demo salons with full demo data");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
