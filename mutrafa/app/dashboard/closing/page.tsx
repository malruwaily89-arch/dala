import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireDashboardUser, canUse } from "@/lib/guard";
import { localDayBounds, localDayKey, addDays, formatLocalDate } from "@/lib/time";
import { formatSar } from "@/lib/money";
import { PrintButton } from "@/components/dashboard/print-button";
import { Banner, Card, EmptyState, PageHeader, Stat, btnGhost } from "@/components/ui";

export const metadata: Metadata = { title: "الإغلاق اليومي" };

export default async function ClosingPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { user, salon, ctx } = await requireDashboardUser();
  if (!canUse(user, ctx, "reports.view")) return <EmptyState>لا تملكين صلاحية عرض التقارير.</EmptyState>;

  const { date } = await searchParams;
  const tz = salon.timezone;
  const dayKey = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : localDayKey(new Date(), tz);
  const { start, end } = localDayBounds(dayKey, tz);
  const anchor = new Date(`${dayKey}T12:00:00Z`);
  const prev = localDayKey(addDays(anchor, -1), "UTC");
  const next = localDayKey(addDays(anchor, 1), "UTC");

  const [closedDay, appointments] = await Promise.all([
    db.closedDay.findUnique({ where: { salonId_dayKey: { salonId: salon.id, dayKey } }, select: { reason: true } }),
    db.appointment.findMany({
      where: { salonId: salon.id, startsAt: { gte: start, lt: end } },
      include: { calendar: { select: { name: true } } },
    }),
  ]);

  const completed = appointments.filter((a) => a.status === "COMPLETED");
  const noShows = appointments.filter((a) => a.status === "NO_SHOW");
  const cancelled = appointments.filter((a) => a.status === "CANCELLED" || a.status === "EXPIRED");
  const pending = appointments.filter((a) => a.status === "PENDING_DEPOSIT");
  const upcoming = appointments.filter((a) => a.status === "CONFIRMED");

  const revenue = completed.reduce((sum, a) => sum + a.priceHalalas, 0);
  // العربون المحصّل: من الحجوزات المؤكدة والمكتملة وحجوزات عدم الحضور (يُحتفظ به)
  const depositsCollected = [...upcoming, ...completed, ...noShows].reduce((sum, a) => sum + a.depositHalalas, 0);
  const forfeited = noShows.reduce((sum, a) => sum + a.depositHalalas, 0);

  const byStaff = new Map<string, { name: string; done: number; revenue: number; noShows: number }>();
  for (const a of appointments) {
    const row = byStaff.get(a.calendarId) ?? { name: a.calendar.name, done: 0, revenue: 0, noShows: 0 };
    if (a.status === "COMPLETED") {
      row.done += 1;
      row.revenue += a.priceHalalas;
    }
    if (a.status === "NO_SHOW") row.noShows += 1;
    byStaff.set(a.calendarId, row);
  }
  const staffRows = [...byStaff.values()].sort((a, b) => b.revenue - a.revenue);

  return (
    <div>
      <PageHeader
        title="الإغلاق اليومي"
        subtitle={formatLocalDate(start, tz)}
        action={<PrintButton />}
      />
      {closedDay && <Banner tone="warning">هذا اليوم مُسجَّل كيوم إغلاق{closedDay.reason ? `: ${closedDay.reason}` : ""}.</Banner>}

      <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
        <Link href={`/dashboard/closing?date=${prev}`} className={btnGhost}>‹ اليوم السابق</Link>
        <form className="flex items-center gap-2">
          <input type="date" name="date" defaultValue={dayKey} className="rounded-xl border border-zinc-300 px-3 py-2 text-sm" />
          <button className={btnGhost}>عرض</button>
        </form>
        <Link href={`/dashboard/closing?date=${next}`} className={btnGhost}>اليوم التالي ›</Link>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="إيراد الخدمات المكتملة" value={formatSar(revenue)} note={`${completed.length} خدمة مكتملة`} tone="gold" />
        <Stat label="العربون المحصّل" value={formatSar(depositsCollected)} note="للمؤكدة والمكتملة وعدم الحضور" tone="emerald" />
        <Stat label="عربون محتفظ به" value={formatSar(forfeited)} note={`${noShows.length} لم تحضر`} tone="rose" />
        <Stat label="بانتظار العربون" value={String(pending.length)} note={`${cancelled.length} ملغى`} tone={pending.length ? "amber" : "brand"} />
      </div>

      <Card className="mb-6 print:shadow-none">
        <h2 className="mb-1 font-bold text-ink">تفصيل الموظفات</h2>
        <p className="mb-4 text-xs text-zinc-500">
          النظام لا يسجّل طريقة الدفع (نقداً أو تحويلاً) لكل مبلغ. هذه الأرقام تقديرية للمراجعة مع الدرج النقدي.
        </p>
        {staffRows.length === 0 ? (
          <p className="text-sm text-zinc-500">لا حجوزات في هذا اليوم.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-start text-sm">
              <thead className="bg-brand-soft/60 text-xs font-bold text-zinc-600">
                <tr>
                  <th className="p-3 text-start">الموظفة</th>
                  <th className="p-3 text-start">مكتملة</th>
                  <th className="p-3 text-start">لم تحضر</th>
                  <th className="p-3 text-start">الإيراد</th>
                </tr>
              </thead>
              <tbody>
                {staffRows.map((r) => (
                  <tr key={r.name} className="border-t border-zinc-100">
                    <td className="p-3 font-semibold text-brand">{r.name}</td>
                    <td className="p-3">{r.done}</td>
                    <td className="p-3 text-rose-700">{r.noShows}</td>
                    <td className="p-3 font-bold text-gold">{formatSar(r.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
