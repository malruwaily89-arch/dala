import { getMessageStats } from "@/app/actions/admin";

export default async function MessagesPage() {
  const stats = await getMessageStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-extrabold text-brand">رسائل واتساب</h1>
        <p className="mt-1 text-sm text-foreground/55">ملخص الرسائل المرسلة عبر المنصة.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="إجمالي الرسائل" value={String(stats.total)} />
        <StatCard label="ناجحة (delivered)" value={String(stats.delivered)} />
        <StatCard label="فاشلة (failed)" value={String(stats.failed)} />
        <StatCard label="مُرسلة (sent)" value={String(stats.sent)} />
      </div>

      <section className="rounded-xl border border-brand/10 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">أحدث الرسائل</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-brand/10 text-foreground/55">
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
                <tr key={m.id} className="transition-colors hover:bg-brand-gold/5">
                  <td className="py-3 font-bold">{m.tenantName}</td>
                  <td className="py-3 text-foreground/55">{m.templateName ?? "—"}</td>
                  <td className="py-3">{m.direction === "out" ? "صادر" : "وارد"}</td>
                  <td className="py-3">{messageStatusBadge(m.status)}</td>
                  <td className="py-3 text-foreground/55">
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
    <div className="rounded-xl border border-brand/10 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-sm font-semibold text-foreground/55">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function messageStatusBadge(status: string) {
  const map: Record<string, string> = {
    delivered: "bg-emerald-100 text-emerald-800",
    sent: "bg-sky-100 text-sky-800",
    queued: "bg-zinc-100 text-foreground/65",
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
