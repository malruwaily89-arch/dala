import { db } from "./db";
import { audit } from "./audit";
import { loadSalonContext, type SalonContext } from "./salon-context";
import { computeAvailableSlots, parseWorkingHours, SLOT_STEP_MINUTES, type BusyInterval } from "./availability";
import { allocateBookingCode } from "./booking-code";
import { createCheckout } from "./payments";
import { effectiveCancellationHours, isFreeCancellation } from "./cancellation";
import { hasFeature } from "./plans";
import { addMinutes, localDayBounds, localDayKey, formatLocalDateTime, zonedToUtc, weekdayOfDayKey } from "./time";
import { normalizeSaPhone } from "./phone";
import { sendWhatsAppText } from "./whatsapp";
import { bookingUrl } from "./env";

/** مدة الاحتفاظ بالموعد بانتظار العربون (ساعتان، كما في خطة الموقع) */
export const DEPOSIT_HOLD_MINUTES = 120;

export class BookingError extends Error {}

const ACTIVE_STATUSES = ["PENDING_DEPOSIT", "CONFIRMED"] as const;
const OVERLAP_CONSTRAINT = "appointments_no_calendar_overlap";

/** يحرّر الحجوزات المنتهية مهلتها (لا تحجز الوقت بعد الآن) */
export async function expireStaleHolds(salonId: string | null, now: Date = new Date()): Promise<number> {
  const result = await db.appointment.updateMany({
    where: {
      ...(salonId ? { salonId } : {}),
      status: "PENDING_DEPOSIT",
      holdUntil: { lt: now },
    },
    data: { status: "EXPIRED" },
  });
  return result.count;
}

interface BookingInput {
  salonId: string;
  serviceId: string;
  calendarId: string;
  startsAt: Date;
  customerName: string;
  customerPhone: string; // أي صيغة؛ نطبّعها هنا
  source: "LINK" | "WHATSAPP" | "DASHBOARD";
}

/**
 * إنشاء حجز — نفس المسار للحجز العام ولوحة التحكم ولواتساب.
 * الفحوصات: الحدود الشهرية، صحة الخدمة والموظفة، أن الموعد ضمن ساعات العمل وعلى الشبكة،
 * ثم الإدراج داخل معاملة مع قيد التعارض في قاعدة البيانات كحارس نهائي.
 */
/** هل الصالون مغلق في هذا اليوم (عطلة أو إجازة مسجّلة في الإعدادات) */
async function isClosedDay(salonId: string, dayKey: string): Promise<boolean> {
  const row = await db.closedDay.findUnique({ where: { salonId_dayKey: { salonId, dayKey } }, select: { id: true } });
  return row !== null;
}

