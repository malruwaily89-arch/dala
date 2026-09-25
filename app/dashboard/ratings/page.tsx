import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { EmptyState } from "../ui";
import { formatDateTime, isProPlan } from "@/lib/utils";

export default async function RatingsPage() {
  const user = await requireUser();
  const isPro = isProPlan(user.tenant.plan);

  const ratings = await db.rating.findMany({
    where: { tenantId: user.tenantId },
    include: {
      customer: true,
      appointment: { include: { service: true, staff: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const averageScore =
    ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length : 0;

  // تحليل متقدم (باقات برو فقط): تقييم كل موظفة وكل خدمة على حدة
  const staffMap = new Map<string, { name: string; total: number; count: number }>();
  const serviceMap = new Map<string, { name: string; total: number; count: number }>();
  for (const r of ratings) {
    const staffName = r.appointment.staff.name;
    const staffEntry = staffMap.get(staffName) ?? { name: staffName, total: 0, count: 0 };
    staffEntry.total += r.score;
    staffEntry.count += 1;
    staffMap.set(staffName, staffEntry);

    const serviceName = r.appointment.service.name;
    const serviceEntry = serviceMap.get(serviceName) ?? { name: serviceName, total: 0, count: 0 };
    serviceEntry.total += r.score;
    serviceEntry.count += 1;
    serviceMap.set(serviceName, serviceEntry);
  }
  const staffAverages = [...staffMap.values()]
    .map((s) => ({ name: s.name, avg: s.total / s.count, count: s.count }))
    .sort((a, b) => b.avg - a.avg);
  const serviceAverages = [...serviceMap.values()]
    .map((s) => ({ name: s.name, avg: s.total / s.count, count: s.count }))
    .sort((a, b) => b.avg - a.avg);

  const topStaff = staffAverages[0];
  const lowStaff = staffAverages.length > 1 ? staffAverages[staffAverages.length - 1] : null;
  const topService = serviceAverages[0];
  const lowService = serviceAverages.length > 1 ? serviceAverages[serviceAverages.length - 1] : null;

  return (
    <div>
      <h1 className="text-2xl font-extrabold">التقييمات</h1>
      <p className="mt-1 text-sm text-zinc-500">آراء العميلات في الخدمات المكتملة.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-500">متوسط التقييم</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-2xl font-extrabold">{averageScore.toFixed(1)}</p>
            <p dir="ltr" className="text-lg text-brand">
              {"★".repeat(Math.round(averageScore))}
              <span className="text-pink-200">{"★".repeat(5 - Math.round(averageScore))}</span>
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-500">عدد التقييمات</p>
          <p className="mt-1 text-2xl font-extrabold">{ratings.length}</p>
        </div>
      </div>

      {ratings.length === 0 ? (
        <EmptyState text="لا تقييمات مسجّلة بعد." />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-start text-sm">
            <thead className="bg-zinc-50 text-start text-xs font-bold text-zinc-500">
              <tr>
                <th className="p-4 text-start">العميلة</th>
                <th className="p-4 text-start">الخدمة</th>
                <th className="p-4 text-start">الموظفة</th>
                <th className="p-4 text-start">التقييم</th>
                <th className="p-4 text-start">التعليق</th>
                <th className="p-4 text-start">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {ratings.map((r) => (
                <tr key={r.id} className="border-t border-zinc-100">
                  <td className="p-4 font-bold">{r.customer.name}</td>
                  <td className="p-4 text-zinc-600">{r.appointment.service.name}</td>
                  <td className="p-4 text-zinc-600">{r.appointment.staff.name}</td>
                  <td className="p-4">
                    <span dir="ltr" className="text-brand">
                      {"★".repeat(r.score)}
                      <span className="text-pink-200">{"★".repeat(5 - r.score)}</span>
                    </span>
                  </td>
                  <td className="p-4 text-zinc-600">{r.comment ?? "—"}</td>
                  <td className="p-4 text-zinc-500">{formatDateTime(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isPro ? (
        <div className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            تحليل التقييمات المتقدم
            <span className="rounded-full bg-gradient-to-l from-amber-400 to-purple-500 px-3 py-0.5 text-xs font-bold text-white">
              برو
            </span>
          </h2>

          {ratings.length === 0 ? (
            <EmptyState text="لا توجد بيانات كافية للتحليل المتقدم بعد." />
          ) : (
            <>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {topStaff && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                    <p className="font-bold text-emerald-800">أعلى تقييماً — الموظفات</p>
                    <p className="mt-2 text-xl font-extrabold text-emerald-800">{topStaff.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {topStaff.avg.toFixed(1)} ★ من {topStaff.count} تقييم
                    </p>
                  </div>
                )}
                {lowStaff && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
                    <p className="font-bold text-rose-800">يحتاج تحسين — الموظفات</p>
                    <p className="mt-2 text-xl font-extrabold text-rose-800">{lowStaff.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {lowStaff.avg.toFixed(1)} ★ من {lowStaff.count} تقييم
                    </p>
                  </div>
                )}
                {topService && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                    <p className="font-bold text-emerald-800">أعلى تقييماً — الخدمات</p>
                    <p className="mt-2 text-xl font-extrabold text-emerald-800">{topService.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {topService.avg.toFixed(1)} ★ من {topService.count} تقييم
                    </p>
                  </div>
                )}
                {lowService && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
                    <p className="font-bold text-rose-800">يحتاج تحسين — الخدمات</p>
                    <p className="mt-2 text-xl font-extrabold text-rose-800">{lowService.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {lowService.avg.toFixed(1)} ★ من {lowService.count} تقييم
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-bold text-zinc-700">تقييم كل موظفة</h3>
                  <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
                    <table className="w-full text-start text-sm">
                      <thead className="bg-zinc-50 text-xs font-bold text-zinc-500">
                        <tr>
                          <th className="p-3 text-start">الموظفة</th>
                          <th className="p-3 text-start">المتوسط</th>
                          <th className="p-3 text-start">عدد التقييمات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffAverages.map((s) => (
                          <tr key={s.name} className="border-t border-zinc-100">
                            <td className="p-3 font-bold">{s.name}</td>
                            <td className="p-3 text-brand">{s.avg.toFixed(1)} ★</td>
                            <td className="p-3 text-zinc-500">{s.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-zinc-700">تقييم كل خدمة</h3>
                  <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
                    <table className="w-full text-start text-sm">
                      <thead className="bg-zinc-50 text-xs font-bold text-zinc-500">
                        <tr>
                          <th className="p-3 text-start">الخدمة</th>
                          <th className="p-3 text-start">المتوسط</th>
                          <th className="p-3 text-start">عدد التقييمات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviceAverages.map((s) => (
                          <tr key={s.name} className="border-t border-zinc-100">
                            <td className="p-3 font-bold">{s.name}</td>
                            <td className="p-3 text-brand">{s.avg.toFixed(1)} ★</td>
                            <td className="p-3 text-zinc-500">{s.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="mt-10 rounded-xl border-2 border-purple-200 bg-gradient-to-l from-amber-50 to-purple-50 p-5">
          <p className="flex items-center gap-2 font-bold text-purple-800">
            رقّي لباقة برو للحصول على تحليلات تقييم متقدمة
            <span className="rounded-full bg-gradient-to-l from-amber-400 to-purple-500 px-3 py-0.5 text-xs font-bold text-white">
              برو
            </span>
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            تقييم كل موظفة وكل خدمة على حدة، وتحديد الأعلى والأحوج للتحسين تلقائياً.
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
