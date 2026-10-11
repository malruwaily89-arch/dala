/**
 * أرقام الجوال السعودية.
 * الإدخال الرسمي: 9 أرقام تبدأ بـ 5 بعد رمز الدولة +966 (مثل 512345678).
 * ويقبل أيضاً الصيغ الملصوقة: 05XXXXXXXX أو 966XXXXXXXXX أو +966 5XXXXXXXX.
 * المخرج الموحّد دائماً: 9665XXXXXXXX (صيغة Meta / واتساب).
 */

export function normalizeSaPhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00966")) digits = digits.slice(5);
  else if (digits.startsWith("966")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return /^5\d{8}$/.test(digits) ? `966${digits}` : null;
}

export function isValidSaPhone(raw: string): boolean {
  return normalizeSaPhone(raw) !== null;
}

/** عرض الرقم للإنسان: 05XXXXXXXX */
export function displayPhone(normalized: string): string {
  if (normalized.startsWith("966") && normalized.length === 12) return `0${normalized.slice(3)}`;
  return normalized;
}
