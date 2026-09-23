import { randomInt } from "crypto";

// رقم حجز فريد للعرض: SY-4XK9Q2
export function generateBookingCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // بدون أحرف ملتبسة
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[randomInt(alphabet.length)];
  return `SY-${code}`;
}

export const APPT_STATUS: Record<string, { label: string; color: string }> = {
  pending_deposit: { label: "بانتظار العربون", color: "bg-amber-100 text-amber-800" },
  confirmed: { label: "مؤكد", color: "bg-emerald-100 text-emerald-800" },
  done: { label: "مكتمل", color: "bg-sky-100 text-sky-800" },
  no_show: { label: "لم تحضر", color: "bg-rose-100 text-rose-800" },
  cancelled: { label: "ملغي", color: "bg-zinc-100 text-zinc-600" },
};

export function formatSar(amount: number): string {
  return `${amount.toLocaleString("ar-SA")} ر.س`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

export function formatDay(date: Date): string {
  return date.toLocaleDateString("ar-SA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatDateTime(date: Date): string {
  return `${formatDay(date)} — ${formatTime(date)}`;
}

// حساب نهاية الموعد
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

// هل الموعدان يتقاطعان؟
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}
