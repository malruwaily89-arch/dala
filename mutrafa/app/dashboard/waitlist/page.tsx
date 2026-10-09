import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireDashboardUser, canUse } from "@/lib/guard";
import { hasFeature } from "@/lib/plans";
import { formatLocalDate } from "@/lib/time";
import { addWaitlistAction } from "@/app/actions/appointments";
import { Badge, Banner, Card, EmptyState, Field, PageHeader, btnPrimary, inputCls } from "@/components/ui";
import { UpgradeCard } from "@/components/dashboard/upgrade";

export const metadata: Metadata = { title: "قائمة الانتظار" };

const WAIT_STATUS: Record<string, { label: string; tone: string }> = {
  WAITING: { label: "بانتظار موعد", tone: "bg-amber-100 text-amber-800" },
  NOTIFIED: { label: "أُخطرت", tone: "bg-sky-100 text-sky-800" },
  BOOKED: { label: "حجزت", tone: "bg-emerald-100 text-emerald-800" },
  REMOVED: { label: "أُزيلت", tone: "bg-zinc-100 text-zinc-600" },
};

export default async function WaitlistPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { user, salon, ctx } = await requireDashboardUser();
  const { error, ok } = await searchParams;
  if (!canUse(user, ctx, "waitlist.manage")) {
    return <UpgradeCard feature="waitlist.manual" />;
  }
  const auto = hasFeature(ctx.entitlements, "waitlist.auto");

  const [entries, services] = await Promise.all([
    db.waitlistEntry.findMany({
      where: { salonId: salon.id },
      include: { customer: true, service: true },
      orderBy: { createdAt: "asc" },
      take: 200,
    }),
    db.service.findMany({ where: { salonId: salon.id, isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="قائمة الانتظار"
        subtitle={auto ? "إشعار تلقائي للعميلة الأولى عند تحرّر موعد في خدمتها." : "أضيفي العميلات يدوياً، وتواصلي معهن عند تحرّر موعد."}
      />
      {error && <Banner>{error}</Banner>}
      {ok === "added" && <Banner tone="success">أُضيفت العميلة إلى قائمة الانتظار.</Banner>}

      <Card className="mb-8">
        <h2 className="mb-4 font-bold text-ink">إضافة عميلة</h2>
        <form action={addWaitlistAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Field label="الاسم" name="customerName" required />
          <Field label="الجوال" name="customerPhone" type="tel" required />
          <Field label="الخدمة">
            <select name="serviceId" required className={inputCls}>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="أقرب تاريخ مفضل" name="preferredDate" type="date" />
          <div className="flex items-end"><button className={`${btnPrimary} w-full`}>إضافة</button></div>
        </form>
      </Card>

      {entries.length === 0 ? (
        <EmptyState>قائمة الانتظار فارغة.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => {
            const st = WAIT_STATUS[e.status];
            return (
              <li key={e.id}>
                <Card className="flex flex-wrap items-center gap-4">
                  <div className="min-w-48 flex-1">
                    <p className="font-bold">{e.customer.name} <span dir="ltr" className="text-xs font-normal text-zinc-500">{e.customer.phone}</span></p>
                    <p className="text-sm text-zinc-600">
                      {e.service.name}
                      {e.preferredFrom && ` · مفضّل من ${formatLocalDate(e.preferredFrom, salon.timezone)}`}
                    </p>
                  </div>
                  <Badge className={st.tone}>{st.label}</Badge>
                  {auto && e.notifiedAt && <span className="text-xs text-zinc-500">أُخطرت تلقائياً</span>}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
