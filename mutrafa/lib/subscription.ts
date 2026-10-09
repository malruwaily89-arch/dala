import { PLANS, TRIAL_DAYS, TRIAL_PLAN, type PlanCode } from "./plans";

/**
 * حالة وصول الصالون — تحدد هل تعمل صفحة الحجز، وأي باقة تُطبَّق.
 *  trial          : تجريبية نشطة (ميزات الذهبية)
 *  active         : مشترك ونشط
 *  past_due       : متأخر السداد — الحجز مفتوح مع تنبيه
 *  trial_expired  : انتهت التجربة دون اختيار باقة — صفحة الحجز متوقفة
 *  suspended      : موقوف — صفحة الحجز متوقفة
 *  canceled       : ملغى — صفحة الحجز متوقفة
 */
export type AccessState = "trial" | "active" | "past_due" | "trial_expired" | "suspended" | "canceled";

export interface SubscriptionLike {
  status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "SUSPENDED" | "CANCELED";
  plan: PlanCode;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date;
}

export function accessStateOf(sub: SubscriptionLike, now: Date): AccessState {
  switch (sub.status) {
    case "TRIALING":
      return sub.trialEndsAt && sub.trialEndsAt.getTime() > now.getTime() ? "trial" : "trial_expired";
    case "ACTIVE":
      // اشتراك مدفوع انتهت فترته ولم يُجدَّد — يُعامَل كمتأخر السداد
      return sub.currentPeriodEnd.getTime() < now.getTime() ? "past_due" : "active";
    case "PAST_DUE":
      return "past_due";
    case "SUSPENDED":
      return "suspended";
    case "CANCELED":
      return "canceled";
  }
}

/** هل تقبل صفحة الحجز حجوزات جديدة في هذه الحالة؟ */
export function canAcceptBookings(state: AccessState): boolean {
  return state === "trial" || state === "active" || state === "past_due";
}

/** الباقة التي تُطبَّق فعلياً الآن: التجربة = الذهبية، وإلا الباقة المشتركة فيها */
export function effectivePlanOf(sub: SubscriptionLike, now: Date): PlanCode {
  return accessStateOf(sub, now) === "trial" ? TRIAL_PLAN : sub.plan;
}

export function trialEndsFrom(startedAt: Date): Date {
  return new Date(startedAt.getTime() + TRIAL_DAYS * 86_400_000);
}

export function planPrice(plan: PlanCode): number {
  return PLANS[plan].priceSar;
}