export async function createBooking(input: BookingInput, ctx: SalonContext) {
  const phone = normalizeSaPhone(input.customerPhone);
  if (!phone) throw new BookingError("رقم الجوال غير صالح. اكتبي 9 أرقام تبدأ بـ 5 بعد رمز الدولة +966.");
  if (input.customerName.trim().length < 2) throw new BookingError("يرجى إدخال الاسم.");

  if (!ctx.bookingsOpen) throw new BookingError("الحجز متوقف مؤقتاً. يرجى المحاولة لاحقاً.");
  if (ctx.remaining.monthlyBookings <= 0) {
    throw new BookingError("تم بلوغ حد الحجوزات الشهري لهذا الصالون.");
  }

  const salon = await db.salon.findUniqueOrThrow({ where: { id: input.salonId } });
  if (await isClosedDay(input.salonId, localDayKey(input.startsAt, salon.timezone))) {
    throw new BookingError("الصالون مغلق في هذا اليوم. اختاري يوماً آخر.");
  }
  const service = await db.service.findFirst({
    where: { id: input.serviceId, salonId: input.salonId, isActive: true },
  });
  if (!service) throw new BookingError("هذه الخدمة غير متاحة.");

  const calendar = await db.calendar.findFirst({
    where: {
      id: input.calendarId,
      salonId: input.salonId,
      isActive: true,
      services: { some: { serviceId: service.id } },
    },
    include: { services: { where: { serviceId: service.id }, select: { durationMinutes: true } } },
  });
  if (!calendar) throw new BookingError("هذه الموظفة لا تقدّم هذه الخدمة.");
  // مدة الخدمة عند هذه الموظفة (إن حُددت)، وإلا المدة الافتراضية للخدمة
  const duration = calendar.services[0]?.durationMinutes ?? service.durationMinutes;

  // الموعد يجب أن يكون ضمن الفتحات المتاحة فعلاً (ساعات العمل + الشبكة + غير مشغول)
  const now = new Date();
  const dayKey = localDayKey(input.startsAt, salon.timezone);
  // لوحة التحكم تسمح بالدقة الواحدة (5 دقائق)، والحجز العام يلتزم بشبكة 30 دقيقة
  const slots = await availableSlotsFor({
    salonId: input.salonId,
    calendarId: calendar.id,
    serviceId: service.id,
    dayKey,
    timeZone: salon.timezone,
    now,
    durationMinutes: duration,
    workingHours: calendar.workingHours,
    stepMinutes: SLOT_STEP_MINUTES,
  });
  if (!slots.some((s) => s.getTime() === input.startsAt.getTime())) {
    throw new BookingError("عذراً، هذا الموعد لم يعد متاحاً. اختاري وقتاً آخر.");
  }

  const endsAt = addMinutes(input.startsAt, duration);
  const needsDeposit = service.depositHalalas > 0;

  try {
    const appointment = await db.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { salonId_phone: { salonId: input.salonId, phone } },
        update: { name: input.customerName.trim() },
        create: { salonId: input.salonId, phone, name: input.customerName.trim() },
      });
      return tx.appointment.create({
        data: {
          salonId: input.salonId,
          code: await allocateBookingCode(tx, input.salonId),
          customerId: customer.id,
          calendarId: calendar.id,
          serviceId: service.id,
          startsAt: input.startsAt,
          endsAt,
          status: needsDeposit ? "PENDING_DEPOSIT" : "CONFIRMED",
          holdUntil: needsDeposit ? addMinutes(now, DEPOSIT_HOLD_MINUTES) : null,
          confirmedAt: needsDeposit ? null : now,
          depositHalalas: service.depositHalalas,
          priceHalalas: service.priceHalalas,
          source: input.source,
        },
        include: { customer: true, service: true, calendar: true },
      });
    });

    await audit({
      salonId: input.salonId,
      action: "appointment.created",
      entityType: "appointment",
      entityId: appointment.id,
      meta: { source: input.source, status: appointment.status },
    });
    return appointment;
  } catch (e) {
    if (isOverlapError(e)) throw new BookingError("عذراً، هذا الموعد حُجز للتو. اختاري وقتاً آخر.");
    throw e;
  }
}

/** بعد إنشاء الحجز: إن كان عليه عربون يُنشأ له checkout ويُعاد رابط الدفع */
export async function startDepositPayment(appointmentId: string) {
  const appt = await db.appointment.findUniqueOrThrow({
    where: { id: appointmentId },
    include: { service: true, salon: true },
  });
  if (appt.status !== "PENDING_DEPOSIT" || appt.depositHalalas <= 0) {
    return null;
  }
  const payment = await db.payment.create({
    data: {
      salonId: appt.salonId,
      kind: "DEPOSIT",
      amountHalalas: appt.depositHalalas,
      appointmentId: appt.id,
      providerRef: `pending_${appt.id}_${Date.now()}`,
    },
  });
  const checkout = await createCheckout({
    amountHalalas: appt.depositHalalas,
    description: `عربون ${appt.service.name} — ${appt.code}`,
    successPath: `/${appt.salon.slug}/booking/${appt.code}?ok=deposit`,
    paymentId: payment.id,
  });
  await db.payment.update({ where: { id: payment.id }, data: { providerRef: checkout.providerRef } });
  return checkout;
}

