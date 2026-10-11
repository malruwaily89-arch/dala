import { db } from "./db";
import { computeAvailableSlots, parseWorkingHours, type BusyInterval } from "./availability";
import { addDays, localDayBounds, localDayKey, localMonthBounds } from "./time";

/**
 * المواعيد المتاحة حتى نهاية الشهر لكامل الصالون (حسب أقصر خدمة في كل تقويم).
 * يحسب كل يوم من اليوم الحالي حتى آخر الشهر، ويستثني الحجوزات النشطة.
 */
export async function remainingFreeSlots(
  salonId: string,
  timeZone: string,
  now: Date = new Date()
): Promise<{ freeSlots: number; byCalendar: { id: string; name: string; freeSlots: number }[] }> {
  const { end: monthEnd } = localMonthBounds(now, timeZone);
  const lastKey = localDayKey(addDays(monthEnd, -1), timeZone);

  const calendars = await db.calendar.findMany({
    where: { salonId, isActive: true },
    include: { services: { include: { service: true } } },
  });
  const active = calendars
    .map((c) => {
      // مدة كل خدمة عند هذه الموظفة (تتجاوز المدة الافتراضية إن حُددت)
      const services = c.services
        .filter((cs) => cs.service.isActive)
        .map((cs) => cs.durationMinutes ?? cs.service.durationMinutes);
      return { id: c.id, name: c.name, hours: parseWorkingHours(c.workingHours), minDuration: services.length ? Math.min(...services) : null };
    })
    .filter((c) => c.minDuration !== null);

  const bookings = await db.appointment.findMany({
    where: {
      salonId,
      status: { in: ["PENDING_DEPOSIT", "CONFIRMED"] },
      endsAt: { gt: now },
      startsAt: { lt: monthEnd },
    },
    select: { calendarId: true, startsAt: true, endsAt: true, holdUntil: true, status: true },
  });
  const busyByCalendar = new Map<string, BusyInterval[]>();
  for (const b of bookings) {
    if (b.status === "PENDING_DEPOSIT" && (!b.holdUntil || b.holdUntil <= now)) continue;
    const list = busyByCalendar.get(b.calendarId) ?? [];
    list.push({ start: b.startsAt, end: b.endsAt });
    busyByCalendar.set(b.calendarId, list);
  }

  const totals = new Map<string, number>(active.map((c) => [c.id, 0]));
  for (let cur = now; ; cur = addDays(cur, 1)) {
    const dayKey = localDayKey(cur, timeZone);
    if (dayKey > lastKey) break;
    const bounds = localDayBounds(dayKey, timeZone);
    for (const c of active) {
      const busy = (busyByCalendar.get(c.id) ?? []).filter((b) => b.start < bounds.end && b.end > bounds.start);
      const slots = computeAvailableSlots({
        dayKey,
        timeZone,
        hours: c.hours,
        durationMinutes: c.minDuration!,
        busy,
        now,
      });
      totals.set(c.id, (totals.get(c.id) ?? 0) + slots.length);
    }
  }

  const byCalendar = active.map((c) => ({ id: c.id, name: c.name, freeSlots: totals.get(c.id) ?? 0 }));
  return { freeSlots: byCalendar.reduce((sum, c) => sum + c.freeSlots, 0), byCalendar };
}
