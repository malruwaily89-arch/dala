import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireDashboardUser, canUse } from "@/lib/guard";
import { hasFeature } from "@/lib/plans";
import { periodSummary, dailyBookings } from "@/lib/reports";
import { formatSar } from "@/lib/money";
import { addDays, localMonthBounds, formatLocalDate } from "@/lib/time";
import { Card, EmptyState, PageHeader, Badge } from "@/components/ui";
import { UpgradeCard } from "@/components/dashboard/upgrade";
import { PrintButton } from "@/components/dashboard/print-button";

export const metadata: Metadata = { title: "التقارير" };

type Period = "month" | "last" | "week";
const PERIODS: { key: Period; label: string }[] = [
  { key: "month", label: "هذا الشهر" },
  { key: "last", label: "الشهر الماضي" },
  { key: "week", label: "آخر 7 أيام" },
];

function periodRange(period: Period, now: Date, tz: string) {
  if (period === "week") {
    return {
      from: addDays(now, -7),
      to: now,
      prevFrom: addDays(now, -14),
      prevTo: addDays(now, -7),
    };
  }
  const current = localMonthBounds(now, tz);
  if (period === "last") {
    const prev = localMonthBounds(addDays(current.start, -1), tz);
    const prevPrev = localMonthBounds(addDays(prev.start, -1), tz);
    return { from: prev.start, to: prev.end, prevFrom: prevPrev.start, prevTo: prevPrev.end };
  }
  const prev = localMonthBounds(addDays(current.start, -1), tz);
  return { from: current.start, to: current.end, prevFrom: prev.start, prevTo: prev.end };
}

