import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireDashboardUser, canUse } from "@/lib/guard";
import { formatSar } from "@/lib/money";
import { hasFeature } from "@/lib/plans";
import { createServiceAction, toggleServiceAction } from "@/app/actions/catalog";
import { Badge, Banner, Card, EmptyState, Field, PageHeader, btnGhost, btnPrimary } from "@/components/ui";
import { UpgradeCard } from "@/components/dashboard/upgrade";

export const metadata: Metadata = { title: "الخدمات" };

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { user, salon, ctx } = await requireDashboardUser();
  const { error, ok } = await searchParams;
  const canManage = canUse(user, ctx, "services.manage");
  const perService = hasFeature(ctx.entitlements, "cancellation.perService");
  const services = await db.service.findMany({ where: { salonId: salon.id }, orderBy: [{ isActive: "desc" }, { name: "asc" }] });

  return (
    <div>
      <PageHeader title="الخدمات" subtitle="مدة كل خدمة وسعرها وعربونها — العربون يحمي جدولك من الغياب." />
      {error && <Banner>{error}</Banner>}
      {ok === "created" && <Banner tone="success">تمت إضافة الخدمة.</Banner>}

      {canManage && (
        <Card className="mb-8">
          <h2 className="mb-4 font-bold text-ink">خدمة جديدة</h2>
          <form action={createServiceAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="اسم الخدمة" name="name" required />
            <Field label="المدة (دقيقة)" name="durationMinutes" type="number" required defaultValue={60} />
            <Field label="السعر (ر.س)" name="priceSar" type="number" required />
            <Field label="العربون (ر.س)" name="depositSar" type="number" required defaultValue={0} hint="0 يعني بدون عربون" />
            {perService ? (
              <Field label="مهلة الإلغاء المجاني (ساعات)" name="cancellationHours" type="number" hint="اتركيه فارغاً لاستخدام سياسة الصالون" />
            ) : (
              <div className="md:col-span-1">
                <UpgradeCard feature="cancellation.perService" />
              </div>
            )}
            <div className="flex items-end">
              <button className={`${btnPrimary} w-full`}>حفظ الخدمة</button>
            </div>
          </form>
        </Card>
      )}

      {services.length === 0 ? (
        <EmptyState>أضيفي أول خدمة لتبدأ الحجوزات.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {services.map((s) => (
            <li key={s.id}>
              <Card className="flex flex-wrap items-center gap-4">
                <div className="min-w-48 flex-1">
                  <p className="font-bold">{s.name}</p>
                  <p className="text-sm text-zinc-600">
                    {s.durationMinutes} دقيقة · السعر {formatSar(s.priceHalalas)} · العربون {formatSar(s.depositHalalas)}
                    {s.cancellationHours !== null && perService && ` · إلغاء مجاني قبل ${s.cancellationHours} ساعة`}
                  </p>
                </div>
                <Badge className={s.isActive ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"}>
                  {s.isActive ? "مفعّلة" : "موقوفة"}
                </Badge>
                {canManage && (
                  <form action={toggleServiceAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className={`${btnGhost} px-4 py-2 text-xs`}>{s.isActive ? "إيقاف" : "تفعيل"}</button>
                  </form>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
