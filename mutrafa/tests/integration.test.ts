/**
 * اختبارات تكامل على قاعدة بيانات PostgreSQL حقيقية (DATABASE_URL).
 * كل اختبار ينشئ صالوناته الخاصة بروابط فريدة ثم يحذفها في النهاية.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { db } from "../lib/db";
import { loadSalonContext } from "../lib/salon-context";
import { createBooking, startDepositPayment, cancelAppointment, markAppointmentOutcome, availableSlotsFor, BookingError, DEPOSIT_HOLD_MINUTES } from "../lib/booking";
import { markPaymentPaid, startPlanPurchase, startAddonPurchase, verifyMoyasarWebhookToken } from "../lib/payments";
import { runScheduledJobs } from "../lib/jobs";
import { monthlyReport, commissionReport } from "../lib/reports";
import { buildInboundReply, verifyMetaSignature } from "../lib/whatsapp";
import { canUse, assertCan, ForbiddenError } from "../lib/guard";
import { addDays, addHours, addMinutes, localDayKey, zonedToUtc, localDayBounds } from "../lib/time";
import { entitlementsFor } from "../lib/plans";
import { createHmac } from "crypto";
import { generateBookingCode } from "../lib/booking-code";

const TZ = "Asia/Riyadh";
const RUN = Date.now().toString(36);
const created: string[] = [];
let counter = 0;

type MakeOpts = {
  plan: "INDIE" | "SILVER" | "GOLD" | "DIAMOND";
  status?: "TRIALING" | "ACTIVE" | "SUSPENDED";
  trialEndsAt?: Date | null;
  periodEnd?: Date;
  cancellationHours?: number;
  depositHalalas?: number;
  serviceCancellationHours?: number | null;
  calendars?: number;
};

/** صالون اختبار كامل: اشتراك + تقويمات + خدمات (واحدة بعربون، وأخرى بسياسة إلغاء خاصة) */
async function makeSalon(opts: MakeOpts) {
  const slug = `it-${RUN}-${++counter}`;
  const trialEnd = opts.trialEndsAt === undefined ? addDays(new Date(), 14) : opts.trialEndsAt;
  const salon = await db.salon.create({
    data: {
      name: `اختبار ${opts.plan} ${counter}`,
      slug,
      whatsappNumber: "966500000001",
      timezone: TZ,
      cancellationHours: opts.cancellationHours ?? 24,
      subscription: {
        create: {
          plan: opts.plan,
          status: opts.status ?? "TRIALING",
          trialEndsAt: trialEnd,
          currentPeriodEnd: opts.periodEnd ?? addDays(new Date(), 30),
        },
      },
    },
  });
  created.push(salon.id);

  const deposit = opts.depositHalalas ?? 5000;
  const depositService = await db.service.create({
    data: { salonId: salon.id, name: "صبغة", durationMinutes: 60, priceHalalas: 30000, depositHalalas: deposit },
  });
  const freeService = await db.service.create({
    data: {
      salonId: salon.id,
      name: "مانيكير",
      durationMinutes: 45,
      priceHalalas: 8000,
      depositHalalas: 0,
      cancellationHours: opts.serviceCancellationHours ?? null,
    },
  });
  const calendars = [];
  for (let i = 0; i < (opts.calendars ?? 1); i++) {
    calendars.push(
      await db.calendar.create({
        data: {
          salonId: salon.id,
          name: `موظفة ${i + 1}`,
          workingHours: { start: "09:00", end: "21:00", days: [0, 1, 2, 3, 4, 5, 6] },
          commissionBps: 1500,
          services: { create: [{ serviceId: depositService.id }, { serviceId: freeService.id }] },
        },
      })
    );
  }
  return { salon, depositService, freeService, calendars };
}

/** أول موعد متاح بعد 3 أيام في تقويم الصالون */
async function firstFreeSlot(salonId: string, calendarId: string, serviceId: string) {
  const salon = await db.salon.findUniqueOrThrow({ where: { id: salonId } });
  const day = addDays(new Date(), 3);
  const dayKey = localDayKey(day, TZ);
  const slots = await availableSlotsFor({ salonId, calendarId, serviceId, dayKey, timeZone: salon.timezone });
  assert.ok(slots.length > 0, "يجب أن يوجد موعد متاح");
  return slots[0];
}

