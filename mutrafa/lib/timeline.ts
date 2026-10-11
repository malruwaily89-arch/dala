import { zonedToUtc, formatLocalTime, weekdayOfDayKey } from "./time";
import { SLOT_STEP_MINUTES, type WorkingHours } from "./availability";

/**
 * الجدول اليومي لموظفة: شبكة كل ربع ساعة ضمن ساعات العمل، لكل خانة حالتها.
 * دالة نقية لتسهيل الاختبار؛ الصفحة تمرر لها الحجوزات المحمّلة من قاعدة البيانات.
 */

export interface TimelineBooking {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  status: string;
  start: Date;
  end: Date;
}

export type TimelineStatus = "past" | "free" | "booked" | "closed";

export interface TimelineRow {
  start: Date;
  label: string;
  status: TimelineStatus;
  /** يظهر فقط في الخانة التي يبدأ عندها الحجز */
  booking?: TimelineBooking;
  /** خانة تكمل حجزاً بدأ قبلها */
  continued: boolean;
}

export function buildDayTimeline(params: {
  dayKey: string;
  timeZone: string;
  hours: WorkingHours;
  bookings: TimelineBooking[];
  now: Date;
  step?: number;
}): TimelineRow[] {
  const { dayKey, timeZone, hours, bookings, now, step = SLOT_STEP_MINUTES } = params;
  if (!hours.days.includes(weekdayOfDayKey(dayKey))) return [];

  const [y, m, d] = dayKey.split("-").map(Number);
  const [sh, sm] = hours.start.split(":").map(Number);
  const [eh, em] = hours.end.split(":").map(Number);
  const workStart = zonedToUtc(y, m, d, sh, sm, timeZone).getTime();
  const workEnd = zonedToUtc(y, m, d, eh, em, timeZone).getTime();
  const stepMs = step * 60_000;

  const rows: TimelineRow[] = [];
  for (let t = workStart; t + stepMs <= workEnd; t += stepMs) {
    const start = new Date(t);
    const label = formatLocalTime(start, timeZone);
    const covering = bookings.find((b) => b.start.getTime() <= t && t < b.end.getTime());
    if (covering) {
      const begins = covering.start.getTime() === t;
      rows.push({ start, label, status: "booked", booking: begins ? covering : undefined, continued: !begins });
      continue;
    }
    rows.push({ start, label, status: t <= now.getTime() ? "past" : "free", continued: false });
  }
  return rows;
}
