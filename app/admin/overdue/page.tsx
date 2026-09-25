import { getOverdueTenants } from "@/app/actions/admin";

export default async function OverduePage() {
  const overdue = await getOverdueTenants();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">المتأخرات في الدفع</h1>
        <p className="mt-1 text-sm text-zinc-500">صالونات اشتراكها متأخر (past_due) ومتى ينتهي.</p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mt-1 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 text-zinc-500">
              <tr>
                <th className="py-2 text-start font-semibold">الصالون</th>
                <th className="py-2 text-start font-semibold">الهاتف</th>
                <th className="py-2 text-start font-semibold">الباقة</th>
                <th className="py-2 text-start font-semibold">نهاية الفترة الحالية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {overdue.map((o) => (
                <tr key={o.id}>
                  <td className="py-3 font-bold">{o.tenantName}</td>
                  <td className="py-3" dir="ltr">{o.tenantPhone}</td>
                  <td className="py-3">{o.plan}</td>
                  <td className="py-3 text-amber-700">
                    {new Date(o.currentPeriodEnd).toLocaleDateString("ar-SA")}
                  </td>
                </tr>
              ))}
              {overdue.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-400">لا توجد صالونات متأخرة.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