/** يُستدعى من markPaymentPaid عند دفع العربون */
export async function confirmAppointmentAfterDeposit(appointmentId: string): Promise<void> {
  const appt = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { customer: true, salon: true, service: true },
  });
  if (!appt || appt.status !== "PENDING_DEPOSIT") return; // مؤكد مسبقاً أو منتهٍ — idempotent

  await db.appointment.update({
    where: { id: appt.id },
    data: { status: "CONFIRMED", confirmedAt: new Date(), holdUntil: null },
  });
  await notifyCustomer(appt.salonId, appt.id, appt.customer.phone, appointmentConfirmedMessage(appt, appt.salon.timezone));
}

/** تأكيد عربون يدوياً (تحويل بنكي) من لوحة التحكم */
export async function confirmDepositManually(salonId: string, userId: string, appointmentId: string): Promise<void> {
  const appt = await db.appointment.findFirst({ where: { id: appointmentId, salonId, status: "PENDING_DEPOSIT" } });
  if (!appt) throw new BookingError("لا يمكن تأكيد هذا الحجز.");
  await db.payment.create({
    data: {
      salonId,
      kind: "DEPOSIT",
      status: "PAID",
      amountHalalas: appt.depositHalalas,
      method: "manual_transfer",
      appointmentId,
      providerRef: `manual_${appointmentId}_${Date.now()}`,
      provider: "manual",
      paidAt: new Date(),
    },
  });
  await confirmAppointmentAfterDeposit(appointmentId);
  await audit({ salonId, userId, action: "deposit.confirmed_manually", entityType: "appointment", entityId: appointmentId });
}

/** إلغاء من الصالون أو العميلة. يحرّر الوقت ويُخطر قائمة الانتظار (الذهبية). */
export async function cancelAppointment(params: {
  salonId: string;
  appointmentId: string;
  byCustomer: boolean;
  reason: string;
  userId?: string | null;
  now?: Date;
}): Promise<{ freeCancellation: boolean }> {
  const now = params.now ?? new Date();
  const appt = await db.appointment.findFirst({
    where: { id: params.appointmentId, salonId: params.salonId, status: { in: [...ACTIVE_STATUSES] } },
    include: { service: true, salon: true, customer: true },
  });
  if (!appt) throw new BookingError("لا يمكن إلغاء هذا الحجز.");

  const ctx = await loadSalonContext(params.salonId, now);
  const hours = effectiveCancellationHours(appt.salon.cancellationHours, appt.service.cancellationHours, ctx.entitlements);
  const free = isFreeCancellation(appt.startsAt, now, hours);

  await db.appointment.update({
    where: { id: appt.id },
    data: {
      status: "CANCELLED",
      cancelledAt: now,
      cancelReason: free ? params.reason : `${params.reason} (بعد مهلة الإلغاء المجاني — العربون محتفظ به)`,
    },
  });
  await audit({
    salonId: params.salonId,
    userId: params.userId ?? null,
    action: "appointment.cancelled",
    entityType: "appointment",
    entityId: appt.id,
    meta: { byCustomer: params.byCustomer, freeCancellation: free },
  });

  await notifyCustomer(
    params.salonId,
    appt.id,
    appt.customer.phone,
    `تم إلغاء الحجز ${appt.code}. ${free ? "" : "ملاحظة: الإلغاء بعد مهلة الإلغاء المجاني، والعربون محتفظ به وفق السياسة. "}نتمنى رؤيتك قريباً 🌸`
  );

  if (hasFeature(ctx.entitlements, "waitlist.auto")) {
    await notifyWaitlistForFreedSlot(params.salonId, appt.serviceId, appt.startsAt);
  }
  return { freeCancellation: free };
}