async function bookingInput(salonId: string, serviceId: string, calendarId: string, startsAt: Date, phone = "0512345678") {
  return {
    salonId,
    serviceId,
    calendarId,
    startsAt,
    customerName: "عميلة اختبار",
    customerPhone: phone,
    source: "LINK" as const,
  };
}

before(() => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL مطلوب لاختبارات التكامل");
});

after(async () => {
  if (created.length) await db.salon.deleteMany({ where: { id: { in: created } } });
  await db.$disconnect();
});

// ─── الحجز والعربون ───────────────────────────────────────────

test("حجز مع عربون: يبقى بانتظار الدفع ثم يتأكد بعد الدفع (مرة واحدة فقط)", async () => {
  const { salon, depositService, calendars } = await makeSalon({ plan: "GOLD", status: "ACTIVE", trialEndsAt: null });
  const ctx = await loadSalonContext(salon.id);
  const startsAt = await firstFreeSlot(salon.id, calendars[0].id, depositService.id);

  const appt = await createBooking(await bookingInput(salon.id, depositService.id, calendars[0].id, startsAt), ctx);
  assert.equal(appt.status, "PENDING_DEPOSIT");
  assert.ok(appt.holdUntil, "يجب أن يكون للحجز مهلة");
  assert.equal(appt.holdUntil!.getTime() - Date.now() > (DEPOSIT_HOLD_MINUTES - 2) * 60_000, true);
  assert.equal(appt.customer.phone, "966512345678", "الجوال يُوحَّد على الصيغة الدولية");

  const checkout = await startDepositPayment(appt.id);
  assert.ok(checkout?.url, "يجب أن ينشأ رابط دفع");
  const payment = await db.payment.findUniqueOrThrow({ where: { providerRef: checkout!.providerRef } });
  assert.equal(payment.status, "PENDING");

  assert.equal(await markPaymentPaid(checkout!.providerRef, "mada"), true);
  const confirmed = await db.appointment.findUniqueOrThrow({ where: { id: appt.id } });
  assert.equal(confirmed.status, "CONFIRMED");
  assert.equal(confirmed.holdUntil, null);
  assert.ok(confirmed.confirmedAt);

  assert.equal(await markPaymentPaid(checkout!.providerRef, "mada"), false, "الاستدعاء الثاني لا يكرر أي أثر");
});

test("خدمة بلا عربون: تُؤكَّد مباشرة", async () => {
  const { salon, freeService, calendars } = await makeSalon({ plan: "INDIE", status: "ACTIVE", trialEndsAt: null });
  const ctx = await loadSalonContext(salon.id);
  const startsAt = await firstFreeSlot(salon.id, calendars[0].id, freeService.id);
  const appt = await createBooking(await bookingInput(salon.id, freeService.id, calendars[0].id, startsAt), ctx);
  assert.equal(appt.status, "CONFIRMED");
  assert.equal(await startDepositPayment(appt.id), null);
});

test("تعارض المواعيد: الحجز الثاني في الوقت نفسه يُرفض", async () => {
  const { salon, freeService, calendars } = await makeSalon({ plan: "SILVER", status: "ACTIVE", trialEndsAt: null });
  const ctx = await loadSalonContext(salon.id);
  const startsAt = await firstFreeSlot(salon.id, calendars[0].id, freeService.id);
  await createBooking(await bookingInput(salon.id, freeService.id, calendars[0].id, startsAt), ctx);
  await assert.rejects(
    createBooking(await bookingInput(salon.id, freeService.id, calendars[0].id, startsAt, "0500000009"), ctx),
    (e: unknown) => e instanceof BookingError && /لم يعد متاحاً|حُجز للتو/.test((e as Error).message)
  );
});

