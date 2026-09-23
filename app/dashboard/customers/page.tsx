import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { EmptyState } from "../ui";

export default async function CustomersPage() {
  const user = await requireUser();

  const customers = await db.customer.findMany({
    where: { tenantId: user.tenantId },
    include: { appointments: { orderBy: { startsAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-extrabold">العميلات</h1>
      <p className="mt-1 text-sm text-zinc-500">
        عداد «لم تحضر» يساعدك على طلب عربون أعلى من المتكررات.
      </p>

      {customers.length === 0 ? (
        <EmptyState text="لا عميلات بعد — ستُضاف تلقائياً مع أول حجز." />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-start text-sm">
            <thead className="bg-zinc-50 text-start text-xs font-bold text-zinc-500">
              <tr>
                <th className="p-4 text-start">الاسم</th>
                <th className="p-4 text-start">الجوال</th>
                <th className="p-4 text-start">آخر زيارة</th>
                <th className="p-4 text-start">عدد الغيابات</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-t border-zinc-100">
                  <td className="p-4 font-bold">{c.name}</td>
                  <td dir="ltr" className="p-4 text-zinc-600">
                    {c.phone}
                  </td>
                  <td className="p-4 text-zinc-600">
                    {c.appointments[0]
                      ? c.appointments[0].startsAt.toLocaleDateString("ar-SA")
                      : "—"}
                  </td>
                  <td className="p-4">
                    {c.noShowCount > 0 ? (
                      <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                        {c.noShowCount} ⚠️
                      </span>
                    ) : (
                      <span className="text-zinc-400">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
