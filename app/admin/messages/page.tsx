import { getMessageStats } from "@/app/actions/admin";

export default async function MessagesPage() {
  const stats = await getMessageStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">رسائل واتساب</h1>
        <p className="mt-1 text-sm text-zinc-500">ملخص الرسائل المرسلة عبر المنصة.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="إجمالي الرسائل" value={String(stats.total)} />
        <StatCard label="ناجحة (delivered)" value={String(stats.delivered)} />
        <StatCard label="فاشلة (failed)" value={String(stats.failed)} />
        <StatCard label="مُرسلة (sent)" value={String(stats.sent)} />
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">أحدث الرسائل</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 text-zinc-500">
              <tr>
                <th className="py-2 text-start font-semibold">الصالون</th>
                <th className="py-2 text-start font-semibold">القالب</th>
                <th className="py-2 text-start font-semibold">الاتجاه</th>
                <th className="py-2 text-start font-semibold">الحالة</th>
                <th className="py-2 text-start font-semibold">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {stats.recent.map((m) => (
                <tr key={m.id}>
                  <td className="py-3 font-bold">{m.tenantName}</td>
                  <td className="py-3 text-zinc-500">{m.templateName ?? "—"}</td>
                  <td className="py-3">{m.direction === "out" ? "صادر" : "وارد"}</td>
                  <td className="py-3">{messageStatusBadge(m.status)}</td>
                  <td className="py-3 text-zinc-500">
                    {new Date(m.sentAt).toLocaleString("ar-SA")}
                  </td>
                </tr>
              ))}
              {stats.recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-400">لا توجد رسائل بعد.</td>
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

function messageStatusBadge(status: string) {
  const map: Record<string, string> = {
    delivered: "bg-emerald-100 text-emerald-800",
    sent: "bg-sky-100 text-sky-800",
    queued: "bg-zinc-100 text-zinc-600",
    failed: "bg-rose-100 text-rose-800",
  };
  const label: Record<string, string> = {
    delivered: "تم التسليم",
    sent: "مُرسلة",
    queued: "بالانتظار",
    failed: "فاشلة",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${map[status] ?? "bg-zinc-100"}`}>
      {label[status] ?? status}
    </span>
  );
}
