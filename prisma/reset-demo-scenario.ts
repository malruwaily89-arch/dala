import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const db = new PrismaClient();

const CONFIRM = "RESET_DEMO_DATA";
const TARGET_SLUGS = ["noor-salon", "liyan-salon", "amal-salon"] as const;
const DEMO_TENANTS = {
  "noor-salon": { name: "صالون نور التجريبي", city: "الرياض", phone: "0502000001", plan: "BASIC", ownerEmail: "owner@noor-salon.demo" },
  "liyan-salon": { name: "صالون ليان التجريبي", city: "جدة", phone: "0502000002", plan: "PRO", ownerEmail: "owner@liyan-salon.demo" },
  "amal-salon": { name: "صالون أمل التجريبي", city: "الدمام", phone: "0502000003", plan: "ADVANCED", ownerEmail: "owner@amal-salon.demo" },
} as const;
const SERVICE_CATALOG = [
  { name: "قص شعر", durationMinutes: 45, price: 120, depositAmount: 24 },
  { name: "صبغة شعر", durationMinutes: 120, price: 320, depositAmount: 64 },
  { name: "علاج بروتين", durationMinutes: 150, price: 480, depositAmount: 96 },
  { name: "تنظيف بشرة", durationMinutes: 60, price: 180, depositAmount: 36 },
  { name: "ليزر", durationMinutes: 60, price: 650, depositAmount: 130 },
  { name: "مكياج مناسبات", durationMinutes: 90, price: 280, depositAmount: 56 },
  { name: "مانيكير وبديكير", durationMinutes: 60, price: 140, depositAmount: 28 },
  { name: "تسريحة شعر", durationMinutes: 75, price: 220, depositAmount: 44 },
  { name: "عناية أظافر", durationMinutes: 75, price: 160, depositAmount: 32 },
  { name: "إزالة شعر", durationMinutes: 45, price: 110, depositAmount: 22 },
] as const;

const STAFF_NAMES = ["نورة", "ريم", "سارة", "منى", "هند", "عبير", "لجين", "شهد", "رغد", "أمل"];
const CUSTOMER_NAMES = ["هيفاء", "لمياء", "دلال", "منيرة", "نوف", "غادة", "ريما", "مها", "سلطانة", "البندري", "وجدان", "أسماء", "حصة", "شوق", "لطيفة", "موضي", "عائشة", "زينب", "فاطمة", "حنان", "مريم", "جوهرة", "سارة", "نجلاء", "تهاني"];
const ALLOCATION = {
  "noor-salon": { staff: 4, customers: 8, services: 4, statuses: ["done", "done", "done", "done", "confirmed", "confirmed", "confirmed", "pending_deposit", "cancelled", "no_show"] },
  "liyan-salon": { staff: 2, customers: 8, services: 3, statuses: ["done", "done", "done", "done", "confirmed", "confirmed", "confirmed", "pending_deposit", "cancelled", "no_show"] },
  "amal-salon": { staff: 4, customers: 9, services: 4, statuses: ["done", "done", "done", "done", "confirmed", "confirmed", "pending_deposit", "cancelled", "cancelled", "no_show"] },
} as const;

