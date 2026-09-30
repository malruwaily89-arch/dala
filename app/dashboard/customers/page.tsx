import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatSar, moneyToNumber } from "@/lib/utils";
import { EmptyState } from "../ui";

type Tier = "new" | "occasional" | "regular";

const TIER_LABEL: Record<Tier, { label: string; className: string }> = {
  new: { label: "جديدة", className: "bg-zinc-100 text-foreground/55" },
  occasional: { label: "عادية", className: "bg-sky-100 text-sky-700" },
  regular: { label: "منتظمة", className: "bg-emerald-100 text-emerald-700" },
};

/** التصنيف حسب عدد الزيارات المكتملة فعلياً — لا الحجوزات القادمة أو الملغاة */
function tierOf(completedVisits: number): Tier {
  if (completedVisits >= 3) return "regular";
  if (completedVisits >= 1) return "occasional";
  return "new";
}

export default async function CustomersPage() {
  const user = await requireUser();

  const customers = await db.customer.findMany({
    where: { tenantId: user.tenantId },
    include: {
      appointments: {
        select: { status: true, startsAt: true, service: { select: { price: true } } },
        orderBy: { startsAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const rows = customers.map((c) => {
    // "زيارة" = موعد حقيقي حان وقته فعلاً ولم يُلغَ (مكتمل أو لم تحضر) — لا حجز قادم لم يحن بعد،
    // ولا حجز مُلغى لم يحدث أصلاً
    const realPastAppts = c.appointments.filter((a) => a.status !== "cancelled" && a.startsAt <= now);
    const totalVisits = realPastAppts.length;
    const completedAppts = c.appointments.filter((a) => a.status === "done");
    const completedVisits = completedAppts.length;
    const totalSpent = completedAppts.reduce((sum, a) => sum + moneyToNumber(a.service.price), 0);
    // آخر زيارة = آخر موعد حضرته فعلاً، لا آخر سجل بالتاريخ (اللي ممكن يكون حجز قادم أو ملغى)
    const lastVisit = completedAppts[0]?.startsAt ?? null;
    return { customer: c, totalVisits, completedVisits, totalSpent, lastVisit, tier: tierOf(completedVisits) };
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-extrabold text-brand">العميلات</h1>
      <p className="mt-1 text-sm text-foreground/55">
        التصنيف مبني على عدد الزيارات المكتملة فعلياً — عداد «لم تحضر» يساعدك على طلب عربون أعلى من المتكررات.
      </p>

      {rows.length === 0 ? (
        <EmptyState text="لا عميلات بعد — ستُضاف تلقائياً مع أول حجز." />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-brand/10 bg-white shadow-sm">
          <table className="w-full text-start text-sm">
            <thead className="bg-background text-start text-xs font-bold text-foreground/55">
              <tr>
                <th className="p-4 text-start">الاسم</th>
                <th className="p-4 text-start">الجوال</th>
                <th className="p-4 text-start">التصنيف</th>
                <th className="p-4 text-start">عدد الزيارات</th>
                <th className="p-4 text-start">المكتملة</th>
                <th className="p-4 text-start">إجمالي المبالغ</th>
                <th className="p-4 text-start">آخر زيارة</th>
                <th className="p-4 text-start">عدد الغيابات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ customer: c, totalVisits, completedVisits, totalSpent, lastVisit, tier }) => {
                const tierInfo = TIER_LABEL[tier];
                return (
                  <tr key={c.id} className="border-t border-brand/10">
                    <td className="p-4 font-bold">{c.name}</td>
                    <td dir="ltr" className="p-4 text-foreground/65">
                      {c.phone}
                    </td>
                    <td className="p-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${tierInfo.className}`}>
                        {tierInfo.label}
                      </span>
                    </td>
                    <td className="p-4 text-foreground/65">{totalVisits}</td>
                    <td className="p-4 text-foreground/65">{completedVisits}</td>
                    <td className="p-4 font-semibold text-zinc-800">{formatSar(totalSpent)}</td>
                    <td className="p-4 text-foreground/65">{lastVisit ? lastVisit.toLocaleDateString("ar-SA") : "—"}</td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
