import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireDashboardUser, canUse } from "@/lib/guard";
import { PLANS, PLAN_CODES, ADDONS, ADDON_KINDS, TRIAL_DAYS } from "@/lib/plans";
import { formatSar } from "@/lib/money";
import { formatLocalDate } from "@/lib/time";
import { ACCESS_LABEL } from "@/lib/labels";
import { choosePlanAction, buyAddonAction } from "@/app/actions/settings";
import { Badge, Banner, Card, EmptyState, PageHeader, btnGhost, btnPrimary, inputCls } from "@/components/ui";

export const metadata: Metadata = { title: "الباقة والفواتير" };

type Props = { searchParams: Promise<{ ok?: string; error?: string }> };

export default async function BillingPage({ searchParams }: Props) {
  const { user, salon, ctx } = await requireDashboardUser();
  const { ok, error } = await searchParams;
  if (!canUse(user, ctx, "billing.manage")) return <EmptyState>إدارة الباقة للمالكة فقط.</EmptyState>;

  const sub = await db.subscription.findUniqueOrThrow({ where: { salonId: salon.id }, include: { addons: { where: { active: true } } } });
  const payments = await db.payment.findMany({
    where: { salonId: salon.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  const access = ACCESS_LABEL[ctx.access];
  const current = PLANS[ctx.plan];
  const tz = salon.timezone;

  return (
    <div>
      <PageHeader title="الباقة والفواتير" subtitle="تغيير الباقة يفعّل ميزاتها فور تأكيد الدفع." />
      {ok === "paid" && <Banner tone="success">تم الدفع بنجاح ✅ تم تحديث باقتك.</Banner>}
      {error === "payment_failed" && <Banner>لم تكتمل عملية الدفع. حاولي مرة أخرى.</Banner>}
      {error && error !== "payment_failed" && <Banner>{error}</Banner>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-zinc-600">الباقة الحالية</p>
          <p className="mt-1 font-serif text-2xl font-bold text-brand">{current.nameAr}</p>
          <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${access.tone}`}>{access.label}</span>
          {sub.pendingPlan && <p className="mt-2 text-xs text-amber-700">بانتظار دفع باقة {PLANS[sub.pendingPlan].nameAr}</p>}
        </Card>
        <Card>
          <p className="text-sm text-zinc-600">{ctx.access === "trial" ? "تنتهي التجربة" : "التجديد القادم"}</p>
          <p className="mt-1 font-bold">
            {formatLocalDate(ctx.access === "trial" ? (ctx.trialEndsAt ?? new Date()) : (ctx.currentPeriodEnd ?? new Date()), tz)}
          </p>
          <p className="mt-2 text-xs text-zinc-500">{ctx.access === "trial" ? `تجربة ${TRIAL_DAYS} يوماً بميزات الذهبية` : "يُجدَّد شهرياً"}</p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-600">الاستخدام</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>تقويمات: <strong>{ctx.usage.calendars}</strong> / {ctx.entitlements.calendars}</li>
            <li>حسابات إدارة: <strong>{ctx.usage.admins}</strong> / {ctx.entitlements.admins}</li>
            <li>حجوزات الشهر: <strong>{ctx.usage.monthlyBookings}</strong> / {ctx.entitlements.monthlyBookings}</li>
          </ul>
        </Card>
      </div>

      <h2 className="mb-4 mt-10 text-lg font-bold text-ink">اختاري الباقة</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_CODES.map((code) => {
          const p = PLANS[code];
          const isCurrent = code === ctx.plan && ctx.access !== "trial";
          return (
            <Card key={code} className={isCurrent ? "border-gold ring-2 ring-gold/30" : ""}>
              <p className="font-serif text-xl font-bold text-brand">{p.nameAr}</p>
              <p className="mt-1 text-2xl font-extrabold">{p.priceSar} <span className="text-sm font-normal text-zinc-500">ر.س/شهر</span></p>
              <ul className="mt-3 space-y-1 text-xs text-zinc-600">
                {p.highlightsAr.map((h) => <li key={h}>✓ {h}</li>)}
              </ul>
              <form action={choosePlanAction} className="mt-4">
                <input type="hidden" name="plan" value={code} />
                <button className={`${isCurrent ? btnGhost : btnPrimary} w-full`} disabled={isCurrent}>
                  {isCurrent ? "باقتك الحالية" : "اختيار ودفع"}
                </button>
              </form>
            </Card>
          );
        })}
      </div>

      <h2 className="mb-4 mt-10 text-lg font-bold text-ink">إضافات شهرية</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {ADDON_KINDS.map((k) => {
          const owned = sub.addons.filter((a) => a.kind === k).reduce((n, a) => n + a.quantity, 0);
          return (
            <Card key={k}>
              <p className="font-bold">{ADDONS[k].nameAr}</p>
              <p className="text-sm text-zinc-600">{ADDONS[k].priceSar} ر.س / شهر للوحدة · مفعّل: {owned}</p>
              <form action={buyAddonAction} className="mt-4 flex gap-2">
                <input type="hidden" name="kind" value={k} />
                <input type="number" name="quantity" min={1} max={10} defaultValue={1} className={`${inputCls} w-20`} />
                <button className={btnPrimary}>شراء</button>
              </form>
            </Card>
          );
        })}
      </div>

      <h2 className="mb-4 mt-10 text-lg font-bold text-ink">آخر المدفوعات</h2>
      {payments.length === 0 ? (
        <EmptyState>لا مدفوعات بعد.</EmptyState>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-zinc-100 text-sm">
            {payments.map((pay) => (
              <li key={pay.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <span>{pay.kind === "DEPOSIT" ? "عربون حجز" : pay.kind === "ADDON" ? "إضافة" : "اشتراك"} · {formatLocalDate(pay.createdAt, tz)}</span>
                <span className="font-semibold">{formatSar(pay.amountHalalas)}</span>
                <Badge className={pay.status === "PAID" ? "bg-emerald-100 text-emerald-800" : pay.status === "FAILED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}>
                  {pay.status === "PAID" ? "مدفوع" : pay.status === "FAILED" ? "فشل" : "قيد الانتظار"}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <p className="mt-6 text-xs text-zinc-500">الأسعار المعروضة أسعار التأسيس، وتشمل ضريبة القيمة المضافة عند تفعيلها.</p>
    </div>
  );
}
