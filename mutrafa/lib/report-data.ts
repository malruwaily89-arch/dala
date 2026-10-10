import { db } from "./db";
import { periodSummary, dailyBookings } from "./reports";
import { remainingFreeSlots } from "./capacity";
import { addDays, localMonthBounds } from "./time";

/**
 * بيانات التقرير موحّدة لصفحة التقارير وملف الإكسل: أي رقم يظهر في أحدهما يطابق الآخر.
 */

export type ReportPeriod = "month" | "last" | "week";

export function periodRange(period: ReportPeriod, now: Date, tz: string) {
  if (period === "week") {
    return { from: addDays(now, -7), to: now, prevFrom: addDays(now, -14), prevTo: addDays(now, -7) };
  }
  const current = localMonthBounds(now, tz);
  const prev = localMonthBounds(addDays(current.start, -1), tz);
  if (period === "last") {
    const prevPrev = localMonthBounds(addDays(prev.start, -1), tz);
    return { from: prev.start, to: prev.end, prevFrom: prevPrev.start, prevTo: prevPrev.end };
  }
  return { from: current.start, to: current.end, prevFrom: prev.start, prevTo: prev.end };
}

export async function buildReport(params: {
  salonId: string;
  timeZone: string;
  period: ReportPeriod;
  quotaRemaining: number;
  now?: Date;
}) {
  const { salonId, timeZone, period, quotaRemaining } = params;
  const now = params.now ?? new Date();
  const range = periodRange(period, now, timeZone);
  const month = localMonthBounds(now, timeZone);

  const [current, previous, daily, staff, monthSummary, capacity, appointments] = await Promise.all([
    periodSummary(salonId, range.from, range.to),
    periodSummary(salonId, range.prevFrom, range.prevTo),
    dailyBookings(salonId, range.from, range.to, timeZone),
    db.calendar.findMany({
      where: { salonId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        commissionBps: true,
        appointments: {
          where: { status: "COMPLETED", startsAt: { gte: range.from, lt: range.to } },
          select: { priceHalalas: true },
        },
      },
    }),
    periodSummary(salonId, month.start, month.end),
    remainingFreeSlots(salonId, timeZone, now),
    db.appointment.findMany({
      where: { salonId, startsAt: { gte: range.from, lt: range.to }, status: { not: "EXPIRED" } },
      include: { customer: true, service: true, calendar: true },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  const staffRows = staff.map((c) => {
    const revenue = c.appointments.reduce((sum, a) => sum + a.priceHalalas, 0);
    return {
      id: c.id,
      name: c.name,
      completed: c.appointments.length,
      revenueHalalas: revenue,
      commissionPercent: c.commissionBps / 100,
      commissionHalalas: Math.round((revenue * c.commissionBps) / 10_000),
    };
  });

  return {
    range,
    current,
    previous,
    daily,
    staffRows,
    appointments,
    month: {
      confirmed: monthSummary.confirmed,
      completed: monthSummary.completed,
      expectedRevenueHalalas: monthSummary.serviceRevenueHalalas + monthSummary.confirmedRevenueHalalas,
      completedRevenueHalalas: monthSummary.serviceRevenueHalalas,
      confirmedRevenueHalalas: monthSummary.confirmedRevenueHalalas,
      freeSlots: capacity.freeSlots,
      quotaRemaining,
    },
  };
}

export type ReportData = Awaited<ReturnType<typeof buildReport>>;
