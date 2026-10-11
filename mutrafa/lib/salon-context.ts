import { db } from "./db";
import { accessStateOf, canAcceptBookings, effectivePlanOf, type AccessState } from "./subscription";
import { entitlementsFor, type Entitlements, type PlanCode } from "./plans";
import { localMonthBounds } from "./time";

/** الحالات التي تُحتسب ضمن حصة الحجوزات الشهرية (الملغى والمنتهي لا يُحتسب) */
const COUNTED_BOOKING_STATUSES = ["PENDING_DEPOSIT", "CONFIRMED", "COMPLETED", "NO_SHOW"] as const;

export interface SalonContext {
  salonId: string;
  timeZone: string;
  access: AccessState;
  bookingsOpen: boolean;
  plan: PlanCode;
  entitlements: Entitlements;
  usage: {
    calendars: number; // تقويمات نشطة
    admins: number; // حسابات نشطة
    monthlyBookings: number; // حجوزات هذا الشهر (غير ملغاة)
  };
  remaining: {
    calendars: number;
    admins: number;
    monthlyBookings: number;
  };
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
}

/**
 * يحمّل كل ما يلزم لتقرير ما يُسمح للصالون به الآن:
 * حالة الاشتراك، الباقة الفعلية، الإضافات، والاستهلاك الحالي.
 */
export async function loadSalonContext(salonId: string, now: Date = new Date()): Promise<SalonContext> {
  const salon = await db.salon.findUniqueOrThrow({
    where: { id: salonId },
    include: { subscription: { include: { addons: { where: { active: true } } } } },
  });
  const sub = salon.subscription;
  if (!sub) throw new Error("لا يوجد اشتراك لهذا الصالون");

  const access = accessStateOf(sub, now);
  const plan = effectivePlanOf(sub, now);
  const entitlements = entitlementsFor(plan, sub.addons);
  const month = localMonthBounds(now, salon.timezone);

  const [calendars, admins, monthlyBookings] = await Promise.all([
    db.calendar.count({ where: { salonId, isActive: true } }),
    db.user.count({ where: { salonId, active: true } }),
    db.appointment.count({
      where: {
        salonId,
        status: { in: [...COUNTED_BOOKING_STATUSES] },
        createdAt: { gte: month.start, lt: month.end },
      },
    }),
  ]);

  return {
    salonId,
    timeZone: salon.timezone,
    access,
    bookingsOpen: canAcceptBookings(access),
    plan,
    entitlements,
    usage: { calendars, admins, monthlyBookings },
    remaining: {
      calendars: Math.max(0, entitlements.calendars - calendars),
      admins: Math.max(0, entitlements.admins - admins),
      monthlyBookings: Math.max(0, entitlements.monthlyBookings - monthlyBookings),
    },
    trialEndsAt: sub.trialEndsAt,
    currentPeriodEnd: sub.currentPeriodEnd,
  };
}
