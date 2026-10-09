import type { Metadata } from "next";
import { requireDashboardUser, canUse } from "@/lib/guard";
import { hasFeature } from "@/lib/plans";
import { monthlyReport, weeklyReport, commissionReport, type PeriodSummary } from "@/lib/reports";
import { formatSar } from "@/lib/money";
import { Card, EmptyState, PageHeader, Stat } from "@/components/ui";
import { UpgradeCard } from "@/components/dashboard/upgrade";

export const metadata: Metadata = { title: "التقارير" };

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export default async function ReportsPage() {
  const { user, salon, ctx } = await requireDashboardUser();
  if (!canUse(user, ctx, "reports.view")) return <EmptyState>لا تملكين صلاحية عرض التقارير.</EmptyState>;

  const now = new Date();
  const [month, week] = await Promise.all([monthlyReport(salon.id, salon.timezone, now), weeklyReport(salon.id, now)]);
  const monthName = new Intl.DateTimeFormat("ar-SA-u-nu-latn", { timeZone: salon.timezone, month: "long", year: "numeric" }).format(now);
  const canCommission = canUse(user, ctx, "commission.view");
  const commissions = canCommission ? await commissionReport(salon.id, salon.timezone, now) : [];

  return (
    <div>
      <PageHeader title="التقارير" subtitle={`الشهر الحالي (${monthName}) وآخر 7 أيام.`} />

      <h2 className="mb-3 text-lg font-bold text-ink">الشهر الحالي</h2>
      <SummaryGrid s={month} />

      <h2 className="mb-3 mt-10 text-lg font-bold text-ink">آخر 7 أيام</h2>
      <SummaryGrid s={week} />

      <h2 className="mb-3 mt-10 text-lg font-bold text-ink">أكثر الخدمات طلباً (الشهر)</h2>
      {month.topServices.length === 0 ? (
        <EmptyState>لا حجوزات مسجّلة هذا الشهر بعد.</EmptyState>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-zinc-100">
            {month.topServices.map((s) => (
              <li key={s.name} className="flex justify-between px-5 py-3 text-sm">
                <span className="font-semibold">{s.name}</span>
                <span className="text-zinc-600">{s.count} حجز</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <h2 className="mb-3 mt-10 text-lg font-bold text-ink">العمولات (الشهر)</h2>
      {!hasFeature(ctx.entitlements, "commission") ? (
        <UpgradeCard feature="commission" />
      ) : commissions.length === 0 ? (
        <EmptyState>لا توجد موظفات نشطات.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand/10 bg-white">
          <table className="w-full min-w-[560px] text-start text-sm">
            <thead className="bg-brand-soft/60 text-xs font-bold text-zinc-600">
              <tr>
                <th className="p-4 text-start">الموظفة</th>
                <th className="p-4 text-start">خدمات مكتملة</th>
                <th className="p-4 text-start">الإيراد</th>
                <th className="p-4 text-start">نسبة العمولة</th>
                <th className="p-4 text-start">مستحق العمولة</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c.calendarId} className="border-t border-zinc-100">
                  <td className="p-4 font-bold">{c.name}</td>
                  <td className="p-4">{c.completed}</td>
                  <td className="p-4">{formatSar(c.revenueHalalas)}</td>
                  <td className="p-4">{c.commissionPercent}%</td>
                  <td className="p-4 font-bold text-brand">{formatSar(c.commissionHalalas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryGrid({ s }: { s: PeriodSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="حجوزات جديدة" value={String(s.bookingsCreated)} />
      <Stat label="مكتملة" value={String(s.completed)} note={`مؤكدة بانتظار الموعد: ${s.confirmed}`} />
      <Stat label="عربون محصّل" value={formatSar(s.depositsCollectedHalalas)} />
      <Stat label="إيراد الخدمات المكتملة" value={formatSar(s.serviceRevenueHalalas)} />
      <Stat label="نسبة الإلغاء" value={pct(s.cancellationRate)} note={`${s.cancelled} ملغى`} />
      <Stat label="نسبة الغياب" value={pct(s.noShowRate)} note={`${s.noShow} لم تحضر`} />
      <Stat label="نسبة تحصيل العربون" value={pct(s.depositCollectionRate)} />
      <Stat label="عميلات جديدات" value={String(s.newCustomers)} note={`عربون من غير الحاضرات: ${formatSar(s.noShowDepositHalalas)}`} />
    </div>
  );
}