/** تعليم الموعد: مكتمل (ويُرسل طلب التقييم) أو لم تحضر (يرفع عداد العميلة) */
export async function markAppointmentOutcome(params: {
  salonId: string;
  appointmentId: string;
  outcome: "COMPLETED" | "NO_SHOW";
  userId: string;
}): Promise<void> {
  const appt = await db.appointment.findFirst({
    where: { id: params.appointmentId, salonId: params.salonId, status: "CONFIRMED" },
    include: { customer: true, salon: true },
  });
  if (!appt) throw new BookingError("لا يمكن تحديث هذا الحجز.");

  await db.$transaction(async (tx) => {
    await tx.appointment.update({ where: { id: appt.id }, data: { status: params.outcome } });
    if (params.outcome === "COMPLETED") {
      // تُخصم جلسة من أقدم باقة نشطة للعميلة لنفس الخدمة
      const packs = await tx.sessionPack.findMany({
        where: { salonId: params.salonId, customerId: appt.customerId, serviceId: appt.serviceId },
        orderBy: { createdAt: "asc" },
      });
      const pack = packs.find((p) => p.usedSessions < p.totalSessions);
      if (pack) {
        await tx.sessionPack.update({ where: { id: pack.id }, data: { usedSessions: { increment: 1 } } });
        await tx.appointment.update({ where: { id: appt.id }, data: { sessionPackId: pack.id } });
      }
    }
    if (params.outcome === "NO_SHOW") {
      await tx.customer.update({ where: { id: appt.customerId }, data: { noShowCount: { increment: 1 } } });
    }
  });

  if (params.outcome === "COMPLETED") {
    await notifyCustomer(
      params.salonId,
      appt.id,
      appt.customer.phone,
      `نتمنى أن نالت الخدمة إعجابك 🌸 شاركينا رأيك في دقيقة:\n${bookingUrl(appt.salon.slug)}/booking/${appt.code}`
    );
  }
  await audit({
    salonId: params.salonId,
    userId: params.userId,
    action: `appointment.${params.outcome.toLowerCase()}`,
    entityType: "appointment",
    entityId: appt.id,
  });
}

/** فتحات متاحة ليوم معين لموظفة وخدمة (تستخدمها الصفحة العامة ولوحة التحكم) */
export async function availableSlotsFor(params: {
  salonId: string;
  calendarId: string;
  serviceId: string;
  dayKey: string;
  timeZone: string;
  now?: Date;
  durationMinutes?: number;
  workingHours?: unknown;
  stepMinutes?: number;
}) {
  if (await isClosedDay(params.salonId, params.dayKey)) return [];
  // المدة الفعلية = مدة الموظفة للخدمة إن وُجدت، وإلا مدة الخدمة الافتراضية
  const duration =
    params.durationMinutes ??
    (await (async () => {
      const link = await db.calendarService.findUnique({
        where: { calendarId_serviceId: { calendarId: params.calendarId, serviceId: params.serviceId } },
        select: { durationMinutes: true, service: { select: { durationMinutes: true } } },
      });
      return link?.durationMinutes ?? link?.service.durationMinutes ?? 0;
    })());
  const calendar = params.workingHours
    ? { workingHours: params.workingHours }
    : await db.calendar.findUniqueOrThrow({ where: { id: params.calendarId }, select: { workingHours: true } });

  const bounds = localDayBounds(params.dayKey, params.timeZone);
  const busyRows = await db.appointment.findMany({
    where: {
      calendarId: params.calendarId,
      salonId: params.salonId,
      status: { in: [...ACTIVE_STATUSES] },
      startsAt: { lt: bounds.end },
      endsAt: { gt: bounds.start },
      // الحجز المعلّق منتهي المهلة لا يحجز الوقت
      OR: [{ status: "CONFIRMED" }, { status: "PENDING_DEPOSIT", holdUntil: { gt: params.now ?? new Date() } }],
    },
    select: { startsAt: true, endsAt: true },
  });
  const busy: BusyInterval[] = busyRows.map((r) => ({ start: r.startsAt, end: r.endsAt }));

  return computeAvailableSlots({
    dayKey: params.dayKey,
    timeZone: params.timeZone,
    hours: parseWorkingHours(calendar.workingHours),
    durationMinutes: duration,
    busy,
    now: params.now ?? new Date(),
    stepMinutes: params.stepMinutes,
  });
}

