/**
 * بيانات تجريبية واقعية لكل باقة — للاختبار اليدوي والآلي.
 * التشغيل: npm run db:seed   (يعيد إنشاء الصالونات التجريبية في كل مرة، ولا يمس غيرها)
 *
 * الحسابات (كلمة المرور لكل الحسابات: Test1234!):
 *   indie@demo.mutrafa.sa   → /rima-indie     المستقلة
 *   silver@demo.mutrafa.sa  → /amal-silver    الفضية
 *   gold@demo.mutrafa.sa    → /lumina         الذهبية
 *   diamond@demo.mutrafa.sa → /noor-diamond   الألماسية
 *   trial@demo.mutrafa.sa   → /trial-salon    تجربة (14 يوماً من الآن)
 */
import { PrismaClient, type PlanCode, type AppointmentStatus, type Role } from "@prisma/client";
import { randomBytes, randomInt, scryptSync } from "crypto";
import { addDays, addMinutes, localDayKey } from "../lib/time";
import { computeAvailableSlots, parseWorkingHours, type BusyInterval } from "../lib/availability";
import { allocateBookingCode } from "../lib/booking-code";
import { normalizeSaPhone } from "../lib/phone";
import { entitlementsFor, PLANS } from "../lib/plans";

const db = new PrismaClient();
const TZ = "Asia/Riyadh";
const PASSWORD = "Test1234!";

const DEMO_SALONS = [
  { slug: "rima-indie", name: "صالون ريما", plan: "INDIE" as PlanCode, city: "الرياض", phone: "0501110001", owner: "ريما الحربي", email: "indie@demo.mutrafa.sa", status: "ACTIVE" as const, depositPolicy: "العربون غير مسترد عند الإلغاء بعد 24 ساعة من الموعد." },
  { slug: "amal-silver", name: "صالون أمل", plan: "SILVER" as PlanCode, city: "جدة", phone: "0501110002", owner: "أمل القحطاني", email: "silver@demo.mutrafa.sa", status: "ACTIVE" as const, depositPolicy: "العربون يُخصم من قيمة الخدمة، ويُحتفظ به عند عدم الحضور." },
  { slug: "lumina", name: "صالون لومينا", plan: "GOLD" as PlanCode, city: "الرياض", phone: "0501110003", owner: "لمى السعيد", email: "gold@demo.mutrafa.sa", status: "ACTIVE" as const, depositPolicy: "إلغاء مجاني قبل 24 ساعة، وما بعدها يُحتفظ بالعربون." },
  { slug: "noor-diamond", name: "صالون نور", plan: "DIAMOND" as PlanCode, city: "الدمام", phone: "0501110004", owner: "نور الشمري", email: "diamond@demo.mutrafa.sa", status: "ACTIVE" as const, depositPolicy: null },
  { slug: "trial-salon", name: "صالون التجربة", plan: "SILVER" as PlanCode, city: "مكة", phone: "0501110005", owner: "هدى العتيبي", email: "trial@demo.mutrafa.sa", status: "TRIALING" as const, depositPolicy: null },
];

const SERVICES = [
  { name: "قص وتصفيف", duration: 60, price: 120, deposit: 50 },
  { name: "صبغة شعر كاملة", duration: 120, price: 350, deposit: 100 },
  { name: "مانيكير", duration: 45, price: 80, deposit: 0 },
  { name: "عناية بالبشرة", duration: 90, price: 250, deposit: 80 },
  { name: "جلسة مكياج", duration: 60, price: 200, deposit: 60 },
];

const FIRST = ["سارة", "نورة", "ريم", "لينا", "دانة", "مها", "هيا", "شهد", "غادة", "أروى", "جواهر", "منال", "رنا", "لمياء", "خلود", "العنود"];
const LAST = ["العمري", "الدوسري", "الزهراني", "المطيري", "الغامدي", "الشهري", "البلوي", "الحارثي", "القرني", "السبيعي"];

// مولّد عشوائي قابل للتكرار (نتائج ثابتة بين التشغيلات)
let seed = 20261009;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

