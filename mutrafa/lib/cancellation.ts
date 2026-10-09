import { hasFeature, type Entitlements } from "./plans";

/**
 * سياسة الإلغاء: الإلغاء المجاني قبل الموعد بعدد ساعات محدد.
 * بعد هذه المهلة يُلغى الحجز ويُحتفظ بالعربون (لا يُسترد).
 * الخدمة لها سياستها الخاصة فقط إذا كانت الباقة تتضمن ميزة السياسات لكل خدمة.
 */
export function effectiveCancellationHours(
  salonHours: number,
  serviceHours: number | null,
  entitlements: Entitlements
): number {
  if (serviceHours !== null && hasFeature(entitlements, "cancellation.perService")) return serviceHours;
  return salonHours;
}

export function isFreeCancellation(startsAt: Date, now: Date, policyHours: number): boolean {
  return now.getTime() <= startsAt.getTime() - policyHours * 3_600_000;
}
