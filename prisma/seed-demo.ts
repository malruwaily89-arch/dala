import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { randomInt } from "crypto";

const db = new PrismaClient();

function generateBookingCode(used: Set<string>): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (;;) {
    let code = "";
    for (let i = 0; i < 6; i++) code += alphabet[randomInt(alphabet.length)];
    const full = `SY-${code}`;
    if (!used.has(full)) {
      used.add(full);
      return full;
    }
  }
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

// عميلات جديدة (أسماء لا تتكرر مع العميلات الموجودة مسبقاً لصالون نور)
const NEW_CUSTOMER_NAMES = [
  "نورة",
  "ريم",
  "سارة",
  "دانة",
  "لمى",
  "جود",
  "رهف",
  "تالا",
  "رغد",
  "أمل",
];

const SAMPLE_COMMENTS = [
  "خدمة رائعة وموظفات محترفات 🌸",
  "تجربة ممتازة، سأعود بالتأكيد.",
  "النتيجة أكثر من رائعة، شكراً لكن.",
  "دقة في المواعيد ونظافة عالية.",
  "أفضل صالون جربته، النتيجة طبيعية جداً.",
  null,
];

// توزيع 22 موعداً خلال الشهر الحالي حسب المطلوب:
// 8 confirmed (قادمة) / 5 done (سابقة) / 3 cancelled / 2 no_show / 4 pending_deposit
type StatusPlan = { status: string; dayOfMonth: number; deposit: "paid" | "unpaid" | "none" };

function buildStatusPlan(daysInMonth: number, today: number): StatusPlan[] {
  const plan: StatusPlan[] = [];

  // 8 مؤكدة (قادمة أو اليوم نفسه) — أغلبها بعربون مدفوع
  const confirmedDays = [today, today + 1, today + 2, today + 3, today + 5, today + 7, today + 9, today + 11]
    .map((d) => Math.min(d, daysInMonth));
  confirmedDays.forEach((d, i) => plan.push({ status: "confirmed", dayOfMonth: d, deposit: i % 4 === 0 ? "unpaid" : "paid" }));

  // 5 مكتملة (ماضية ضمن الشهر الحالي)
  const doneDays = [Math.max(1, today - 2), Math.max(1, today - 4), Math.max(1, today - 6), Math.max(1, today - 8), Math.max(1, today - 10)];
  doneDays.forEach((d, i) => plan.push({ status: "done", dayOfMonth: d, deposit: i % 3 === 0 ? "unpaid" : "paid" }));

  // 3 ملغاة
  const cancelledDays = [Math.max(1, today - 3), Math.max(1, today - 9), Math.min(today + 6, daysInMonth)];
  cancelledDays.forEach((d) => plan.push({ status: "cancelled", dayOfMonth: d, deposit: "none" }));

  // 2 لم تحضر
  const noShowDays = [Math.max(1, today - 5), Math.max(1, today - 13)];
  noShowDays.forEach((d, i) => plan.push({ status: "no_show", dayOfMonth: d, deposit: i === 0 ? "paid" : "none" }));

  // 4 بانتظار العربون (قادمة، لم يُدفع العربون بعد)
  const pendingDays = [Math.min(today + 4, daysInMonth), Math.min(today + 6, daysInMonth), Math.min(today + 8, daysInMonth), Math.min(today + 13, daysInMonth)];
  pendingDays.forEach((d) => plan.push({ status: "pending_deposit", dayOfMonth: d, deposit: "unpaid" }));

  return plan;
}

