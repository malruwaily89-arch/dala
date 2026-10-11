import { db } from "./db";
import { expireStaleHolds, INTERNAL_PHONE } from "./booking";
import { sendWhatsAppText } from "./whatsapp";
import { bookingUrl } from "./env";
import { addHours, formatLocalDateTime } from "./time";

/**
 * المهام المجدولة — تُستدعى من /api/cron/jobs (محمية بـ CRON_SECRET) كل 15 دقيقة تقريباً.
 *  1. تحرير مهلة العربون المنتهية.
 *  2. تذكير قبل الموعد بـ 24 ساعة (مرة واحدة لكل حجز).
 * كل خطوة idempotent: إعادة التشغيل لا تُرسل تذكيراً مكرراً.
 */
export async function runScheduledJobs(now: Date = new Date()) {
  const expired = await expireStaleHolds(null, now);

  const windowStart = addHours(now, 23);
  const windowEnd = addHours(now, 25);
  const due = await db.appointment.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      customer: { phone: { not: INTERNAL_PHONE } },
      startsAt: { gt: windowStart, lte: windowEnd },
    },
    include: { customer: true, service: true, salon: true },
  });

  let reminders = 0;
  for (const appt of due) {
    // نسجّل الإرسال أولاً لمنع التكرار عند تداخل التشغيلات
    const claimed = await db.appointment.updateMany({
      where: { id: appt.id, reminderSentAt: null },
      data: { reminderSentAt: now },
    });
    if (claimed.count === 0) continue;
    await sendWhatsAppText({
      salonId: appt.salonId,
      appointmentId: appt.id,
      toPhone: appt.customer.phone,
      body: `تذكير بموعدك غداً 🌸\n${appt.service.name} — ${formatLocalDateTime(appt.startsAt, appt.salon.timezone)}\nرقم الحجز: ${appt.code}\nللتعديل أو الإلغاء: ${bookingUrl(appt.salon.slug)}/booking/${appt.code}`,
    });
    reminders++;
  }
  return { expiredHolds: expired, reminders };
}