async function main() {
  const passwordHash = hashPassword(PASSWORD);
  const now = new Date();

  await db.salon.deleteMany({ where: { slug: { in: DEMO_SALONS.map((s) => s.slug) } } });
  console.log("🧹 أُزيلت الصالونات التجريبية القديمة");

  for (const cfg of DEMO_SALONS) {
    const trialEnd = addDays(now, 14);
    const salon = await db.salon.create({
      data: {
        name: cfg.name,
        slug: cfg.slug,
        city: cfg.city,
        whatsappNumber: normalizeSaPhone(cfg.phone)!,
        timezone: TZ,
        depositPolicy: cfg.depositPolicy,
        bankName: "بنك الراجحي",
        bankIban: "SA0380000000608010167519",
        cancellationHours: 24,
        subscription: {
          create: {
            plan: cfg.plan,
            status: cfg.status,
            trialEndsAt: cfg.status === "TRIALING" ? trialEnd : null,
            currentPeriodStart: now,
            currentPeriodEnd: cfg.status === "TRIALING" ? trialEnd : addDays(now, 30),
          },
        },
        users: {
          create: { email: cfg.email, name: cfg.owner, passwordHash, role: "OWNER" as Role },
        },
      },
    });

    const maxCalendars = Math.min(entitlementsFor(cfg.plan).calendars, 4);
    const calendarCount = cfg.plan === "INDIE" ? 1 : Math.max(2, Math.min(maxCalendars, 4));
    const staffNames = ["ياسمين", "دلال", "روان", "ليان", "سلمى"].slice(0, calendarCount);
    const services = [];
    for (const s of SERVICES) {
      services.push(
        await db.service.create({
          data: {
            salonId: salon.id,
            name: s.name,
            durationMinutes: s.duration,
            priceHalalas: s.price * 100,
            depositHalalas: cfg.plan === "INDIE" || cfg.plan === "SILVER" ? (s.deposit > 0 ? 50 * 100 : 0) : s.deposit * 100,
            cancellationHours: cfg.plan === "GOLD" || cfg.plan === "DIAMOND" ? (s.duration > 90 ? 48 : null) : null,
          },
        })
      );
    }

    const calendars = [];
    for (let i = 0; i < calendarCount; i++) {
      const calendar = await db.calendar.create({
        data: {
          salonId: salon.id,
          name: staffNames[i],
          phone: `05012${String(10000 + i)}`,
          workingHours: { start: "10:00", end: "20:00", days: [0, 1, 2, 3, 4, 6] },
          commissionBps: cfg.plan === "GOLD" || cfg.plan === "DIAMOND" ? 1500 + i * 500 : 0,
          services: { create: services.map((s) => ({ serviceId: s.id })) },
        },
      });
      calendars.push(calendar);
    }

    // عميلات
    const customers = [];
    for (let i = 0; i < 40; i++) {
      const phone = normalizeSaPhone(`05${randomInt(0, 9)}${String(randomInt(1000000, 9999999))}`)!;
      customers.push(
        await db.customer.upsert({
          where: { salonId_phone: { salonId: salon.id, phone } },
          update: {},
          create: { salonId: salon.id, phone, name: `${pick(FIRST)} ${pick(LAST)}` },
        })
      );
    }

    // مواعيد من 30 يوماً سابقاً إلى 7 أيام قادمة
    const busyByCalendar = new Map<string, BusyInterval[]>();
    let created = 0;
    for (let offset = -30; offset <= 7; offset++) {
      const day = addDays(now, offset);
      const dayKey = localDayKey(day, TZ);
      for (const cal of calendars) {
        const hours = parseWorkingHours(cal.workingHours);
        const busy = busyByCalendar.get(cal.id) ?? [];
        const dailyTarget = randomInt(1, 5);
        for (let k = 0; k < dailyTarget; k++) {
          const service = pick(services);
          const slots = computeAvailableSlots({
            dayKey,
            timeZone: TZ,
            hours,
            durationMinutes: service.durationMinutes,
            busy,
            now: offset < 0 ? new Date(0) : now, // الأيام الماضية: كل الفتحات مسموحة لتوليد التاريخ
            stepMinutes: 30,
          });
          if (slots.length === 0) break;
          const startsAt = pick(slots);
          const endsAt = addMinutes(startsAt, service.durationMinutes);
          busy.push({ start: startsAt, end: endsAt });
          busyByCalendar.set(cal.id, busy);

          let status: AppointmentStatus;
          if (offset < 0) {
            const roll = rnd();
            status = roll < 0.78 ? "COMPLETED" : roll < 0.86 ? "NO_SHOW" : "CANCELLED";
          } else {
            const roll = rnd();
            status = roll < 0.08 ? "CANCELLED" : roll < 0.2 && service.depositHalalas > 0 ? "PENDING_DEPOSIT" : "CONFIRMED";
          }
          const customer = pick(customers);
          const appt = await db.appointment.create({
            data: {
              salonId: salon.id,
              code: await allocateBookingCode(db, salon.id),
              customerId: customer.id,
              calendarId: cal.id,
              serviceId: service.id,
              startsAt,
              endsAt,
              status,
              holdUntil: status === "PENDING_DEPOSIT" ? addMinutes(now, 120) : null,
              depositHalalas: service.depositHalalas,
              priceHalalas: service.priceHalalas,
              source: pick(["LINK", "LINK", "WHATSAPP", "DASHBOARD"] as const),
              confirmedAt: status === "CONFIRMED" || status === "COMPLETED" || status === "NO_SHOW" ? startsAt : null,
              cancelledAt: status === "CANCELLED" ? day : null,
              cancelReason: status === "CANCELLED" ? "ملغى (بيانات تجريبية)" : null,
            },
          });
          created++;

          if (service.depositHalalas > 0 && status !== "CANCELLED") {
            const paid = status !== "PENDING_DEPOSIT";
            await db.payment.create({
              data: {
                salonId: salon.id,
                kind: "DEPOSIT",
                status: paid ? "PAID" : "PENDING",
                amountHalalas: service.depositHalalas,
                provider: "sandbox",
                providerRef: `seed_${appt.id}`,
                method: paid ? pick(["mada", "visa", "applepay", "googlepay"]) : null,
                appointmentId: appt.id,
                paidAt: paid ? startsAt : null,
              },
            });
          }
          if (status === "NO_SHOW") {
            await db.customer.update({ where: { id: customer.id }, data: { noShowCount: { increment: 1 } } });
          }
          if (status === "COMPLETED" && rnd() < 0.6) {
            await db.review.create({
              data: {
                salonId: salon.id,
                appointmentId: appt.id,
                customerId: customer.id,
                score: pick([3, 4, 4, 5, 5, 5]),
                comment: pick([null, "تجربة رائعة، شكراً لكِ 🌸", "الخدمة ممتازة والمكان نظيف", null, "أنصح بها"]),
              },
            });
          }
        }
      }
    }

    // سجل تدقيق واقعي لأحدث العمليات (كما تكتبه الخدمة الحقيقية)
    const owner = await db.user.findFirstOrThrow({ where: { salonId: salon.id } });
    const recent = await db.appointment.findMany({ where: { salonId: salon.id }, orderBy: { createdAt: "desc" }, take: 25, select: { id: true, status: true } });
    await db.auditLog.createMany({
      data: [
        { salonId: salon.id, userId: owner.id, action: "salon.created", entityType: "salon", entityId: salon.id, createdAt: addDays(now, -31) },
        ...services.map((svc) => ({ salonId: salon.id, userId: owner.id, action: "service.created", entityType: "service", entityId: svc.id, createdAt: addDays(now, -31) })),
        ...recent.map((a) => ({
          salonId: salon.id,
          userId: a.status === "CANCELLED" || a.status === "NO_SHOW" ? owner.id : null,
          action: a.status === "CANCELLED" ? "appointment.cancelled" : "appointment.created",
          entityType: "appointment",
          entityId: a.id,
        })),
      ],
    });

    // قائمة انتظار للباقات التي تتضمنها
    if (cfg.plan !== "INDIE") {
      for (let i = 0; i < 3; i++) {
        await db.waitlistEntry.create({
          data: {
            salonId: salon.id,
            customerId: pick(customers).id,
            serviceId: pick(services).id,
            preferredFrom: addDays(now, randomInt(1, 6)),
          },
        });
      }
    }

    console.log(`✔ ${cfg.name} (${cfg.slug}) [${cfg.plan}] — ${created} موعداً، ${calendarCount} موظفات، ${services.length} خدمات`);
    console.log(`   الباقة: ${PLANS[cfg.plan].nameAr} — حدود: ${PLANS[cfg.plan].calendars} تقويم، ${PLANS[cfg.plan].monthlyBookings} حجز/شهر، ${PLANS[cfg.plan].admins} حسابات`);
  }

  console.log(`\n🔑 كلمة المرور لكل الحسابات التجريبية: ${PASSWORD}`);
  console.log("   indie@demo.mutrafa.sa · silver@demo.mutrafa.sa · gold@demo.mutrafa.sa · diamond@demo.mutrafa.sa · trial@demo.mutrafa.sa");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