async function main() {
  const tenant = await db.tenant.findUnique({ where: { slug: "noor-salon" } });
  if (!tenant) {
    throw new Error("لم يتم العثور على صالون نور (noor-salon). شغّل prisma/seed.ts أولاً.");
  }
  console.log(`✔ tenant: ${tenant.name} (${tenant.slug})`);

  const services = await db.service.findMany({ where: { tenantId: tenant.id } });
  const staffList = await db.staff.findMany({ where: { tenantId: tenant.id } });
  if (services.length === 0 || staffList.length === 0) {
    throw new Error("لا توجد خدمات أو موظفات لصالون نور. تأكد من تشغيل seed الأساسي أولاً.");
  }
  console.log(`✔ خدمات موجودة: ${services.length} — موظفات موجودات: ${staffList.length}`);

  // عميلات جديدة (تُضاف فوق العميلات الموجودة لضمان 20+ إجمالاً)
  const newCustomers = [];
  for (const name of NEW_CUSTOMER_NAMES) {
    let phone = `05${randomInt(10000000, 99999999)}`;
    // ضمان عدم التكرار على مستوى الصالون
    for (;;) {
      const exists = await db.customer.findUnique({ where: { tenantId_phone: { tenantId: tenant.id, phone } } });
      if (!exists) break;
      phone = `05${randomInt(10000000, 99999999)}`;
    }
    const customer = await db.customer.create({
      data: { tenantId: tenant.id, name, phone },
    });
    newCustomers.push(customer);
  }
  console.log(`✔ تم إنشاء ${newCustomers.length} عميلة جديدة`);

  const existingCustomers = await db.customer.findMany({ where: { tenantId: tenant.id } });
  const totalCustomers = existingCustomers.length;
  console.log(`✔ إجمالي العميلات لصالون نور الآن: ${totalCustomers}`);

  const existingCodes = new Set(
    (await db.appointment.findMany({ select: { bookingCode: true } })).map((a) => a.bookingCode)
  );

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const statusPlan = buildStatusPlan(daysInMonth, today);

  let created = 0;
  let ratingsCreated = 0;

  for (let i = 0; i < statusPlan.length; i++) {
    const p = statusPlan[i];
    const customer = existingCustomers[randomInt(existingCustomers.length)];
    const service = services[randomInt(services.length)];
    const staff = staffList[randomInt(staffList.length)];

    const hour = randomInt(9, 20);
    const minute = [0, 15, 30, 45][randomInt(4)];

    const startsAt = new Date(year, month, p.dayOfMonth, hour, minute, 0, 0);
    const endsAt = addMinutes(startsAt, service.durationMinutes);

    const hasDeposit = p.deposit !== "none";
    const depositPaid = p.deposit === "paid";
    const depositAmount = hasDeposit ? service.depositAmount : 0;
    const depositPaidAt = depositPaid
      ? new Date(Math.min(startsAt.getTime() - 3 * 3600 * 1000, now.getTime() - 3600 * 1000))
      : null;
    const paymentMethod = depositPaid ? (randomInt(2) === 0 ? "gateway" : "manual_transfer") : null;
    const paymentRef = paymentMethod === "gateway" ? `sim_pay_noor_${i}` : null;

    // ~25% من الحجوزات (confirmed/done) تم إعادة جدولتها
    const canReschedule = p.status === "confirmed" || p.status === "done";
    const rescheduled = canReschedule && randomInt(4) === 0;
    const rescheduledAt = rescheduled ? new Date(startsAt.getTime() - 2 * 24 * 3600 * 1000) : null;

    const appt = await db.appointment.create({
      data: {
        tenantId: tenant.id,
        bookingCode: generateBookingCode(existingCodes),
        customerId: customer.id,
        staffId: staff.id,
        serviceId: service.id,
        startsAt,
        endsAt,
        status: p.status,
        depositAmount,
        depositPaidAt,
        paymentMethod,
        paymentRef,
        rescheduledAt,
        createdVia: ["dashboard", "whatsapp", "link"][randomInt(3)],
      },
    });
    created++;

    if (p.status === "no_show") {
      await db.customer.update({ where: { id: customer.id }, data: { noShowCount: { increment: 1 } } });
    }

    if (p.status === "done") {
      await db.rating.create({
        data: {
          appointmentId: appt.id,
          tenantId: tenant.id,
          customerId: customer.id,
          score: randomInt(3, 6),
          comment: SAMPLE_COMMENTS[randomInt(SAMPLE_COMMENTS.length)],
        },
      });
      ratingsCreated++;
    }
  }

  console.log(
    `✅ تم إنشاء ${created} موعداً (8 confirmed / 5 done / 3 cancelled / 2 no_show / 4 pending_deposit) و ${ratingsCreated} تقييماً لصالون نور ضمن الشهر الحالي.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