/** الفئة: إشعار قائمة الانتظار الأولى عند تحرّر موعد — الذهبية وما فوق */
async function notifyWaitlistForFreedSlot(salonId: string, serviceId: string, freedAt: Date): Promise<void> {
  const salon = await db.salon.findUniqueOrThrow({ where: { id: salonId } });
  const entry = await db.waitlistEntry.findFirst({
    where: {
      salonId,
      serviceId,
      status: "WAITING",
      OR: [{ preferredFrom: null }, { preferredFrom: { lte: freedAt } }],
    },
    orderBy: { createdAt: "asc" },
    include: { customer: true, service: true },
  });
  if (!entry) return;
  await db.waitlistEntry.update({ where: { id: entry.id }, data: { status: "NOTIFIED", notifiedAt: new Date() } });
  await notifyCustomer(
    salonId,
    null,
    entry.customer.phone,
    `أخبار سارة 🌸 تحرّر موعد في ${entry.service.name} بتاريخ ${formatLocalDateTime(freedAt, salon.timezone)}.\nاحجزي قبل غيرك عبر: ${bookingUrl(salon.slug)}`
  );
}

export function appointmentConfirmedMessage(
  appt: { code: string; startsAt: Date; service: { name: string } },
  timeZone: string
): string {
  return `تم تأكيد حجزك ✅\nرقم الحجز: ${appt.code}\n${appt.service.name} — ${formatLocalDateTime(appt.startsAt, timeZone)}\nإلينا لقاؤك 🌸`;
}

async function notifyCustomer(salonId: string, appointmentId: string | null, phone: string, body: string) {
  // الحجز الداخلي (استراحة/تنظيف) لا يُرسل له شيء
  if (phone === INTERNAL_PHONE) return;
  // لا يفشل أي إجراء بسبب واتساب: sendWhatsAppText يسجّل الفشل داخلياً
  await sendWhatsAppText({ salonId, appointmentId, toPhone: phone, body });
}

/** رقم العميلة الداخلية لحجوزات الاستراحة والتنظيف (لا يُرسل له واتساب) */
export const INTERNAL_PHONE = "internal";

/**
 * حجز خارج قائمة الخدمات:
 *  - CUSTOM: خدمة غير مسجلة باسم ومبلغ يكتبهما الموظفة، مع عميلة حقيقية.
 *  - BLOCK : وقت داخلي (استراحة، تنظيف…) يشغل الجدول دون عميلة.
 * يلتزم بساعات العمل وشبكة 15 دقيقة، ويمنع التعارض مع أي حجز نشط.
 */
