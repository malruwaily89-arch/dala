/**
 * أدوات الوقت بتوقيت الصالون.
 * التخزين دائماً UTC، وكل حساب "يوم" أو "ساعة" يتم بتوقيت الصالون (Asia/Riyadh افتراضياً).
 * نستخدم Intl بدلاً من مكتبة خارجية لتفادي اعتماديات إضافية؛ التوقيت السعودي بلا تغيير صيفي.
 */

export const DEFAULT_TIMEZONE = "Asia/Riyadh";

export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const partsFormatterCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let fmt = partsFormatterCache.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    partsFormatterCache.set(timeZone, fmt);
  }
  return fmt;
}

export function getZonedParts(date: Date, timeZone: string = DEFAULT_TIMEZONE): ZonedParts {
  const map: Record<string, number> = {};
  for (const part of partsFormatter(timeZone).formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = Number(part.value);
  }
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
    second: map.second,
  };
}

/** فرق التوقيت (بالمللي ثانية) بين UTC وتوقيت المنطقة عند لحظة معينة */
function offsetMs(date: Date, timeZone: string): number {
  const p = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** يحوّل "يوم ووقت محلي" إلى لحظة UTC صحيحة (يعالج الانتقال الصيفي إن وُجد) */
export function zonedToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string = DEFAULT_TIMEZONE
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const first = new Date(guess - offsetMs(new Date(guess), timeZone));
  const second = new Date(guess - offsetMs(first, timeZone));
  return second;
}

/** مفتاح اليوم المحلي بصيغة YYYY-MM-DD */
export function localDayKey(date: Date, timeZone: string = DEFAULT_TIMEZONE): string {
  const p = getZonedParts(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** يوم الأسبوع المحلي لمفتاح يوم (0=الأحد … 6=السبت) */
export function weekdayOfDayKey(dayKey: string): number {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** بداية ونهاية يوم محلي كلحظتي UTC (نهاية حصرية) */
export function localDayBounds(dayKey: string, timeZone: string = DEFAULT_TIMEZONE): { start: Date; end: Date } {
  const [y, m, d] = dayKey.split("-").map(Number);
  const start = zonedToUtc(y, m, d, 0, 0, timeZone);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const end = zonedToUtc(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), 0, 0, timeZone);
  return { start, end };
}

/** بداية ونهاية الشهر المحلي الذي تقع فيه اللحظة */
export function localMonthBounds(date: Date, timeZone: string = DEFAULT_TIMEZONE): { start: Date; end: Date } {
  const p = getZonedParts(date, timeZone);
  const start = zonedToUtc(p.year, p.month, 1, 0, 0, timeZone);
  const nextMonth = p.month === 12 ? { y: p.year + 1, m: 1 } : { y: p.year, m: p.month + 1 };
  const end = zonedToUtc(nextMonth.y, nextMonth.m, 1, 0, 0, timeZone);
  return { start, end };
}

/** HH:mm بالتوقيت المحلي (أرقام لاتينية للوضوح) */
export function formatLocalTime(date: Date, timeZone: string = DEFAULT_TIMEZONE): string {
  const p = getZonedParts(date, timeZone);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/** تاريخ عربي مقروء: الأحد 12 أكتوبر 2026 */
export function formatLocalDate(date: Date, timeZone: string = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatLocalDateTime(date: Date, timeZone: string = DEFAULT_TIMEZONE): string {
  return `${formatLocalDate(date, timeZone)} — ${formatLocalTime(date, timeZone)}`;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 3_600_000);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}
