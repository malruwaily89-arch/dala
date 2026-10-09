/**
 * أرقام الجوال السعودية.
 * المدخل المقبول: 05XXXXXXXX (10 أرقام) أو 9665XXXXXXXX أو +9665XXXXXXXX.
 * المخرج الموحّد دائماً: 9665XXXXXXXX (صيغة Meta / واتساب).
 */

export function normalizeSaPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  let national: string | null = null;
  if (/^05\d{8}$/.test(digits)) national = digits.slice(1);
  else if (/^5\d{8}$/.test(digits)) national = digits;
  else if (/^9665\d{8}$/.test(digits)) national = digits.slice(3);
  if (!national) return null;
  return `966${national}`;
}

export function isValidSaPhone(raw: string): boolean {
  return normalizeSaPhone(raw) !== null;
}

/** عرض الرقم للإنسان: 05XXXXXXXX */
export function displayPhone(normalized: string): string {
  if (normalized.startsWith("966") && normalized.length === 12) return `0${normalized.slice(3)}`;
  return normalized;
}