const PLAN_PRICES: Record<string, number> = { BASIC: 199, PRO: 449, ADVANCED: 999 };

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function bookingCode(slug: string, index: number) {
  return `DEMO-${slug.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(3, "0")}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function slotDate(index: number, status: string) {
  const d = new Date();
  d.setHours(10 + (index % 6), (index % 2) * 30, 0, 0);
  d.setDate(d.getDate() + (status === "confirmed" || status === "pending_deposit" ? 3 + index : -(index + 1)));
  return d;
}

async function main() {
  if (process.env.DALA_SCENARIO_CONFIRM !== CONFIRM) {
    throw new Error(`هذا الإجراء محمي. للتنفيذ المقصود اضبط DALA_SCENARIO_CONFIRM=${CONFIRM}`);
  }
  if (process.env.DALA_SCENARIO_SCOPE !== "demo-slugs") {
    throw new Error("يجب ضبط DALA_SCENARIO_SCOPE=demo-slugs لحصر الحذف في الصالونات المحددة.");
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL غير مضبوط");
  if (process.env.NODE_ENV === "production" && process.env.DALA_SCENARIO_ALLOW_PRODUCTION !== "YES") {
    throw new Error("تم منع التشغيل على NODE_ENV=production. أضف DALA_SCENARIO_ALLOW_PRODUCTION=YES بعد مراجعة النطاق.");
  }

  const tenants = await db.tenant.findMany({ where: { slug: { in: [...TARGET_SLUGS] } } });
  const missing = TARGET_SLUGS.filter((slug) => !tenants.some((t) => t.slug === slug));
  if (missing.length) {
    if (process.env.DALA_SCENARIO_BOOTSTRAP !== "YES" || !process.env.DALA_DEMO_OWNER_PASSWORD) {
      throw new Error("قاعدة البيانات لا تحتوي الصالونات التجريبية. لإنشاء الحسابات في Staging فقط اضبط DALA_SCENARIO_BOOTSTRAP=YES وDALA_DEMO_OWNER_PASSWORD (لا ترسل كلمة المرور هنا).");
    }
    for (const slug of missing) {
      const demo = DEMO_TENANTS[slug];
      const passwordHash = hashPassword(process.env.DALA_DEMO_OWNER_PASSWORD);
      const periodStart = new Date();
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      const tenant = await db.tenant.create({
        data: {
          name: demo.name,
          slug,
          phone: demo.phone,
          city: demo.city,
          plan: demo.plan.toLowerCase(),
          brandColor: "#A84769",
          users: { create: { email: demo.ownerEmail, passwordHash, name: `مالكة ${demo.name}`, role: "OWNER" } },
          subscriptions: { create: { plan: demo.plan, status: "active", currentPeriodStart: periodStart, currentPeriodEnd: periodEnd } },
        },
        include: { subscriptions: true },
      });
      const subscription = tenant.subscriptions[0];
      await db.payment.create({ data: { tenantId: tenant.id, subscriptionId: subscription.id, amount: PLAN_PRICES[demo.plan].toFixed(2), currency: "SAR", status: "paid", provider: "demo", paidAt: periodStart } });
      tenants.push(tenant);
      console.log(`تم إنشاء حساب Staging: ${slug} — ${demo.plan}`);
    }
  }

  for (const tenant of tenants) {
    const allocation = ALLOCATION[tenant.slug as keyof typeof ALLOCATION];
    if (!allocation) continue;

    // يبقى Tenant والمالكة والاشتراك والمدفوعات محفوظة. تزال بيانات التشغيل التابعة فقط.
    await db.$transaction([
      db.rating.deleteMany({ where: { tenantId: tenant.id } }),
      db.messageLog.deleteMany({ where: { tenantId: tenant.id } }),
      db.waitlist.deleteMany({ where: { tenantId: tenant.id } }),
      db.appointment.deleteMany({ where: { tenantId: tenant.id } }),
      db.customer.deleteMany({ where: { tenantId: tenant.id } }),
      db.staff.deleteMany({ where: { tenantId: tenant.id } }),
      db.service.deleteMany({ where: { tenantId: tenant.id } }),
    ]);

    const services = [];
    for (const item of SERVICE_CATALOG.slice(0, allocation.services)) {
      services.push(await db.service.create({
        data: {
          tenantId: tenant.id,
          name: item.name,
          durationMinutes: item.durationMinutes,
          price: item.price.toFixed(2),
          depositAmount: item.depositAmount.toFixed(2),
          isActive: true,
        },
      }));
    }

    const staff = [];
    for (let i = 0; i < allocation.staff; i++) {
      staff.push(await db.staff.create({
        data: {
          tenantId: tenant.id,
          name: STAFF_NAMES[i],
          jobTitle: "أخصائية تجميل",
          phone: `05${String(70000000 + i + tenant.sequenceNumber).slice(-8)}`,
          isActive: true,
        },
      }));
    }

    const customers = [];
    for (let i = 0; i < allocation.customers; i++) {
      customers.push(await db.customer.create({
        data: {
          tenantId: tenant.id,
          name: CUSTOMER_NAMES[(i + tenant.sequenceNumber) % CUSTOMER_NAMES.length],
          phone: `05${String(80000000 + tenant.sequenceNumber * 100 + i).slice(-8)}`,
          noShowCount: 0,
        },
      }));
    }

    for (let i = 0; i < allocation.statuses.length; i++) {
      const status = allocation.statuses[i];
      const service = services[i % services.length];
      const staffMember = staff[i % staff.length];
      const customer = customers[i % customers.length];
      const startsAt = slotDate(i, status);
      const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);
      const paid = status === "done" || (status === "confirmed" && i % 2 === 0);
      const appointment = await db.appointment.create({
        data: {
          tenantId: tenant.id,
          bookingCode: bookingCode(tenant.slug, i),
          customerId: customer.id,
          staffId: staffMember.id,
          serviceId: service.id,
          startsAt,
          endsAt,
          status,
          depositAmount: service.depositAmount,
          depositPaidAt: paid ? new Date(startsAt.getTime() - 86_400_000) : null,
          paymentMethod: paid ? "manual_transfer" : null,
          paymentRef: paid ? `demo-${tenant.slug}-${i + 1}` : null,
          createdVia: i % 2 === 0 ? "dashboard" : "link",
        },
      });
      if (status === "no_show") {
        await db.customer.update({ where: { id: customer.id }, data: { noShowCount: { increment: 1 } } });
      }
      if (status === "done") {
        await db.rating.create({
          data: {
            appointmentId: appointment.id,
            tenantId: tenant.id,
            customerId: customer.id,
            score: i % 4 === 0 ? 4 : 5,
            comment: "تجربة ممتازة وخدمة متقنة.",
          },
        });
      }
    }
    console.log(`تم تجهيز ${tenant.name}: ${allocation.staff} موظفات، ${allocation.customers} عميلات، ${allocation.services} خدمات، ${allocation.statuses.length} مواعيد. الحساب والاشتراك محفوظان.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(async () => {
  await db.$disconnect();
});