function trend(current: number, previous: number): { text: string; tone: string } | null {
  if (previous === 0 && current === 0) return null;
  // لا مقارنة مع فترة بلا بيانات (تجنّب نسبة لا معنى لها)
  if (previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(change);
  return {
    text: `${rounded >= 0 ? "▲" : "▼"} ${Math.abs(rounded)}%`,
    tone: rounded >= 0 ? "text-emerald-700" : "text-rose-700",
  };
}

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { user, salon, ctx } = await requireDashboardUser();
  if (!canUse(user, ctx, "reports.view")) return <EmptyState>لا تملكين صلاحية عرض التقارير.</EmptyState>;

  const { period: rawPeriod } = await searchParams;
  const period: Period = rawPeriod === "last" || rawPeriod === "week" ? rawPeriod : "month";
  const tz = salon.timezone;
  const now = new Date();
  const range = periodRange(period, now, tz);

  const [current, previous, daily] = await Promise.all([
    periodSummary(salon.id, range.from, range.to),
    periodSummary(salon.id, range.prevFrom, range.prevTo),
    dailyBookings(salon.id, range.from, range.to, tz),
  ]);

  const calendarStats = await db.calendar.findMany({
    where: { salonId: salon.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      commissionBps: true,
      appointments: {
        where: { status: "COMPLETED", startsAt: { gte: range.from, lt: range.to } },
        select: { priceHalalas: true },
      },
    },
  });
  const staffRows = calendarStats.map((c) => {
    const revenue = c.appointments.reduce((sum, a) => sum + a.priceHalalas, 0);
    return {
      id: c.id,
      name: c.name,
      completed: c.appointments.length,
      revenue,
      commissionPercent: c.commissionBps / 100,
      commission: Math.round((revenue * c.commissionBps) / 10_000),
    };
  });
  const canCommission = hasFeature(ctx.entitlements, "commission");

  const maxDaily = Math.max(1, ...daily.map((d) => d.count));
  const statusTotal = current.confirmed + current.completed + current.noShow + current.cancelled || 1;
  const kpis = [
    { label: "حجوزات جديدة", value: String(current.bookingsCreated), delta: trend(current.bookingsCreated, previous.bookingsCreated) },
    { label: "مواعيد مكتملة", value: String(current.completed), delta: trend(current.completed, previous.completed) },
    { label: "إيراد الخدمات", value: formatSar(current.serviceRevenueHalalas), delta: trend(current.serviceRevenueHalalas, previous.serviceRevenueHalalas) },
    { label: "عربون محصّل", value: formatSar(current.depositsCollectedHalalas), delta: trend(current.depositsCollectedHalalas, previous.depositsCollectedHalalas) },
    { label: "نسبة الإلغاء", value: pct(current.cancellationRate), delta: null, warn: current.cancellationRate > 0.15 },
    { label: "نسبة الغياب", value: pct(current.noShowRate), delta: null, warn: current.noShowRate > 0.1 },
  ];

  return (
    <div>
      <PageHeader
        title="التقارير"
        subtitle={`${formatLocalDate(range.from, tz)} — ${formatLocalDate(addDays(range.to, -1), tz)}`}
        action={<PrintButton />}
      />

      <div className="mb-8 flex flex-wrap items-center gap-2 print:hidden">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={`/dashboard/reports?period=${p.key}`}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              period === p.key ? "bg-brand text-white" : "border border-brand/20 bg-white text-brand hover:bg-brand-soft"
            }`}
          >
            {p.label}
          </Link>
        ))}
        <span className="text-xs text-zinc-500">المقارنة مع الفترة السابقة المماثلة</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <p className="text-sm font-semibold text-zinc-600">{k.label}</p>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <p className={`font-serif text-2xl font-bold ${k.warn ? "text-rose-700" : "text-ink"}`}>{k.value}</p>
              {k.delta && <span className={`text-sm font-bold ${k.delta.tone}`}>{k.delta.text}</span>}
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-bold text-ink">الحجوزات يوماً بيوم</h2>
          <p className="text-xs text-zinc-500">أعلى يوم: {maxDaily} حجز</p>
        </div>
        <div className="flex h-48 items-end gap-[3px]" dir="ltr">
          {daily.map((d) => {
            const h = (d.count / maxDaily) * 100;
            const c = (d.completed / maxDaily) * 100;
            return (
              <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end" title={`${d.day}: ${d.count} حجز`}>
                <div className="relative w-full rounded-t bg-brand/15" style={{ height: `${h}%` }}>
                  <div className="absolute bottom-0 w-full rounded-t bg-gradient-to-t from-brand to-gold" style={{ height: d.count ? `${(c / h) * 100 || 0}%` : 0 }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-zinc-500" dir="ltr">
          <span>{daily[0]?.day.slice(5)}</span>
          <span>{daily[daily.length - 1]?.day.slice(5)}</span>
        </div>
        <p className="mt-3 text-xs text-zinc-500">الجزء الداكن: مواعيد مكتملة · الجزء الفاتح: إجمالي الحجوزات</p>
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-bold text-ink">توزيع الحالات</h2>
          <ul className="space-y-3 text-sm">
            {[
              { label: "مؤكد", value: current.confirmed, tone: "bg-emerald-500" },
              { label: "مكتمل", value: current.completed, tone: "bg-sky-500" },
              { label: "لم تحضر", value: current.noShow, tone: "bg-rose-500" },
              { label: "ملغى", value: current.cancelled, tone: "bg-zinc-400" },
            ].map((s) => (
              <li key={s.label}>
                <div className="mb-1 flex justify-between font-semibold">
                  <span>{s.label}</span>
                  <span>{s.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div className={`h-full rounded-full ${s.tone}`} style={{ width: `${(s.value / statusTotal) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-4 font-bold text-ink">أكثر الخدمات طلباً</h2>
          {current.topServices.length === 0 ? (
            <p className="text-sm text-zinc-500">لا حجوزات في هذه الفترة.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {current.topServices.map((s, i) => (
                <li key={s.name}>
                  <div className="mb-1 flex justify-between font-semibold">
                    <span>{i + 1}. {s.name}</span>
                    <span>{s.count} حجز</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div className="h-full rounded-full bg-gradient-to-l from-gold to-brand" style={{ width: `${(s.count / current.topServices[0].count) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <h2 className="mb-3 mt-10 text-lg font-bold text-ink">أداء الموظفات</h2>
      <div className="overflow-x-auto rounded-2xl border border-brand/10 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-start text-sm">
          <thead className="bg-brand-soft/60 text-xs font-bold text-zinc-600">
            <tr>
              <th className="p-4 text-start">الموظفة</th>
              <th className="p-4 text-start">مواعيد مكتملة</th>
              <th className="p-4 text-start">الإيراد</th>
              {canCommission && <th className="p-4 text-start">العمولة</th>}
              {canCommission && <th className="p-4 text-start">مستحق العمولة</th>}
            </tr>
          </thead>
          <tbody>
            {staffRows.map((s) => (
              <tr key={s.id} className="border-t border-zinc-100">
                <td className="p-4 font-bold">{s.name}</td>
                <td className="p-4">{s.completed}</td>
                <td className="p-4">{formatSar(s.revenue)}</td>
                {canCommission && <td className="p-4">{s.commissionPercent}%</td>}
                {canCommission && <td className="p-4 font-bold text-brand">{formatSar(s.commission)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!canCommission && (
        <div className="mt-6">
          <UpgradeCard feature="commission" />
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card className="border-emerald-200 bg-emerald-50/60">
          <p className="font-bold text-emerald-800">عربون من غير الحاضرات</p>
          <p className="mt-1 text-xs text-zinc-600">عربون لا يُعاد عند الغياب، وهو ربح صافٍ للصالون.</p>
          <p className="mt-3 font-serif text-2xl font-bold text-emerald-800">{formatSar(current.noShowDepositHalalas)}</p>
        </Card>
        <Card>
          <p className="font-bold text-ink">عملاء جدد في الفترة</p>
          <p className="mt-1 text-xs text-zinc-600">عميلات سُجّلن لأول مرة خلال هذه الفترة.</p>
          <p className="mt-3 flex items-center gap-2 font-serif text-2xl font-bold">
            {current.newCustomers} <Badge className="bg-zinc-100 text-zinc-600">عميلة</Badge>
          </p>
        </Card>
      </div>
    </div>
  );
}
