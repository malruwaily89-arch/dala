import type { Metadata } from "next";
import Link from "next/link";
import { requireDashboardUser, canUse } from "@/lib/guard";
import { hasFeature } from "@/lib/plans";
import { buildReport, type ReportPeriod } from "@/lib/report-data";
import { formatSar } from "@/lib/money";
import { addDays, formatLocalDate } from "@/lib/time";
import { Card, EmptyState, PageHeader, STAT_TONES, Stat, btnPrimary } from "@/components/ui";
import { UpgradeCard } from "@/components/dashboard/upgrade";
import { PrintButton } from "@/components/dashboard/print-button";

export const metadata: Metadata = { title: "التقارير" };

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: "month", label: "هذا الشهر" },
  { key: "last", label: "الشهر الماضي" },
  { key: "week", label: "آخر 7 أيام" },
];

/** ألوان الحالات: موحّدة في الرسم البياني والجداول والتصدير */
const STATUS_COLOR = {
  confirmed: { bar: "bg-emerald-500", chip: "bg-emerald-500", text: "text-emerald-700", label: "مؤكد" },
  completed: { bar: "bg-sky-500", chip: "bg-sky-500", text: "text-sky-700", label: "مكتمل" },
  noShow: { bar: "bg-rose-500", chip: "bg-rose-500", text: "text-rose-700", label: "لم تحضر" },
} as const;

function trend(current: number, previous: number): { text: string; tone: string } | null {
  if (previous === 0) return null;
  const rounded = Math.round(((current - previous) / previous) * 100);
  return { text: `${rounded >= 0 ? "▲" : "▼"} ${Math.abs(rounded)}%`, tone: rounded >= 0 ? "text-emerald-700" : "text-rose-700" };
}

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

