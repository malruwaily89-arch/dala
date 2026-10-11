import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireDashboardUser, canUse } from "@/lib/guard";
import { hasFeature } from "@/lib/plans";
import { formatLocalDate } from "@/lib/time";
import { addWaitlistAction } from "@/app/actions/appointments";
import { Badge, Banner, Card, EmptyState, Field, PageHeader, PhoneField, Stat, btnPrimary, selectCls } from "@/components/ui";
import { UpgradeCard } from "@/components/dashboard/upgrade";

export const metadata: Metadata = { title: "قائمة الانتظار" };

const WAIT_STATUS: Record<string, { label: string; tone: string; edge: string }> = {
  WAITING: { label: "بانتظار موعد", tone: "bg-amber-100 text-amber-800", edge: "border-s-amber-500" },
  NOTIFIED: { label: "أُخطرت", tone: "bg-sky-100 text-sky-800", edge: "border-s-sky-500" },
  BOOKED: { label: "حجزت", tone: "bg-emerald-100 text-emerald-800", edge: "border-s-emerald-500" },
  REMOVED: { label: "أُزيلت", tone: "bg-zinc-100 text-zinc-600", edge: "border-s-zinc-300" },
};

const DAY_MS = 86_400_000;

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
    db.service.findMany({ where: { salonId: salon.id, isActive: true, kind: "STANDARD" }, orderBy: { name: "asc" } }),
  ]);

  const count = (status: string) => entries.filter((e) => e.status === status).length;
  const now = new Date();

  return (
    <div>
      <PageHeader
        title="قائمة الانتظار"
        subtitle={auto ? "إشعار تلقائي للعميلة الأولى عند تحرّر موعد في خدمتها." : "أضيفي العميلات يدوياً، وتواصلي معهن عند تحرّر موعد."}
      />
      {error && <Banner>{error}</Banner>}
      {ok === "added" && <Banner tone="success">أُضيفت العميلة إلى قائمة الانتظار.</Banner>}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="بانتظار موعد" value={String(count("WAITING"))} tone="amber" />
        <Stat label="أُخطرت" value={String(count("NOTIFIED"))} tone="sky" note={auto ? "إشعار تلقائي" : undefined} />
        <Stat label="حجزت من القائمة" value={String(count("BOOKED"))} tone="emerald" />
        <Stat label="إجمالي السجل" value={String(entries.length)} tone="brand" />
      </div>

      <Card className="mb-8 border-gold/40 bg-gold-soft/40">
        <h2 className="mb-4 font-bold text-brand">إضافة عميلة</h2>
        <form action={addWaitlistAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Field label="الاسم" name="customerName" required />
          <PhoneField name="customerPhone" label="الجوال" />
          <Field label="الخدمة">
            <select name="serviceId" required className={selectCls}>
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
                <Card className={`flex flex-wrap items-center gap-4 border-s-4 ${st.edge}`}>
                  <div className="min-w-48 flex-1">
                    <p className="font-bold">
                      {e.customer.name}{" "}
                      <a dir="ltr" href={`tel:+${e.customer.phone}`} className="text-xs font-semibold text-brand underline-offset-4 hover:underline">
                        {e.customer.phone}
                      </a>
                    </p>
                    <p className="text-sm text-zinc-600">
                      {e.service.name}
                      {e.preferredFrom && ` · مفضّل من ${formatLocalDate(e.preferredFrom, salon.timezone)}`}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">منذ {Math.max(0, Math.floor((now.getTime() - e.createdAt.getTime()) / DAY_MS))} يوم</p>
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
