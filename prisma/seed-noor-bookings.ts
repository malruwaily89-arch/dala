import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { randomInt } from "crypto";

const db = new PrismaClient();

function generateBookingCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[randomInt(alphabet.length)];
  return `SY-${code}`;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

const CUSTOMER_NAMES = [
  "هيفاء",
  "لمياء",
  "دلال",
  "منيرة",
  "عبير",
  "نوف",
  "غادة",
  "ريما",
  "مها",
  "سلطانة",
  "البندري",
  "وجدان",
  "أسماء",
  "حصة",
  "شوق",
];

async function main() {
  const tenant = await db.tenant.findFirst({
    where: { slug: { contains: "noor" } },
  });

  if (!tenant) {
    throw new Error("لم يتم العثور على مستأجر يحتوي slug على 'noor'. شغّل prisma/seed.ts أولاً.");
  }

  console.log(`✔ tenant: ${tenant.name} (${tenant.slug})`);

  // تنظيف المواعيد/التقييمات السابقة لهذا المستأجر لضمان بيانات متسقة عند إعادة التشغيل
  await db.rating.deleteMany({ where: { tenantId: tenant.id } });
  await db.appointment.deleteMany({ where: { tenantId: tenant.id } });

  // الخدمات
  let services = await db.service.findMany({ where: { tenantId: tenant.id } });
  if (services.length === 0) {
    const serviceDefs = [
      { name: "قص شعر", durationMinutes: 30, price: 80, depositAmount: 20 },
      { name: "صبغة", durationMinutes: 90, price: 250, depositAmount: 50 },
      { name: "تسريحة", durationMinutes: 45, price: 120, depositAmount: 30 },
      { name: "مانيكير", durationMinutes: 30, price: 60, depositAmount: 15 },
    ];
    for (const s of serviceDefs) {
      await db.service.create({ data: { tenantId: tenant.id, ...s } });
    }
    services = await db.service.findMany({ where: { tenantId: tenant.id } });
    console.log(`✔ تم إنشاء ${services.length} خدمات`);
  } else {
    console.log(`✔ خدمات موجودة مسبقاً: ${services.length}`);
  }

  // الموظفات
  let staffList = await db.staff.findMany({ where: { tenantId: tenant.id } });
  if (staffList.length === 0) {
    const staffNames = ["نورة", "ريم", "سارة"];
    for (const name of staffNames) {
      await db.staff.create({ data: { tenantId: tenant.id, name } });
    }
    staffList = await db.staff.findMany({ where: { tenantId: tenant.id } });
    console.log(`✔ تم إنشاء ${staffList.length} موظفات`);
  } else {
    console.log(`✔ موظفات موجودات مسبقاً: ${staffList.length}`);
  }

  // العميلات
  const customers = [];
  for (const name of CUSTOMER_NAMES) {
    const phone = `05${randomInt(10000000, 99999999)}`;
    const customer = await db.customer.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone } },
      update: {},
      create: { tenantId: tenant.id, name, phone },
    });
    customers.push(customer);
  }
  console.log(`✔ تم إنشاء/تجهيز ${customers.length} عميلة`);

  const SAMPLE_COMMENTS = [
    "خدمة رائعة وموظفات محترفات 🌸",
    "تجربة ممتازة، سأعود بالتأكيد.",
    "النتيجة أكثر من رائعة، شكراً لكن.",
    "دقة بالمواعيد ونظافة عالية.",
    null,
  ];

  // توزيع الحالات:
  // - 3 confirmed مستقبلية بعربون مدفوع (لتفعيل زر تعديل الموعد)
  // - 4 confirmed سابقة (2 بعربون، 2 بدون)
  // - 3 done مكتملة (مع تقييم)
  // - 2 no_show بعربون مدفوع (ربح صافٍ — يظهر في التقرير)
  // - 1 no_show بدون عربون
  // - 2 cancelled
  const statusPlan: { status: string; depositPaid: boolean; daysFromNow: number }[] = [
    { status: "confirmed", depositPaid: true, daysFromNow: 2 },
    { status: "confirmed", depositPaid: true, daysFromNow: 5 },
    { status: "confirmed", depositPaid: false, daysFromNow: 8 },
    { status: "confirmed", depositPaid: true, daysFromNow: -3 },
    { status: "confirmed", depositPaid: true, daysFromNow: -7 },
    { status: "confirmed", depositPaid: false, daysFromNow: -10 },
    { status: "confirmed", depositPaid: false, daysFromNow: -14 },
    { status: "done", depositPaid: true, daysFromNow: -5 },
    { status: "done", depositPaid: true, daysFromNow: -12 },
    { status: "done", depositPaid: false, daysFromNow: -20 },
    { status: "no_show", depositPaid: true, daysFromNow: -6 },
    { status: "no_show", depositPaid: true, daysFromNow: -15 },
    { status: "no_show", depositPaid: false, daysFromNow: -18 },
    { status: "cancelled", depositPaid: false, daysFromNow: -9 },
    { status: "cancelled", depositPaid: false, daysFromNow: -22 },
  ];

  const now = new Date();
  let created = 0;
  let ratingsCreated = 0;

  for (let i = 0; i < statusPlan.length; i++) {
    const plan = statusPlan[i];
    const customer = customers[i];
    const service = services[randomInt(services.length)];
    const staff = staffList[randomInt(staffList.length)];

    const hour = randomInt(9, 20); // 9:00 - 20:00 (20:00 كأقصى بداية معقولة)
    const minute = [0, 15, 30, 45][randomInt(4)];

    const startsAt = new Date(now);
    startsAt.setDate(startsAt.getDate() + plan.daysFromNow);
    startsAt.setHours(hour, minute, 0, 0);

    const endsAt = addMinutes(startsAt, service.durationMinutes);

    const depositAmount = plan.depositPaid ? service.depositAmount : 0;
    const depositPaidAt = plan.depositPaid
      ? new Date(Math.min(startsAt.getTime() - 60 * 60 * 1000, now.getTime()))
      : null;

    const appt = await db.appointment.create({
      data: {
        tenantId: tenant.id,
        bookingCode: generateBookingCode(),
        customerId: customer.id,
        staffId: staff.id,
        serviceId: service.id,
        startsAt,
        endsAt,
        status: plan.status,
        depositAmount,
        depositPaidAt,
        paymentMethod: plan.depositPaid ? (randomInt(2) === 0 ? "gateway" : "manual_transfer") : null,
        createdVia: ["dashboard", "whatsapp", "link"][randomInt(3)],
      },
    });
    created++;

    if (plan.status === "done") {
      await db.rating.create({
        data: {
          appointmentId: appt.id,
          tenantId: tenant.id,
          customerId: customer.id,
          score: randomInt(3, 6), // 3-5 نجوم
          comment: SAMPLE_COMMENTS[randomInt(SAMPLE_COMMENTS.length)],
        },
      });
      ratingsCreated++;
    }
  }

  console.log(`✅ تم إنشاء ${created} موعداً و ${ratingsCreated} تقييماً لصالون ${tenant.name} (${tenant.slug})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