/** ألوان مؤشرات الفترة تتناوب بالترتيب ليسهل تمييزها بصرياً */
const KPI_TONES = ["brand", "emerald", "gold", "sky", "amber", "rose"] as const;

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { user, salon, ctx } = await requireDashboardUser();
  if (!canUse(user, ctx, "reports.view")) return <EmptyState>لا تملكين صلاحية عرض التقارير.</EmptyState>;

  const { period: rawPeriod } = await searchParams;
  const period: ReportPeriod = rawPeriod === "last" || rawPeriod === "week" ? rawPeriod : "month";
  const data = await buildReport({
    salonId: salon.id,
    timeZone: salon.timezone,
    period,
    quotaRemaining: ctx.remaining.monthlyBookings,
  });
  const { current: c, previous: p, daily, range, staffRows, month } = data;
  const tz = salon.timezone;
  const showCommission = hasFeature(ctx.entitlements, "commission");
  const maxDaily = Math.max(1, ...daily.map((d) => d.count));

  const kpis = [
    { label: "حجوزات جديدة", value: String(c.bookingsCreated), delta: trend(c.bookingsCreated, p.bookingsCreated) },
    { label: "مواعيد مكتملة", value: String(c.completed), delta: trend(c.completed, p.completed) },
    { label: "إيراد الخدمات المكتملة", value: formatSar(c.serviceRevenueHalalas), delta: trend(c.serviceRevenueHalalas, p.serviceRevenueHalalas) },
    { label: "عربون محصّل", value: formatSar(c.depositsCollectedHalalas), delta: trend(c.depositsCollectedHalalas, p.depositsCollectedHalalas) },
    { label: "نسبة الإلغاء", value: pct(c.cancellationRate), delta: null, warn: c.cancellationRate > 0.15 },
    { label: "نسبة الغياب", value: pct(c.noShowRate), delta: null, warn: c.noShowRate > 0.1 },
  ];

  return (
    <div>
      <PageHeader
        title="التقارير"
        subtitle={`${formatLocalDate(range.from, tz)} — ${formatLocalDate(addDays(range.to, -1), tz)}`}
        action={
          <div className="flex flex-wrap gap-2 print:hidden">
            <a href={`/dashboard/reports/export?period=${period}`} className={btnPrimary}>
              تصدير إلى Excel
            </a>
            <PrintButton />
          </div>
        }
      />

      <div className="mb-8 flex flex-wrap items-center gap-2 print:hidden">
        {PERIODS.map((item) => (
          <Link
            key={item.key}
            href={`/dashboard/reports?period=${item.key}`}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              period === item.key ? "bg-brand text-white" : "border border-brand/20 bg-white text-brand hover:bg-brand-soft"
            }`}
          >
            {item.label}
          </Link>
        ))}
        <span className="text-xs text-zinc-500">المقارنة مع الفترة السابقة المماثلة</span>
      </div>

      <h2 className="mb-3 text-lg font-bold text-ink">نظرة الشهر الحالي</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="حجوزات مؤكدة هذا الشهر" value={String(month.confirmed)} note="لم تُنفَّذ بعد" tone="emerald" />
        <Stat
          label="العائد المتوقع هذا الشهر"
          value={formatSar(month.expectedRevenueHalalas)}
          note={`مكتمل ${formatSar(month.completedRevenueHalalas)} + مؤكد ${formatSar(month.confirmedRevenueHalalas)}`}
          tone="gold"
        />
        <Stat label="مواعيد متاحة حتى نهاية الشهر" value={String(month.freeSlots)} note="لكامل الصالون (حسب أقصر خدمة)" tone="sky" />
        <Stat
          label="حجوزات متبقية من حد الباقة"
          value={String(month.quotaRemaining)}
          note={`من ${ctx.entitlements.monthlyBookings} حجز شهرياً`}
          tone={month.quotaRemaining <= 10 ? "rose" : "brand"}
        />
      </div>

      <h2 className="mb-3 mt-10 text-lg font-bold text-ink">مؤشرات الفترة</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((k, i) => {
          const bar = STAT_TONES[KPI_TONES[i % KPI_TONES.length]].bar;
          return (
            <div key={k.label} className="relative overflow-hidden rounded-2xl border border-brand/10 bg-white p-5 shadow-sm">
              <span className={`absolute inset-y-0 start-0 w-1.5 ${bar}`} aria-hidden />
              <p className="text-sm font-semibold text-zinc-600">{k.label}</p>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <p className={`font-serif text-2xl font-bold ${k.warn ? "text-rose-700" : "text-ink"}`}>{k.value}</p>
                {k.delta && <span className={`text-sm font-bold ${k.delta.tone}`}>{k.delta.text}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <Card className="mt-8">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-bold text-ink">الحجوزات يوماً بيوم</h2>
          <p className="text-xs text-zinc-500">أعلى يوم: {maxDaily} حجز</p>
        </div>
        <div className="flex h-56 items-end gap-[3px]" dir="ltr">
          {daily.map((d) => {
            const unit = (n: number) => `${(n / maxDaily) * 100}%`;
            return (
              <div key={d.day} className="flex h-full flex-1 flex-col justify-end" title={`${d.day} — مؤكد ${d.confirmed}، مكتمل ${d.completed}، لم تحضر ${d.noShow}`}>
                <div className="flex w-full flex-col-reverse overflow-hidden rounded-t" style={{ height: unit(d.count) }}>
                  <div className={STATUS_COLOR.completed.bar} style={{ height: `${d.count ? (d.completed / d.count) * 100 : 0}%` }} />
                  <div className={STATUS_COLOR.confirmed.bar} style={{ height: `${d.count ? (d.confirmed / d.count) * 100 : 0}%` }} />
                  <div className={STATUS_COLOR.noShow.bar} style={{ height: `${d.count ? (d.noShow / d.count) * 100 : 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-zinc-500" dir="ltr">
          <span>{daily[0]?.day.slice(5)}</span>
          <span>{daily[daily.length - 1]?.day.slice(5)}</span>
        </div>

        <div className="mt-5 grid gap-3 border-t border-zinc-100 pt-4 sm:grid-cols-3">
          {(
            [
              ["confirmed", "مؤكد", `حجز قادم سيتم تنفيذه (${c.confirmed})`],
              ["completed", "مكتمل", `خدمة تمت بالفعل (${c.completed})`],
              ["noShow", "لم تحضر", `عميلة لم تحضر موعدها (${c.noShow})`],
            ] as const
          ).map(([key, label, desc]) => (
            <div key={key} className="flex items-start gap-3">
              <span className={`mt-1 h-3 w-3 shrink-0 rounded-sm ${STATUS_COLOR[key].chip}`} />
              <div>
                <p className={`text-sm font-bold ${STATUS_COLOR[key].text}`}>{label}</p>
                <p className="text-xs text-zinc-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-400">الحجوزات الملغاة لا تُحسب في الرسم.</p>
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-bold text-ink">توزيع الحالات</h2>
          <ul className="space-y-3 text-sm">
            {[
              { label: "مؤكد", value: c.confirmed, tone: "bg-emerald-500" },
              { label: "مكتمل", value: c.completed, tone: "bg-sky-500" },
              { label: "لم تحضر", value: c.noShow, tone: "bg-rose-500" },
              { label: "ملغى", value: c.cancelled, tone: "bg-zinc-400" },
            ].map((s) => {
              const total = c.confirmed + c.completed + c.noShow + c.cancelled || 1;
              return (
                <li key={s.label}>
                  <div className="mb-1 flex justify-between font-semibold">
                    <span>{s.label}</span>
                    <span>{s.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div className={`h-full rounded-full ${s.tone}`} style={{ width: `${(s.value / total) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-4 font-bold text-ink">أكثر الخدمات طلباً</h2>
          {c.topServices.length === 0 ? (
            <p className="text-sm text-zinc-500">لا حجوزات في هذه الفترة.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {c.topServices.map((s, i) => (
                <li key={s.name}>
                  <div className="mb-1 flex justify-between font-semibold">
                    <span>{i + 1}. {s.name}</span>
                    <span>{s.count} حجز</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div className="h-full rounded-full bg-gradient-to-l from-gold to-brand" style={{ width: `${(s.count / c.topServices[0].count) * 100}%` }} />
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
              {showCommission && <th className="p-4 text-start">نسبة العمولة</th>}
              {showCommission && <th className="p-4 text-start">مستحق العمولة</th>}
            </tr>
          </thead>
          <tbody>
            {staffRows.map((s) => (
              <tr key={s.id} className="border-t border-zinc-100">
                <td className="p-4 font-bold">{s.name}</td>
                <td className="p-4">{s.completed}</td>
                <td className="p-4">{formatSar(s.revenueHalalas)}</td>
                {showCommission && <td className="p-4">{s.commissionPercent}%</td>}
                {showCommission && <td className="p-4 font-bold text-brand">{formatSar(s.commissionHalalas)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!showCommission && (
        <div className="mt-6">
          <UpgradeCard feature="commission" />
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card className="border-emerald-200 bg-emerald-50/60">
          <p className="font-bold text-emerald-800">عربون من غير الحاضرات</p>
          <p className="mt-1 text-xs text-zinc-600">عربون لا يُعاد عند الغياب، وهو ربح صافٍ للصالون.</p>
          <p className="mt-3 font-serif text-2xl font-bold text-emerald-800">{formatSar(c.noShowDepositHalalas)}</p>
        </Card>
        <Card>
          <p className="font-bold text-ink">عميلات جدد في الفترة</p>
          <p className="mt-1 text-xs text-zinc-600">عميلات سُجّلن لأول مرة خلال هذه الفترة.</p>
          <p className="mt-3 font-serif text-2xl font-bold">{c.newCustomers}</p>
        </Card>
      </div>
    </div>
  );
}
