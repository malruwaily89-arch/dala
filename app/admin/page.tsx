import {
  getAdminStats,
  getTenantsTable,
  getRecentPayments,
  getGrowthHistory,
  getPlanDistribution,
} from "@/app/actions/admin";
import { formatSar } from "@/lib/utils";

export default async function AdminPage() {
  const stats = await getAdminStats();
  const tenants = await getTenantsTable();
  const payments = await getRecentPayments();
  const growth = await getGrowthHistory();
  const planDist = await getPlanDistribution();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">نظرة عامة على المنصة</h1>
        <p className="mt-1 text-sm text-zinc-500">مؤشرات الصالونات والاشتراكات والمدفوعات.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="عدد الصالونات" value={String(stats.tenantCount)} />
        <StatCard label="الاشتراكات النشطة" value={String(stats.activeSubscriptions)} />
        <StatCard label="MRR" value={formatSar(stats.mrr)} />
        <StatCard label="المدفوعات هذا الشهر" value={formatSar(stats.monthlyPayments)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">نمو MRR والصالونات — آخر 6 أشهر</h2>
          <GrowthChart data={growth} />
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">توزيع الباقات</h2>
          <PlanDistribution counts={planDist} />
        </section>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">الصالونات</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 text-zinc-500">
              <tr>
                <th className="py-2 text-start font-semibold">الصالون</th>
                <th className="py-2 text-start font-semibold">الرابط</th>
                <th className="py-2 text-start font-semibold">الباقة</th>
                <th className="py-2 text-start font-semibold">حالة الاشتراك</th>
                <th className="py-2 text-start font-semibold">آخر دفعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td className="py-3 font-bold">{t.name}</td>
                  <td className="py-3" dir="ltr">/b/{t.slug}</td>
                  <td className="py-3">{t.plan}</td>
                  <td className="py-3">{statusBadge(t.status)}</td>
                  <td className="py-3">
                    {t.lastPayment ? (
                      <span className="text-zinc-600">
                        {formatSar(t.lastPayment.amount)} · {paymentStatusBadge(t.lastPayment.status)}
                      </span>
                    ) : (
                      <span className="text-zinc-400">لا يوجد</span>
                    )}
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-400">لا توجد صالونات بعد.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">المدفوعات الأخيرة</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 text-zinc-500">
              <tr>
                <th className="py-2 text-start font-semibold">الصالون</th>
                <th className="py-2 text-start font-semibold">المبلغ</th>
                <th className="py-2 text-start font-semibold">الحالة</th>
                <th className="py-2 text-start font-semibold">بوابة الدفع</th>
                <th className="py-2 text-start font-semibold">تاريخ الدفع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 font-bold">{p.tenantName}</td>
                  <td className="py-3">{formatSar(p.amount)}</td>
                  <td className="py-3">{paymentStatusBadge(p.status)}</td>
                  <td className="py-3 capitalize">{p.provider}</td>
                  <td className="py-3 text-zinc-500">
                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString("ar-SA") : "—"}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-400">لا توجد مدفوعات بعد.</td>
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

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800",
    trialing: "bg-sky-100 text-sky-800",
    past_due: "bg-amber-100 text-amber-800",
    suspended: "bg-orange-100 text-orange-800",
    canceled: "bg-zinc-100 text-zinc-600",
  };
  const label: Record<string, string> = {
    active: "نشط",
    trialing: "تجريبي",
    past_due: "متأخر",
    suspended: "معلّق",
    canceled: "ملغي",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${map[status] ?? "bg-zinc-100"}`}>
      {label[status] ?? status}
    </span>
  );
}

function GrowthChart({
  data,
}: {
  data: { label: string; tenantCount: number; mrr: number }[];
}) {
  const maxMrr = Math.max(1, ...data.map((d) => d.mrr));
  const maxTenants = Math.max(1, ...data.map((d) => d.tenantCount));
  const width = 320;
  const height = 140;
  const stepX = data.length > 1 ? width / (data.length - 1) : width;

  const mrrPoints = data
    .map((d, i) => `${i * stepX},${height - (d.mrr / maxMrr) * height}`)
    .join(" ");
  const tenantPoints = data
    .map((d, i) => `${i * stepX},${height - (d.tenantCount / maxTenants) * height}`)
    .join(" ");

  return (
    <div className="mt-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 160 }}>
        <polyline points={mrrPoints} fill="none" stroke="#be185d" strokeWidth="2.5" />
        <polyline points={tenantPoints} fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeDasharray="4 3" />
        {data.map((d, i) => (
          <circle key={i} cx={i * stepX} cy={height - (d.mrr / maxMrr) * height} r="3" fill="#be185d" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-zinc-400">
        {data.map((d, i) => (
          <span key={i}>{d.label}</span>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand" /> MRR
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-sky-500" /> عدد الصالونات
        </span>
      </div>
    </div>
  );
}

function PlanDistribution({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const colors: Record<string, string> = {
    BASIC: "bg-sky-500",
    PRO: "bg-brand",
    ADVANCED: "bg-amber-500",
    BASIC_PRO: "bg-purple-500",
    PRO_PRO: "bg-fuchsia-500",
    ADVANCED_PRO: "bg-yellow-500",
  };
  return (
    <div className="mt-4 space-y-3">
      {Object.entries(counts).map(([plan, count]) => (
        <div key={plan}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-semibold">{plan}</span>
            <span className="text-zinc-500">{count} صالون</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className={`h-full rounded-full ${colors[plan] ?? "bg-zinc-400"}`}
              style={{ width: `${(count / total) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function paymentStatusBadge(status: string) {
  const map: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-800",
    pending: "bg-amber-100 text-amber-800",
    failed: "bg-rose-100 text-rose-800",
    refunded: "bg-zinc-100 text-zinc-600",
  };
  const label: Record<string, string> = {
    paid: "مدفوع",
    pending: "معلق",
    failed: "فاشل",
    refunded: "مسترجع",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${map[status] ?? "bg-zinc-100"}`}>
      {label[status] ?? status}
    </span>
  );
}
