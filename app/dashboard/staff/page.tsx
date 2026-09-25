import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseWorkingHours } from "@/lib/scheduling";
import { createStaffAction, toggleStaffAction } from "@/app/actions/appointments";
import { getStaffPerformanceReport } from "@/app/actions/reports";
import { formatSar } from "@/lib/utils";
import { EmptyState, Banner } from "../ui";

const PERFORMANCE_LABEL: Record<string, { label: string; className: string }> = {
  busy: { label: "مشغولة جداً", className: "bg-rose-100 text-rose-700" },
  active: { label: "نشطة", className: "bg-emerald-100 text-emerald-700" },
  quiet: { label: "هادئة", className: "bg-zinc-100 text-zinc-500" },
};

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;

  const [staff, performance] = await Promise.all([
    db.staff.findMany({
      where: { tenantId: user.tenantId },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    }),
    getStaffPerformanceReport(),
  ]);
  const perfById = new Map(performance.rows.map((r) => [r.id, r]));

  const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  return (
    <div>
      <h1 className="text-2xl font-extrabold">الموظفات</h1>
      <p className="mt-1 text-sm text-zinc-500">
        ساعات عمل كل موظفة تحدد المواعيد المتاحة في صفحة الحجز.
      </p>

      {error && <Banner>{error}</Banner>}

      <details className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer font-bold text-brand">+ موظفة جديدة</summary>
        <form action={createStaffAction} className="mt-4 flex flex-wrap items-end gap-3">
          <Field name="name" label="الاسم" type="text" />
          <Field name="phone" label="الجوال (اختياري)" type="tel" />
          <Field name="workStart" label="من" type="time" />
          <Field name="workEnd" label="إلى" type="time" />
          <button className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:opacity-90">
            حفظ
          </button>
        </form>
      </details>

      {staff.length === 0 ? (
        <EmptyState text="أضيفي أول موظفة لتفعيل الحجوزات." />
      ) : (
        <ul className="mt-4 space-y-3">
          {staff.map((s) => {
            const hours = parseWorkingHours(s.workingHours);
            const perf = perfById.get(s.id);
            const perfInfo = perf ? PERFORMANCE_LABEL[perf.performanceLevel] : null;
            return (
              <li
                key={s.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="min-w-56 flex-1">
                    <p className="font-bold">{s.name}</p>
                    <p className="text-sm text-zinc-600">
                      {hours.start} — {hours.end} ·{" "}
                      {hours.days.map((d) => DAY_NAMES[d]).join("، ")}
                    </p>
                  </div>
                  {perfInfo && (
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${perfInfo.className}`}>
                      {perfInfo.label}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {s.isActive ? "على رأس العمل" : "موقوفة"}
                  </span>
                  <form action={toggleStaffAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50">
                      {s.isActive ? "إيقاف" : "تفعيل"}
                    </button>
                  </form>
                </div>

                {perf && (
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-3 sm:grid-cols-4">
                    <MetricBox label="مواعيد اليوم" value={String(perf.todayCount)} />
                    <MetricBox label="مواعيد الشهر" value={String(perf.monthCount)} />
                    <MetricBox label="محصّل اليوم" value={formatSar(perf.collectedToday)} />
                    <MetricBox label="محصّل هذا الشهر" value={formatSar(perf.collectedMonthTotal)} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {staff.length > 0 && (
        <>
          <h2 className="mt-10 text-lg font-bold">ملخص المبالغ المحصّلة لكل موظفة</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-start text-sm">
              <thead className="bg-zinc-50 text-xs font-bold text-zinc-500">
                <tr>
                  <th className="p-4 text-start">الموظفة</th>
                  <th className="p-4 text-start">مواعيد اليوم</th>
                  <th className="p-4 text-start">محصّل اليوم</th>
                  <th className="p-4 text-start">مواعيد الشهر</th>
                  <th className="p-4 text-start">محصّل الشهر</th>
                  <th className="p-4 text-start">الأداء</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => {
                  const perf = perfById.get(s.id);
                  const perfInfo = perf ? PERFORMANCE_LABEL[perf.performanceLevel] : null;
                  return (
                    <tr key={s.id} className="border-t border-zinc-100">
                      <td className="p-4 font-bold">{s.name}</td>
                      <td className="p-4 text-zinc-600">{perf?.todayCount ?? 0}</td>
                      <td className="p-4 text-zinc-600">{formatSar(perf?.collectedToday ?? 0)}</td>
                      <td className="p-4 text-zinc-600">{perf?.monthCount ?? 0}</td>
                      <td className="p-4 font-semibold text-zinc-800">
                        {formatSar(perf?.collectedMonthTotal ?? 0)}
                      </td>
                      <td className="p-4">
                        {perfInfo && (
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${perfInfo.className}`}>
                            {perfInfo.label}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 px-3 py-2 text-center">
      <p className="text-sm font-extrabold text-zinc-800">{value}</p>
      <p className="text-[11px] font-semibold text-zinc-500">{label}</p>
    </div>
  );
}

function Field({ name, label, type }: { name: string; label: string; type: string }) {
  return (
    <label className="block flex-1">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      <input
        name={name}
        type={type}
        dir={type === "tel" ? "ltr" : undefined}
        required={type !== "tel"}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
      />
    </label>
  );
}
