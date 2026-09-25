import { getChurnData } from "@/app/actions/admin";

export default async function ChurnPage() {
  const { canceled, canceledThisMonth, activeAtMonthStart, churnRate } = await getChurnData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">الاضطراب (Churn)</h1>
        <p className="mt-1 text-sm text-zinc-500">الصالونات التي ألغت اشتراكها ومعدل الاضطراب الشهري.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="ملغيات هذا الشهر" value={String(canceledThisMonth)} />
        <StatCard label="نشطة بداية الشهر" value={String(activeAtMonthStart)} />
        <StatCard label="معدل الاضطراب الشهري" value={`${churnRate.toFixed(1)}%`} />
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">الصالونات الملغية</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 text-zinc-500">
              <tr>
                <th className="py-2 text-start font-semibold">الصالون</th>
                <th className="py-2 text-start font-semibold">الباقة</th>
                <th className="py-2 text-start font-semibold">تاريخ الإلغاء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {canceled.map((c) => (
                <tr key={c.id}>
                  <td className="py-3 font-bold">{c.tenantName}</td>
                  <td className="py-3">{c.plan}</td>
                  <td className="py-3 text-zinc-500">
                    {c.canceledAt ? new Date(c.canceledAt).toLocaleDateString("ar-SA") : "—"}
                  </td>
                </tr>
              ))}
              {canceled.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-zinc-400">لا توجد صالونات ملغية.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
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
