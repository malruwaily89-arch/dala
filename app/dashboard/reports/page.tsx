import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getMonthlyReport, getAdvancedReport } from "@/app/actions/reports";
import { EmptyState } from "../ui";
import { formatSar, isProPlan } from "@/lib/utils";

export default async function ReportsPage() {
  const user = await requireUser();
  const report = await getMonthlyReport();
  const isPro = isProPlan(user.tenant.plan);
  const advanced = isPro ? await getAdvancedReport() : null;

  const monthLabel = new Date().toLocaleDateString("ar-SA", { month: "long", year: "numeric" });

  return (
    <div>
      <h1 className="text-2xl font-extrabold">تقرير الشهر</h1>
      <p className="mt-1 text-sm text-zinc-500">ملخص أداء صالونك خلال {monthLabel}.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="مواعيد مؤكدة" value={String(report.confirmedCount)} />
        <StatCard label="مواعيد مكتملة" value={String(report.doneCount)} />
        <StatCard label="مواعيد ملغاة" value={String(report.cancelledCount)} />
        <StatCard label="لم تحضر" value={String(report.noShowCount)} />
        <StatCard label="عربونات محصّلة" value={formatSar(report.collectedDeposits)} />
        <StatCard label="عميلات جديدة هذا الشهر" value={String(report.newCustomersCount)} />
      </div>

      <h2 className="mt-10 text-lg font-bold">أكثر الخدمات طلباً</h2>
      {report.topServices.length === 0 ? (
        <EmptyState text="لا حجوزات مسجّلة هذا الشهر بعد." />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-start text-sm">
            <thead className="bg-zinc-50 text-start text-xs font-bold text-zinc-500">
              <tr>
                <th className="p-4 text-start">الخدمة</th>
                <th className="p-4 text-start">عدد الحجوزات</th>
              </tr>
            </thead>
            <tbody>
              {report.topServices.map((s) => (
                <tr key={s.name} className="border-t border-zinc-100">
                  <td className="p-4 font-bold">{s.name}</td>
                  <td className="p-4 text-zinc-600">{s.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-10 text-lg font-bold">أكثر الموظفات انشغالاً</h2>
      {report.topStaff.length === 0 ? (
        <EmptyState text="لا حجوزات مسجّلة هذا الشهر بعد." />
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {report.topStaff.map((s) => (
            <div key={s.name} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-baseline justify-between">
                <p className="font-bold">{s.name}</p>
                <p className="text-sm text-zinc-500">{s.count} موعد</p>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {s.services.map((svc) => (
                  <li key={svc.name} className="flex items-center justify-between text-zinc-600">
                    <span>{svc.name}</span>
                    <span className="font-semibold text-zinc-800">{svc.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-bold text-emerald-800">عربون محصّل من غير الحاضرات</p>
          <p className="mt-1 text-xs text-zinc-500">
            عربون لا يُعاد للعميلة التي لم تحضر — ربح صافٍ للصالون.
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-emerald-800">
              {formatSar(report.noShowDepositTotal)}
            </p>
            <p className="text-sm text-zinc-500">من {report.noShowDepositCount} حالة</p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-bold text-amber-800">عربون محصّل من حجوزات مُعدَّلة</p>
          <p className="mt-1 text-xs text-zinc-500">
            عربون مدفوع سابقاً لحجوزات تم تعديل موعدها.
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-amber-800">
              {formatSar(report.rescheduledDepositTotal)}
            </p>
            <p className="text-sm text-zinc-500">من {report.rescheduledDepositCount} حجز</p>
          </div>
        </div>
      </div>

      {isPro && advanced ? (
        <div className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            تقارير متقدمة
            <span className="rounded-full bg-gradient-to-l from-amber-400 to-purple-500 px-3 py-0.5 text-xs font-bold text-white">
              برو
            </span>
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdvancedCard
              label="مقارنة العربون المحصّل مع الشهر السابق"
              value={`${advanced.revenueChangePercent >= 0 ? "+" : ""}${advanced.revenueChangePercent.toFixed(1)}%`}
              note={`${formatSar(advanced.currentCollected)} هذا الشهر مقابل ${formatSar(advanced.prevCollected)} الشهر السابق`}
              tone={advanced.revenueChangePercent >= 0 ? "positive" : "negative"}
            />
            <AdvancedCard
              label="أكثر أيام الأسبوع ازدحاماً"
              value={advanced.busiestDayLabel ?? "—"}
              note={advanced.busiestDayLabel ? `${advanced.busiestDayCount} موعد` : "لا بيانات كافية"}
            />
            <AdvancedCard
              label="أكثر ساعات اليوم طلباً"
              value={advanced.busiestHourLabel ?? "—"}
              note={advanced.busiestHourLabel ? `${advanced.busiestHourCount} موعد` : "لا بيانات كافية"}
            />
            <AdvancedCard
              label="معدل تحصيل العربون"
              value={`${advanced.depositCollectionRate.toFixed(1)}%`}
              note="من إجمالي مواعيد هذا الشهر"
            />
            <AdvancedCard
              label="معدل الإلغاء"
              value={`${advanced.cancellationRate.toFixed(1)}%`}
              note="من إجمالي مواعيد هذا الشهر"
              tone={advanced.cancellationRate > 15 ? "negative" : undefined}
            />
            <AdvancedCard
              label="معدل عدم الحضور"
              value={`${advanced.noShowRate.toFixed(1)}%`}
              note="من إجمالي مواعيد هذا الشهر"
              tone={advanced.noShowRate > 15 ? "negative" : undefined}
            />
          </div>
        </div>
      ) : (
        <div className="mt-10 rounded-xl border-2 border-purple-200 bg-gradient-to-l from-amber-50 to-purple-50 p-5">
          <p className="flex items-center gap-2 font-bold text-purple-800">
            رقّي لباقة برو للحصول على تقارير متقدمة
            <span className="rounded-full bg-gradient-to-l from-amber-400 to-purple-500 px-3 py-0.5 text-xs font-bold text-white">
              برو
            </span>
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            مقارنة الأداء الشهري، أكثر الأيام والساعات ازدحاماً، ومعدلات التحصيل والإلغاء وعدم الحضور.
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-block rounded-full bg-gradient-to-l from-amber-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            رقّي إلى باقة برو
          </Link>
        </div>
      )}
    </div>
  );
}

function AdvancedCard({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone?: "positive" | "negative";
}) {
  const valueColor =
    tone === "positive" ? "text-emerald-700" : tone === "negative" ? "text-rose-700" : "text-zinc-800";
  return (
    <div className="rounded-xl border border-purple-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${valueColor}`}>{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{note}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
}
