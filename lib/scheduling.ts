import { db } from "./db";
import { generateBookingCode, addMinutes, overlaps } from "./utils";

interface WorkingHours {
  start: string; // "09:00"
  end: string; // "21:00"
  days: number[]; // 0=الأحد .. 6=السبت
}

export function parseWorkingHours(json: string): WorkingHours {
  try {
    const parsed = JSON.parse(json) as WorkingHours;
    if (parsed?.start && parsed?.end && Array.isArray(parsed.days)) return parsed;
  } catch {}
  return { start: "09:00", end: "21:00", days: [0, 1, 2, 3, 4, 6] };
}

const SLOT_STEP_MIN = 30;

/**
 * المواعيد الفارغة لموظفة معينة في يوم معين لخدمة معينة.
 * يعيد قائمة أوقات بداية متاحة (Date) على شبكة 30 دقيقة.
 */
export async function getAvailableSlots(params: {
  tenantId: string;
  staffId: string;
  serviceId: string;
  date: Date; // أي يوم في المنطقة الزمنية للمستخدم (يُقارن بالتقويم المحلي)
}): Promise<Date[]> {
  const { tenantId, staffId, serviceId, date } = params;

  const [staff, service, dayAppointments] = await Promise.all([
    db.staff.findFirst({ where: { id: staffId, tenantId, isActive: true } }),
    db.service.findFirst({ where: { id: serviceId, tenantId, isActive: true } }),
    db.appointment.findMany({
      where: {
        tenantId,
        staffId,
        status: { in: ["pending_deposit", "confirmed"] },
        startsAt: { gte: startOfDay(date), lt: endOfDay(date) },
      },
      select: { startsAt: true, endsAt: true },
    }),
  ]);

  if (!staff || !service) return [];
  const hours = parseWorkingHours(staff.workingHours);
  if (!hours.days.includes(date.getDay())) return [];

  const [h1, m1] = hours.start.split(":").map(Number);
  const [h2, m2] = hours.end.split(":").map(Number);

  const workStart = new Date(date);
  workStart.setHours(h1, m1, 0, 0);
  const workEnd = new Date(date);
  workEnd.setHours(h2, m2, 0, 0);

  const now = new Date();
  const slots: Date[] = [];
  for (let t = workStart.getTime(); t + service.durationMinutes * 60_000 <= workEnd.getTime(); t += SLOT_STEP_MIN * 60_000) {
    const slotStart = new Date(t);
    const slotEnd = addMinutes(slotStart, service.durationMinutes);
    if (slotStart <= now) continue; // لا حجوزات في الماضي
    const busy = dayAppointments.some((a) => overlaps(slotStart, slotEnd, a.startsAt, a.endsAt));
    if (!busy) slots.push(slotStart);
  }
  return slots;
}

/**
 * إنشاء حجز مع ضمان عدم التعارض (فحص نهائي قبل الإدراج).
 * يعيد الحجز أو يرمي خطأ التعارض.
 */
export async function createAppointmentTx(params: {
  tenantId: string;
  customerId: string;
  staffId: string;
  serviceId: string;
  startsAt: Date;
  createdVia: "whatsapp" | "link" | "dashboard";
}) {
  const { tenantId, customerId, staffId, serviceId, startsAt, createdVia } = params;

  const service = await db.service.findFirst({ where: { id: serviceId, tenantId } });
  if (!service) throw new Error("الخدمة غير موجودة");
  const endsAt = addMinutes(startsAt, service.durationMinutes);

  // فحص التعارض النهائي (سباق متزامن محتمل — يكفي لنطاقنا الحالي)
  const conflict = await db.appointment.findFirst({
    where: {
      tenantId,
      staffId,
      status: { in: ["pending_deposit", "confirmed"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });
  if (conflict) throw new Error("عذراً، هذا الموعد حُجز للتو. اختاري وقتاً آخر.");

  // إنشاء/تحديث العميلة تلقائياً عند الحجز العام
  return db.appointment.create({
    data: {
      tenantId,
      bookingCode: await generateUniqueBookingCode(),
      customerId,
      staffId,
      serviceId,
      startsAt,
      endsAt,
      depositAmount: service.depositAmount,
      status: service.depositAmount > 0 ? "pending_deposit" : "confirmed",
      depositPaidAt: service.depositAmount > 0 ? null : new Date(),
      createdVia,
    },
  });
}

/**
 * تعديل موعد قائم إلى وقت جديد — يعيد حساب endsAt بمدة نفس الخدمة
 * ويتحقق من عدم التعارض مع مواعيد أخرى (باستثناء الحجز نفسه).
 */
export async function rescheduleAppointmentTx(params: {
  appointmentId: string;
  tenantId: string;
  newStartsAt: Date;
}) {
  const { appointmentId, tenantId, newStartsAt } = params;

  const appt = await db.appointment.findFirst({
    where: { id: appointmentId, tenantId },
    include: { service: true },
  });
  if (!appt) throw new Error("الحجز غير موجود");

  const newEndsAt = addMinutes(newStartsAt, appt.service.durationMinutes);

  const conflict = await db.appointment.findFirst({
    where: {
      tenantId,
      staffId: appt.staffId,
      id: { not: appointmentId },
      status: { in: ["pending_deposit", "confirmed"] },
      startsAt: { lt: newEndsAt },
      endsAt: { gt: newStartsAt },
    },
  });
  if (conflict) throw new Error("عذراً، هذا الموعد حُجز للتو. اختاري وقتاً آخر.");

  return db.appointment.update({
    where: { id: appointmentId },
    data: { startsAt: newStartsAt, endsAt: newEndsAt, rescheduledAt: new Date() },
  });
}

async function generateUniqueBookingCode(attempt = 0): Promise<string> {
  const code = generateBookingCode();
  const exists = await db.appointment.findUnique({ where: { bookingCode: code } });
  if (exists) {
    if (attempt > 5) throw new Error("تعذر توليد رقم حجز فريد");
    return generateUniqueBookingCode(attempt + 1);
  }
  return code;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
