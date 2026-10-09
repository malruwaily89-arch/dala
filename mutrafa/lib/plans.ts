/**
 * كتالوج باقات مُترَفة — المصدر الوحيد للحقيقة لكل ما يتعلق بالباقات.
 * أي ميزة مقيّدة بباقة يجب أن تُفحص عبر هذا الملف (hasFeature / entitlementsFor)
 * ولا تُكتب أرقام الباقات في أي مكان آخر.
 *
 * الأسعار بالريال السعودي، شهرياً. "سعر التأسيس" هو السعر المعروض للتسجيل الآن،
 * و"السعر العادي" يُعرض مشطوباً كما في الموقع.
 */

export const PLAN_CODES = ["INDIE", "SILVER", "GOLD", "DIAMOND"] as const;
export type PlanCode = (typeof PLAN_CODES)[number];

/** الميزات المقيّدة بالباقة (الباقة الأعلى تتضمن ما قبلها) */
export type Feature =
  | "waitlist.manual" // قائمة انتظار يدوية — الفضية وما فوق
  | "waitlist.auto" // إشعار تلقائي للانتظار عند الإلغاء — الذهبية وما فوق
  | "cancellation.perService" // سياسة إلغاء مخصّصة لكل خدمة — الذهبية وما فوق
  | "commission" // حساب عمولة الموظفات — الذهبية وما فوق
  | "roles" // صلاحيات متعددة الأدوار — الذهبية وما فوق
  | "audit.view"; // سجل التدقيق — الألماسية فقط

export const TRIAL_DAYS = 14;
/** أثناء التجربة يحصل الصالون على ميزات الذهبية بغض النظر عن الباقة المختارة */
export const TRIAL_PLAN: PlanCode = "GOLD";

export interface PlanDefinition {
  code: PlanCode;
  nameAr: string;
  nameEn: string;
  priceSar: number;
  regularPriceSar: number;
  calendars: number; // عدد تقويمات الموظفات
  monthlyBookings: number; // الحجوزات المؤكدة شهرياً
  admins: number; // حسابات لوحة التحكم
  features: readonly Feature[];
  /** نقاط العرض في صفحة الأسعار (عربي) */
  highlightsAr: readonly string[];
}

export const PLANS: Readonly<Record<PlanCode, PlanDefinition>> = {
  INDIE: {
    code: "INDIE",
    nameAr: "المستقلة",
    nameEn: "Indie",
    priceSar: 199,
    regularPriceSar: 299,
    calendars: 1,
    monthlyBookings: 120,
    admins: 1,
    features: [],
    highlightsAr: ["تقويم واحد", "120 حجز مؤكد شهرياً", "حساب مشرفة واحد", "صفحة حجز وعربون واتساب"],
  },
  SILVER: {
    code: "SILVER",
    nameAr: "الفضية",
    nameEn: "Silver",
    priceSar: 299,
    regularPriceSar: 399,
    calendars: 5,
    monthlyBookings: 400,
    admins: 2,
    features: ["waitlist.manual"],
    highlightsAr: ["حتى 5 تقويمات للموظفات", "400 حجز مؤكد شهرياً", "حسابان للإدارة", "قائمة انتظار يدوية"],
  },
  GOLD: {
    code: "GOLD",
    nameEn: "Gold",
    nameAr: "الذهبية",
    priceSar: 499,
    regularPriceSar: 599,
    calendars: 20,
    monthlyBookings: 1200,
    admins: 4,
    features: ["waitlist.manual", "waitlist.auto", "cancellation.perService", "commission", "roles"],
    highlightsAr: [
      "حتى 20 تقويماً للموظفات",
      "1200 حجز مؤكد شهرياً",
      "4 حسابات للإدارة",
      "قائمة انتظار تلقائية",
      "سياسة إلغاء لكل خدمة",
      "حساب العمولات",
      "صلاحيات متعددة الأدوار",
    ],
  },
  DIAMOND: {
    code: "DIAMOND",
    nameAr: "الألماسية",
    nameEn: "Diamond",
    priceSar: 999,
    regularPriceSar: 1099,
    calendars: 50,
    monthlyBookings: 2500,
    admins: 8,
    features: ["waitlist.manual", "waitlist.auto", "cancellation.perService", "commission", "roles", "audit.view"],
    highlightsAr: [
      "حتى 50 تقويماً للموظفات",
      "2500 حجز مؤكد شهرياً",
      "8 حسابات للإدارة",
      "كل ميزات الذهبية",
      "سجل تدقيق كامل",
    ],
  },
};

/** الإضافات الشهرية (تُضاف فوق حدود الباقة) */
export const ADDON_KINDS = ["EXTRA_CALENDAR", "EXTRA_BOOKINGS_100", "EXTRA_BOOKINGS_500"] as const;
export type AddonKindCode = (typeof ADDON_KINDS)[number];

export interface AddonDefinition {
  kind: AddonKindCode;
  nameAr: string;
  priceSar: number;
  extraCalendars?: number;
  extraBookings?: number;
}

export const ADDONS: Readonly<Record<AddonKindCode, AddonDefinition>> = {
  EXTRA_CALENDAR: { kind: "EXTRA_CALENDAR", nameAr: "تقويم موظفة إضافي", priceSar: 49, extraCalendars: 1 },
  EXTRA_BOOKINGS_100: { kind: "EXTRA_BOOKINGS_100", nameAr: "100 حجز إضافي شهرياً", priceSar: 49, extraBookings: 100 },
  EXTRA_BOOKINGS_500: { kind: "EXTRA_BOOKINGS_500", nameAr: "500 حجز إضافي شهرياً", priceSar: 199, extraBookings: 500 },
};

export interface Entitlements {
  plan: PlanCode;
  calendars: number;
  monthlyBookings: number;
  admins: number;
  features: ReadonlySet<Feature>;
}

export function isPlanCode(value: string): value is PlanCode {
  return (PLAN_CODES as readonly string[]).includes(value);
}

/** الحدود الفعلية = حدود الباقة + الإضافات النشطة */
export function entitlementsFor(
  plan: PlanCode,
  addons: readonly { kind: string; quantity: number }[] = []
): Entitlements {
  const base = PLANS[plan];
  let calendars = base.calendars;
  let monthlyBookings = base.monthlyBookings;
  for (const addon of addons) {
    const def = ADDONS[addon.kind as AddonKindCode];
    if (!def) continue;
    calendars += (def.extraCalendars ?? 0) * addon.quantity;
    monthlyBookings += (def.extraBookings ?? 0) * addon.quantity;
  }
  return {
    plan,
    calendars,
    monthlyBookings,
    admins: base.admins,
    features: new Set(base.features),
  };
}

export function hasFeature(entitlements: Entitlements, feature: Feature): boolean {
  return entitlements.features.has(feature);
}

/** أقل باقة تتضمن ميزة معينة — تُستخدم في رسائل "رقّي إلى ..." */
export function minimumPlanFor(feature: Feature): PlanCode {
  const found = PLAN_CODES.find((code) => PLANS[code].features.includes(feature));
  return found ?? "DIAMOND";
}
