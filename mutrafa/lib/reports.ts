import { db } from "./db";
import { localMonthBounds, addDays, localDayKey } from "./time";

/**
 * التقارير — كل التقارير تُحسب بتوقيت الصالون.
 * الحجز "المؤكد" يُحسب بتاريخ الموعد، والعربون المحصّل بتاريخ الدفع.
 */

export interface PeriodSummary {
  from: Date;
  to: Date;
  bookingsCreated: number;
  confirmed: number;
  completed: number;
  noShow: number;
  cancelled: number;
  serviceRevenueHalalas: number; // سعر الخدمات المكتملة
  depositsCollectedHalalas: number; // العربون المحصّل (مدفوعات PAID)
  noShowDepositHalalas: number; // عربون محصّل من غير الحاضرات — ربح صافٍ
  newCustomers: number;
  topServices: { name: string; count: number }[];
  cancellationRate: number; // 0..1
  noShowRate: number; // 0..1
  depositCollectionRate: number; // 0..1 — نسبة الحجوزات التي دُفع عربونها
}

export async function periodSummary(
  salonId: string,
  from: Date,
  to: Date
): Promise<PeriodSummary> {
  const [appointments, payments, newCustomers] = await Promise.all([
    db.appointment.findMany({
      where: { salonId, startsAt: { gte: from, lt: to } },
      select: {
        status: true,
        priceHalalas: true,
        depositHalalas: true,
        service: { select: { name: true } },
        payments: { where: { status: "PAID" }, select: { amountHalalas: true } },
      },
    }),
    db.payment.aggregate({
      where: { salonId, kind: "DEPOSIT", status: "PAID", paidAt: { gte: from, lt: to } },
      _sum: { amountHalalas: true },
    }),
    db.customer.count({ where: { salonId, createdAt: { gte: from, lt: to } } }),
  ]);

  const bookingsCreated = appointments.length;
  const byStatus = (s: string) => appointments.filter((a) => a.status === s).length;
  const confirmed = byStatus("CONFIRMED");
  const completed = byStatus("COMPLETED");
  const noShow = byStatus("NO_SHOW");
  const cancelled = byStatus("CANCELLED");
  const paidAppointments = appointments.filter((a) => a.payments.length > 0).length;

  const serviceCounts = new Map<string, number>();
  for (const a of appointments) {
    if (a.status === "CANCELLED" || a.status === "EXPIRED") continue;
    serviceCounts.set(a.service.name, (serviceCounts.get(a.service.name) ?? 0) + 1);
  }
  const topServices = [...serviceCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const noShowDepositHalalas = appointments
    .filter((a) => a.status === "NO_SHOW")
    .reduce((sum, a) => sum + a.payments.reduce((p, x) => p + x.amountHalalas, 0), 0);

  const serviceRevenueHalalas = appointments
    .filter((a) => a.status === "COMPLETED")
    .reduce((sum, a) => sum + a.priceHalalas, 0);

  const countable = bookingsCreated - byStatus("EXPIRED");
  return {
    from,
    to,
    bookingsCreated,
    confirmed,
    completed,
    noShow,
    cancelled,
    serviceRevenueHalalas,
    depositsCollectedHalalas: payments._sum.amountHalalas ?? 0,
    noShowDepositHalalas,
    newCustomers,
    topServices,
    cancellationRate: countable > 0 ? cancelled / countable : 0,
    noShowRate: countable > 0 ? noShow / countable : 0,
    depositCollectionRate: countable > 0 ? paidAppointments / countable : 0,
  };
}

/** التقرير الشهري (الشهر المحلي الحالي) */
export async function monthlyReport(salonId: string, timeZone: string, now = new Date()) {
  const { start, end } = localMonthBounds(now, timeZone);
  return periodSummary(salonId, start, end);
}

/** التقرير الأسبوعي: آخر 7 أيام */
export async function weeklyReport(salonId: string, now = new Date()) {
  return periodSummary(salonId, addDays(now, -7), now);
}

/** عمولة كل موظفة من الخدمات المكتملة في الشهر (الذهبية وما فوق) */
export async function commissionReport(salonId: string, timeZone: string, now = new Date()) {
  const { start, end } = localMonthBounds(now, timeZone);
  const calendars = await db.calendar.findMany({
    where: { salonId },
    select: {
      id: true,
      name: true,
      commissionBps: true,
      appointments: {
        where: { status: "COMPLETED", startsAt: { gte: start, lt: end } },
        select: { priceHalalas: true },
      },
    },
    orderBy: { name: "asc" },
  });
  return calendars.map((c) => {
    const revenue = c.appointments.reduce((sum, a) => sum + a.priceHalalas, 0);
    return {
      calendarId: c.id,
      name: c.name,
      completed: c.appointments.length,
      revenueHalalas: revenue,
      commissionPercent: c.commissionBps / 100,
      commissionHalalas: Math.round((revenue * c.commissionBps) / 10_000),
    };
  });
}

/** عدد الحجوزات لكل يوم محلي في الفترة (الأيام بلا حجوزات تظهر بصفر) */
export async function dailyBookings(
  salonId: string,
  from: Date,
  to: Date,
  timeZone: string
): Promise<{ day: string; count: number; completed: number }[]> {
  const rows = await db.appointment.findMany({
    where: { salonId, startsAt: { gte: from, lt: to }, status: { notIn: ["CANCELLED", "EXPIRED"] } },
    select: { startsAt: true, status: true },
  });
  const byDay = new Map<string, { count: number; completed: number }>();
  for (const r of rows) {
    const key = localDayKey(r.startsAt, timeZone);
    const entry = byDay.get(key) ?? { count: 0, completed: 0 };
    entry.count += 1;
    if (r.status === "COMPLETED") entry.completed += 1;
    byDay.set(key, entry);
  }
  const days: { day: string; count: number; completed: number }[] = [];
  for (let cur = from; cur < to; cur = addDays(cur, 1)) {
    const key = localDayKey(cur, timeZone);
    if (days.length && days[days.length - 1].day === key) continue;
    const entry = byDay.get(key) ?? { count: 0, completed: 0 };
    days.push({ day: key, ...entry });
  }
  return days;
}