test("قيد قاعدة البيانات يمنع التعارض حتى عند تجاوز تحقق التطبيق", async () => {
  const { salon, freeService, calendars } = await makeSalon({ plan: "SILVER", status: "ACTIVE", trialEndsAt: null });
  const startsAt = new Date(Date.now() + 5 * 86_400_000);
  startsAt.setUTCMinutes(0, 0, 0);
  const customer = await db.customer.create({ data: { salonId: salon.id, phone: "966511111111", name: "أ" } });
  const base = {
    salonId: salon.id,
    customerId: customer.id,
    calendarId: calendars[0].id,
    serviceId: freeService.id,
    priceHalalas: 100,
    startsAt,
    endsAt: addMinutes(startsAt, 45),
    status: "CONFIRMED" as const,
  };
  await db.appointment.create({ data: { ...base, code: generateBookingCode() } });
  await assert.rejects(
    db.appointment.create({ data: { ...base, code: generateBookingCode(), startsAt: addMinutes(startsAt, 20), endsAt: addMinutes(startsAt, 65) } }),
    /appointments_no_calendar_overlap|exclusion/i
  );
  // الملغى لا يحجز الوقت — مسموح
  await db.appointment.create({
    data: { ...base, code: generateBookingCode(), status: "CANCELLED", startsAt: addMinutes(startsAt, 20), endsAt: addMinutes(startsAt, 65) },
  });
});

test("رفض موعد خارج ساعات العمل أو خدمة لا تقدّمها الموظفة", async () => {
  const { salon, freeService, depositService, calendars } = await makeSalon({ plan: "GOLD", status: "ACTIVE", trialEndsAt: null });
  const ctx = await loadSalonContext(salon.id);
  const night = zonedToUtc(addDays(new Date(), 3).getUTCFullYear(), addDays(new Date(), 3).getUTCMonth() + 1, addDays(new Date(), 3).getUTCDate(), 23, 0, TZ);
  await assert.rejects(createBooking(await bookingInput(salon.id, freeService.id, calendars[0].id, night), ctx), BookingError);

  const other = await db.service.create({ data: { salonId: salon.id, name: "غير مربوطة", durationMinutes: 30, priceHalalas: 100 } });
  const startsAt = await firstFreeSlot(salon.id, calendars[0].id, depositService.id);
  await assert.rejects(createBooking(await bookingInput(salon.id, other.id, calendars[0].id, startsAt), ctx), /لا تقدّم هذه الخدمة/);
});

test("الصالون المتوقف أو انتهت تجربته لا يقبل حجوزات", async () => {
  const expired = await makeSalon({ plan: "SILVER", status: "TRIALING", trialEndsAt: addDays(new Date(), -1) });
  const ctxExpired = await loadSalonContext(expired.salon.id);
  assert.equal(ctxExpired.access, "trial_expired");
  assert.equal(ctxExpired.bookingsOpen, false);
  const start = await db.salon.findUniqueOrThrow({ where: { id: expired.salon.id } });
  void start;
  await assert.rejects(
    createBooking(await bookingInput(expired.salon.id, expired.freeService.id, expired.calendars[0].id, addDays(new Date(), 3)), ctxExpired),
    /متوقف مؤقتاً/
  );

  const suspended = await makeSalon({ plan: "GOLD", status: "SUSPENDED", trialEndsAt: null });
  const ctxSusp = await loadSalonContext(suspended.salon.id);
  assert.equal(ctxSusp.bookingsOpen, false);
});

test("حد الحجوزات الشهري: الإنديه تبلغ 120 حجزاً فتُرفض الحجوزات التالية", async () => {
  const { salon, freeService, calendars } = await makeSalon({ plan: "INDIE", status: "ACTIVE", trialEndsAt: null });
  const cust = await db.customer.create({ data: { salonId: salon.id, phone: "966522222222", name: "س" } });
  const today = new Date();
  for (let i = 0; i < 120; i++) {
    const s = addMinutes(zonedToUtc(today.getUTCFullYear(), today.getUTCMonth() + 1, Math.min(today.getUTCDate(), 28), 9, 0, TZ), i * 45);
    await db.appointment.create({
      data: {
        salonId: salon.id,
        code: generateBookingCode().padEnd(9, "X"),
        customerId: cust.id,
        calendarId: calendars[0].id,
        serviceId: freeService.id,
        priceHalalas: 8000,
        startsAt: s,
        endsAt: addMinutes(s, 45),
        status: "COMPLETED",
      },
    });
  }
  const ctx = await loadSalonContext(salon.id);
  assert.equal(ctx.usage.monthlyBookings, 120);
  assert.equal(ctx.remaining.monthlyBookings, 0);
  await assert.rejects(
    createBooking(await bookingInput(salon.id, freeService.id, calendars[0].id, addDays(new Date(), 4)), ctx),
    /حد الحجوزات الشهري/
  );
});