export async function createFreeformBooking(params: {
  salonId: string;
  userId: string;
  calendarId: string;
  startsAt: Date;
  durationMinutes: number;
  kind: "CUSTOM" | "BLOCK";
  label: string;
  priceHalalas: number;
  customerName?: string;
  customerPhone?: string;
}) {
  const salon = await db.salon.findUniqueOrThrow({ where: { id: params.salonId } });
  const calendar = await db.calendar.findFirst({ where: { id: params.calendarId, salonId: params.salonId, isActive: true } });
  if (!calendar) throw new BookingError("التقويم غير متاح.");

  const label = params.label.trim();
  if (label.length < 2) throw new BookingError("اكتبي اسم الخدمة.");
  if (params.priceHalalas < 0) throw new BookingError("السعر لا يكون سالباً.");
  const d = params.durationMinutes;
  if (!Number.isInteger(d) || d < 15 || d > 480 || d % 15 !== 0) {
    throw new BookingError("المدة يجب أن تكون بين 15 و480 دقيقة، وبخطوة 15 دقيقة.");
  }
  if (params.startsAt.getTime() <= Date.now()) throw new BookingError("لا يمكن الحجز في وقت مضى.");

  // ضمن ساعات عمل الموظفة بتوقيت الصالون
  const tz = salon.timezone;
  const dayKey = localDayKey(params.startsAt, tz);
  const hours = parseWorkingHours(calendar.workingHours);
  const [y, m, dd] = dayKey.split("-").map(Number);
  const [sh, sm] = hours.start.split(":").map(Number);
  const [eh, em] = hours.end.split(":").map(Number);
  const workStart = zonedToUtc(y, m, dd, sh, sm, tz).getTime();
  const workEnd = zonedToUtc(y, m, dd, eh, em, tz).getTime();
  const endsAt = addMinutes(params.startsAt, d);
  if (!hours.days.includes(weekdayOfDayKey(dayKey)) || params.startsAt.getTime() < workStart || endsAt.getTime() > workEnd) {
    throw new BookingError("الوقت خارج ساعات عمل الموظفة.");
  }

  // تعارض مع أي حجز نشط
  const clash = await db.appointment.findFirst({
    where: {
      calendarId: calendar.id,
      status: { in: [...ACTIVE_STATUSES] },
      startsAt: { lt: endsAt },
      endsAt: { gt: params.startsAt },
    },
    select: { id: true },
  });
  if (clash) throw new BookingError("هذا الوقت مشغول. اختاري وقتاً آخر.");

  // العميلة: حقيقية للخدمة الخاصة، وداخلية للاستراحة
  let customer;
  if (params.kind === "BLOCK") {
    customer = await db.customer.upsert({
      where: { salonId_phone: { salonId: params.salonId, phone: INTERNAL_PHONE } },
      update: {},
      create: { salonId: params.salonId, phone: INTERNAL_PHONE, name: "داخلي" },
    });
  } else {
    const name = (params.customerName ?? "").trim();
    const phone = normalizeSaPhone(params.customerPhone ?? "");
    if (name.length < 2) throw new BookingError("يرجى إدخال اسم العميلة.");
    if (!phone) throw new BookingError("رقم الجوال غير صالح.");
    customer = await db.customer.upsert({
      where: { salonId_phone: { salonId: params.salonId, phone } },
      update: { name },
      create: { salonId: params.salonId, phone, name },
    });
  }

  try {
    const appointment = await db.$transaction(async (tx) => {
      const service = await tx.service.create({
        data: {
          salonId: params.salonId,
          name: label,
          durationMinutes: d,
          priceHalalas: params.priceHalalas,
          depositHalalas: 0,
          kind: params.kind,
          isActive: true,
        },
      });
      return tx.appointment.create({
        data: {
          salonId: params.salonId,
          code: await allocateBookingCode(tx, params.salonId),
          customerId: customer.id,
          calendarId: calendar.id,
          serviceId: service.id,
          startsAt: params.startsAt,
          endsAt,
          status: "CONFIRMED",
          confirmedAt: new Date(),
          depositHalalas: 0,
          priceHalalas: params.priceHalalas,
          source: "DASHBOARD",
        },
      });
    });
    await audit({
      salonId: params.salonId,
      userId: params.userId,
      action: params.kind === "BLOCK" ? "slot.blocked" : "appointment.custom_created",
      entityType: "appointment",
      entityId: appointment.id,
      meta: { label, durationMinutes: d },
    });
    return appointment;
  } catch (e) {
    if (isOverlapError(e)) throw new BookingError("هذا الوقت مشغول. اختاري وقتاً آخر.");
    throw e;
  }
}

function isOverlapError(e: unknown): boolean {
  const message = e instanceof Error ? e.message : String(e);
  const code = (e as { code?: string })?.code;
  return message.includes(OVERLAP_CONSTRAINT) || code === "23P01";
}

