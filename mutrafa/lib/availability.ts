import { localDayBounds, weekdayOfDayKey, zonedToUtc } from "./time";

/**
 * حساب المواعيد المتاحة — دالة نقية (بلا قاعدة بيانات) لتسهيل الاختبار.
 * الإدخال: يوم محلي، ساعات عمل الموظفة، مدة الخدمة، والفترات المحجوزة.
 */

export type WorkingHours = {
  start: string; // HH:mm
  end: string; // HH:mm
  days: number[]; // 0=الأحد … 6=السبت
};

export const DEFAULT_WORKING_HOURS: WorkingHours = {
  start: "09:00",
  end: "21:00",
  days: [0, 1, 2, 3, 4, 5, 6],
};

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** يقرأ ساعات العمل من JSON مع التحقق؛ أي قيمة غير صالحة تعود للافتراضي */
export function parseWorkingHours(raw: unknown): WorkingHours {
  if (!raw || typeof raw !== "object") return DEFAULT_WORKING_HOURS;
  const value = raw as Partial<WorkingHours>;
  const valid =
    typeof value.start === "string" &&
    typeof value.end === "string" &&
    HHMM.test(value.start) &&
    HHMM.test(value.end) &&
    value.start < value.end &&
    Array.isArray(value.days) &&
    value.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  return valid ? { start: value.start!, end: value.end!, days: [...new Set(value.days!)] } : DEFAULT_WORKING_HOURS;
}

export interface BusyInterval {
  start: Date;
  end: Date;
}

export interface SlotInput {
  dayKey: string; // YYYY-MM-DD بالتوقيت المحلي
  timeZone: string;
  hours: WorkingHours;
  durationMinutes: number;
  busy: readonly BusyInterval[];
  now: Date;
  stepMinutes?: number;
}

/** بداية المواعيد المتاحة (لحظات UTC) على شبكة الخطوة المحددة (30 دقيقة افتراضياً) */
export function computeAvailableSlots(input: SlotInput): Date[] {
  const { dayKey, timeZone, hours, durationMinutes, busy, now, stepMinutes = 30 } = input;
  if (!hours.days.includes(weekdayOfDayKey(dayKey))) return [];

  const [y, m, d] = dayKey.split("-").map(Number);
  const [sh, sm] = hours.start.split(":").map(Number);
  const [eh, em] = hours.end.split(":").map(Number);
  const workStart = zonedToUtc(y, m, d, sh, sm, timeZone).getTime();
  const workEnd = zonedToUtc(y, m, d, eh, em, timeZone).getTime();
  const durationMs = durationMinutes * 60_000;
  const stepMs = stepMinutes * 60_000;
  const nowMs = now.getTime();
  const bounds = localDayBounds(dayKey, timeZone);
  if (bounds.start.getTime() > workEnd) return [];

  const slots: Date[] = [];
  for (let t = workStart; t + durationMs <= workEnd; t += stepMs) {
    if (t <= nowMs) continue; // لا حجوزات في الماضي
    const end = t + durationMs;
    const clashes = busy.some((b) => t < b.end.getTime() && b.start.getTime() < end);
    if (!clashes) slots.push(new Date(t));
  }
  return slots;
}

/** هل الفترة [start,end) تتقاطع مع أي فترة مشغولة؟ */
export function overlapsAny(start: Date, end: Date, busy: readonly BusyInterval[]): boolean {
  return busy.some((b) => start.getTime() < b.end.getTime() && b.start.getTime() < end.getTime());
}