// ─── الإلغاء وقائمة الانتظار والنتائج ─────────────────────────

test("سياسة الإلغاء الخاصة بالخدمة تُطبَّق في الذهبية فقط", async () => {
  // موعد بعد 30 ساعة: خدمة بسياسة 48 ساعة → متأخر في الذهبية، مجاني في الفضية (تتجاهل سياسة الخدمة)
  for (const [plan, expectedFree] of [["GOLD", false], ["SILVER", true]] as const) {
    const { salon, freeService, calendars } = await makeSalon({ plan, status: "ACTIVE", trialEndsAt: null, serviceCancellationHours: 48, cancellationHours: 24 });
    const ctx = await loadSalonContext(salon.id);
    const startsAt = addHours(new Date(), 30);
    startsAt.setUTCMinutes(0, 0, 0);
    const appt = await db.appointment.create({
      data: {
        salonId: salon.id,
        code: generateBookingCode().padEnd(9, "Z"),
        customerId: (await db.customer.create({ data: { salonId: salon.id, phone: "966533333333", name: "ك" } })).id,
        calendarId: calendars[0].id,
        serviceId: freeService.id,
        priceHalalas: 8000,
        startsAt,
        endsAt: addMinutes(startsAt, 45),
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });
    void ctx;
    const result = await cancelAppointment({ salonId: salon.id, appointmentId: appt.id, byCustomer: true, reason: "اختبار" });
    assert.equal(result.freeCancellation, expectedFree, `${plan}`);
  }
});

test("قائمة الانتظار التلقائية (الذهبية): تحرّر موعد يُخطر العميلة الأولى، والفضية لا تفعل ذلك", async () => {
  for (const plan of ["GOLD", "SILVER"] as const) {
    const { salon, freeService, calendars } = await makeSalon({ plan, status: "ACTIVE", trialEndsAt: null });
    const ctx = await loadSalonContext(salon.id);
    const startsAt = await firstFreeSlot(salon.id, calendars[0].id, freeService.id);
    const appt = await createBooking(await bookingInput(salon.id, freeService.id, calendars[0].id, startsAt), ctx);
    const waiting = await db.customer.create({ data: { salonId: salon.id, phone: "966544444444", name: "انتظار" } });
    const entry = await db.waitlistEntry.create({ data: { salonId: salon.id, customerId: waiting.id, serviceId: freeService.id } });

    await cancelAppointment({ salonId: salon.id, appointmentId: appt.id, byCustomer: false, reason: "اختبار", userId: null });
    const after = await db.waitlistEntry.findUniqueOrThrow({ where: { id: entry.id } });
    if (plan === "GOLD") {
      assert.equal(after.status, "NOTIFIED");
      assert.ok(after.notifiedAt);
    } else {
      assert.equal(after.status, "WAITING", "الفضية لا تملك الإشعار التلقائي");
    }
  }
});

test("تعليم الحضور/الغياب: عداد الغياب يرتفع، ومكتمل يُرسل طلب التقييم", async () => {
  const { salon, freeService, calendars } = await makeSalon({ plan: "GOLD", status: "ACTIVE", trialEndsAt: null });
  const actor = await db.user.create({ data: { salonId: salon.id, email: `o${RUN}${counter}@x.test`, passwordHash: "x", name: "م", role: "OWNER" } });
  const ctx = await loadSalonContext(salon.id);
  const startsAt = await firstFreeSlot(salon.id, calendars[0].id, freeService.id);
  const appt = await createBooking(await bookingInput(salon.id, freeService.id, calendars[0].id, startsAt, "0555555555"), ctx);
  await db.appointment.update({ where: { id: appt.id }, data: { status: "CONFIRMED" } });

  await markAppointmentOutcome({ salonId: salon.id, appointmentId: appt.id, outcome: "NO_SHOW", userId: actor.id });
  const customer = await db.customer.findUniqueOrThrow({ where: { id: appt.customerId } });
  assert.equal(customer.noShowCount, 1);

  const appt2 = await createBooking(
    await bookingInput(salon.id, freeService.id, calendars[0].id, addMinutes(startsAt, 60), "0555555556"),
    await loadSalonContext(salon.id)
  );
  await db.appointment.update({ where: { id: appt2.id }, data: { status: "CONFIRMED" } });
  await markAppointmentOutcome({ salonId: salon.id, appointmentId: appt2.id, outcome: "COMPLETED", userId: actor.id });
  const logs = await db.messageLog.count({ where: { appointmentId: appt2.id, body: { contains: "شاركينا" } } });
  assert.equal(logs, 1, "رسالة طلب التقييم تُسجَّل (وضع المحاكاة بدون مفاتيح واتساب)");
});

// ─── الاشتراكات والإضافات ─────────────────────────────────────

test("تغيير الباقة لا يُفعَّل قبل الدفع، ثم يُفعَّل بعده", async () => {
  const { salon } = await makeSalon({ plan: "INDIE", status: "ACTIVE", trialEndsAt: null });
  const user = await db.user.create({ data: { salonId: salon.id, email: `u${RUN}${counter}@x.test`, passwordHash: "x", name: "م", role: "OWNER" } });
  const checkout = await startPlanPurchase({ salonId: salon.id, userId: user.id, plan: "DIAMOND" });
  const before = await db.subscription.findUniqueOrThrow({ where: { salonId: salon.id } });
  assert.equal(before.plan, "INDIE", "الباقة لا تتغير قبل الدفع");
  assert.equal(before.pendingPlan, "DIAMOND");

  const pay = await db.payment.findUniqueOrThrow({ where: { providerRef: checkout.providerRef } });
  assert.equal(pay.amountHalalas, 999 * 100);
  await markPaymentPaid(checkout.providerRef, "visa");
  const after = await db.subscription.findUniqueOrThrow({ where: { salonId: salon.id } });
  assert.equal(after.plan, "DIAMOND");
  assert.equal(after.pendingPlan, null);
  assert.equal(after.status, "ACTIVE");
  assert.ok(after.currentPeriodEnd > new Date());
});

test("إضافة تقويم تُفعَّل بعد الدفع فقط وترفع حد التقويمات", async () => {
  const { salon } = await makeSalon({ plan: "SILVER", status: "ACTIVE", trialEndsAt: null });
  const user = await db.user.create({ data: { salonId: salon.id, email: `a${RUN}${counter}@x.test`, passwordHash: "x", name: "م", role: "OWNER" } });
  const before = await loadSalonContext(salon.id);
  assert.equal(before.entitlements.calendars, 5);

  const checkout = await startAddonPurchase({ salonId: salon.id, userId: user.id, kind: "EXTRA_CALENDAR", quantity: 2 });
  assert.equal((await loadSalonContext(salon.id)).entitlements.calendars, 5, "لا تفعيل قبل الدفع");
  await markPaymentPaid(checkout.providerRef, "mada");
  assert.equal((await loadSalonContext(salon.id)).entitlements.calendars, 7);
});

test("أثناء التجربة تُطبَّق ميزات الذهبية، وبعدها تعود إلى باقة الصالون", async () => {
  const trial = await makeSalon({ plan: "INDIE", status: "TRIALING", trialEndsAt: addDays(new Date(), 10) });
  const ctxTrial = await loadSalonContext(trial.salon.id);
  assert.equal(ctxTrial.plan, "GOLD");
  assert.equal(ctxTrial.access, "trial");
  assert.equal(ctxTrial.bookingsOpen, true);

  const expired = await makeSalon({ plan: "INDIE", status: "TRIALING", trialEndsAt: addDays(new Date(), -2) });
  const ctxExp = await loadSalonContext(expired.salon.id);
  assert.equal(ctxExp.plan, "INDIE");
  assert.equal(ctxExp.entitlements.features.has("waitlist.auto"), false);
});

// ─── التقارير والمهام المجدولة ────────────────────────────────

test("عمولة الموظفة تُحسب من الخدمات المكتملة (الذهبية)", async () => {
  const { salon, freeService, calendars } = await makeSalon({ plan: "GOLD", status: "ACTIVE", trialEndsAt: null });
  const cust = await db.customer.create({ data: { salonId: salon.id, phone: "966566666666", name: "ع" } });
  const day = new Date();
  const base = zonedToUtc(day.getUTCFullYear(), day.getUTCMonth() + 1, Math.min(day.getUTCDate(), 27), 10, 0, TZ);
  for (let i = 0; i < 2; i++) {
    await db.appointment.create({
      data: {
        salonId: salon.id,
        code: generateBookingCode().padEnd(9, "Q"),
        customerId: cust.id,
        calendarId: calendars[0].id,
        serviceId: freeService.id,
        priceHalalas: 10000,
        startsAt: addMinutes(base, i * 60),
        endsAt: addMinutes(base, i * 60 + 45),
        status: "COMPLETED",
      },
    });
  }
  const rows = await commissionReport(salon.id, TZ, new Date());
  const row = rows.find((r) => r.calendarId === calendars[0].id)!;
  assert.equal(row.completed, 2);
  assert.equal(row.revenueHalalas, 20000);
  assert.equal(row.commissionPercent, 15);
  assert.equal(row.commissionHalalas, 3000, "15% من 200 ريال = 30 ريالاً");

  const report = await monthlyReport(salon.id, TZ, new Date());
  assert.ok(report.completed >= 2);
});

test("المهام المجدولة: تذكير 24 ساعة مرة واحدة فقط، وتحرير مهلة العربون المنتهية", async () => {
  const { salon, freeService, calendars } = await makeSalon({ plan: "GOLD", status: "ACTIVE", trialEndsAt: null });
  const cust = await db.customer.create({ data: { salonId: salon.id, phone: "966577777777", name: "ت" } });
  const now = new Date();
  const tomorrowStart = addHours(now, 24);
  tomorrowStart.setUTCMinutes(0, 0, 0);
  const reminderAppt = await db.appointment.create({
    data: {
      salonId: salon.id,
      code: generateBookingCode().padEnd(9, "W"),
      customerId: cust.id,
      calendarId: calendars[0].id,
      serviceId: freeService.id,
      priceHalalas: 8000,
      startsAt: tomorrowStart,
      endsAt: addMinutes(tomorrowStart, 45),
      status: "CONFIRMED",
      confirmedAt: now,
    },
  });
  const staleHold = await db.appointment.create({
    data: {
      salonId: salon.id,
      code: generateBookingCode().padEnd(9, "V"),
      customerId: cust.id,
      calendarId: calendars[0].id,
      serviceId: freeService.id,
      priceHalalas: 8000,
      startsAt: addDays(now, 6),
      endsAt: addMinutes(addDays(now, 6), 45),
      status: "PENDING_DEPOSIT",
      holdUntil: addMinutes(now, -5),
      depositHalalas: 5000,
    },
  });

  const first = await runScheduledJobs(now);
  assert.ok(first.reminders >= 1);
  assert.equal((await db.appointment.findUniqueOrThrow({ where: { id: reminderAppt.id } })).reminderSentAt !== null, true);
  assert.equal((await db.appointment.findUniqueOrThrow({ where: { id: staleHold.id } })).status, "EXPIRED");

  const second = await runScheduledJobs(now);
  const dup = await db.messageLog.count({ where: { appointmentId: reminderAppt.id, body: { contains: "تذكير" } } });
  assert.equal(dup, 1, "لا تذكير مكرراً");
  assert.ok(second.reminders <= first.reminders);
});

// ─── الصلاحيات والـ webhooks (تحقق) ───────────────────────────

test("الأدوار: الاستقبال لا تُدير الخدمات، والمشرفة لا ترى سجل التدقيق", async () => {
  const { salon } = await makeSalon({ plan: "DIAMOND", status: "ACTIVE", trialEndsAt: null });
  const ctx = await loadSalonContext(salon.id);
  assert.equal(canUse({ role: "RECEPTIONIST" }, ctx, "services.manage"), false);
  assert.equal(canUse({ role: "RECEPTIONIST" }, ctx, "appointments.manage"), true);
  assert.equal(canUse({ role: "MANAGER" }, ctx, "audit.view"), false);
  assert.equal(canUse({ role: "OWNER" }, ctx, "audit.view"), true);
  assert.throws(() => assertCan({ role: "RECEPTIONIST" }, ctx, "reports.view"), ForbiddenError);
});

test("الميزة المقفلة بالباقة تُمنع حتى للمالكة (الفضية لا تملك العمولات)", async () => {
  const { salon } = await makeSalon({ plan: "SILVER", status: "ACTIVE", trialEndsAt: null });
  const ctx = await loadSalonContext(salon.id);
  assert.equal(canUse({ role: "OWNER" }, ctx, "commission.view"), false);
  assert.equal(canUse({ role: "OWNER" }, ctx, "waitlist.manage"), true);
  assert.equal(entitlementsFor("SILVER").features.has("commission"), false);
});

test("webhook: رمز Moyasar يُقارَن بأمان، وتوقيع Meta يُتحقق منه", () => {
  process.env.MOYASAR_WEBHOOK_SECRET = "secret-123";
  assert.equal(verifyMoyasarWebhookToken("secret-123"), true);
  assert.equal(verifyMoyasarWebhookToken("secret-124"), false);
  assert.equal(verifyMoyasarWebhookToken(null), false);

  const body = JSON.stringify({ hello: "world" });
  const sig = "sha256=" + createHmac("sha256", "app-secret").update(body).digest("hex");
  assert.equal(verifyMetaSignature(body, sig, "app-secret"), true);
  assert.equal(verifyMetaSignature(body + " ", sig, "app-secret"), false);
  assert.equal(verifyMetaSignature(body, null, "app-secret"), false);
});

test("الرد الآلي واتساب: 1 يرسل رابط الحجز، و٢ للاستفسار، وغير ذلك القائمة", () => {
  const base = { salonName: "لومينا", slug: "lumina", contactPhone: "966501110003" };
  assert.match(buildInboundReply({ ...base, text: "1" }), /mutrafa\.d-alal\.com\/lumina|\/lumina/);
  assert.match(buildInboundReply({ ...base, text: "٢" }), /0501110003/);
  assert.match(buildInboundReply({ ...base, text: "مرحبا" }), /1 — حجز موعد/);
});

test("توافر الأيام المحلية: حدود اليوم بتوقيت الرياض", () => {
  const { start, end } = localDayBounds("2026-11-01", TZ);
  assert.equal(start.toISOString(), "2026-10-31T21:00:00.000Z");
  assert.equal(end.toISOString(), "2026-11-01T21:00:00.000Z");
});

test("الحجز على شبكة كل ربع ساعة: 15 دقيقة مقبولة، و5 دقائق مرفوضة (للعامة ولوحة التحكم)", async () => {
  const { salon, freeService, calendars } = await makeSalon({ plan: "GOLD", status: "ACTIVE", trialEndsAt: null });
  const ctx = await loadSalonContext(salon.id);
  const base = await firstFreeSlot(salon.id, calendars[0].id, freeService.id);
  const plus15 = addMinutes(base, 15);
  const plus5 = addMinutes(base, 5);

  await assert.rejects(
    createBooking({ ...(await bookingInput(salon.id, freeService.id, calendars[0].id, plus5, "0561111111")), source: "LINK" }, ctx),
    BookingError
  );
  const appt = await createBooking(
    { ...(await bookingInput(salon.id, freeService.id, calendars[0].id, plus15, "0561111112")), source: "DASHBOARD" },
    ctx
  );
  assert.equal(appt.startsAt.getTime(), plus15.getTime());
});
