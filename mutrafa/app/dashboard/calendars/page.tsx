import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireDashboardUser, canUse } from "@/lib/guard";
import { hasFeature } from "@/lib/plans";
import { parseWorkingHours } from "@/lib/availability";
import { DAY_NAMES } from "@/lib/labels";
import { createCalendarAction, toggleCalendarAction } from "@/app/actions/catalog";
import { Badge, Banner, Card, EmptyState, Field, PageHeader, btnDanger, btnGhost, btnPrimary } from "@/components/ui";

export const metadata: Metadata = { title: "الموظفات" };

export default async function CalendarsPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { user, salon, ctx } = await requireDashboardUser();
  const { error, ok } = await searchParams;
  const canManage = canUse(user, ctx, "calendars.manage");
  const commission = hasFeature(ctx.entitlements, "commission");

  const [calendars, services] = await Promise.all([
    db.calendar.findMany({ where: { salonId: salon.id }, include: { services: true }, orderBy: [{ isActive: "desc" }, { name: "asc" }] }),
    db.service.findMany({ where: { salonId: salon.id, isActive: true, kind: "STANDARD" }, orderBy: { name: "asc" } }),
  ]);
  const atLimit = ctx.remaining.calendars <= 0;

  return (
    <div>
      <PageHeader
        title="الموظفات والتقويمات"
        subtitle={`${ctx.usage.calendars} من ${ctx.entitlements.calendars} تقويم نشط — ساعات كل موظفة تحدد المواعيد المتاحة.`}
      />
      {error && <Banner>{error}</Banner>}
      {ok === "created" && <Banner tone="success">تمت إضافة الموظفة.</Banner>}

      {canManage && (
        <Card className="mb-8">
          <h2 className="mb-4 font-bold text-ink">موظفة جديدة</h2>
          {atLimit ? (
            <p className="text-sm text-zinc-700">
              بلغتِ الحد الأقصى للتقويمات في باقتك ({ctx.entitlements.calendars}).{" "}
              <Link href="/dashboard/billing" className="font-bold text-brand underline">رقّي باقتك أو أضيفي تقويماً إضافياً</Link>.
            </p>
          ) : (
            <form action={createCalendarAction} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="اسم الموظفة" name="name" required />
                <Field label="الجوال (اختياري)" name="phone" type="tel" />
                {commission ? (
                  <Field label="نسبة العمولة %" name="commissionPercent" type="number" defaultValue={0} hint="0 يعني بدون عمولة" />
                ) : (
                  <div className="self-end text-xs text-zinc-500">العمولات متاحة من الذهبية.</div>
                )}
                <Field label="من" name="start" type="time" defaultValue="09:00" />
                <Field label="إلى" name="end" type="time" defaultValue="21:00" />
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-semibold">أيام العمل</legend>
                <div className="flex flex-wrap gap-2">
                  {DAY_NAMES.map((d, i) => (
                    <label key={d} className="flex cursor-pointer items-center gap-2 rounded-full border border-zinc-300 px-3 py-1.5 text-sm transition has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:font-bold has-[:checked]:text-brand">
                      <input type="checkbox" name="days" value={i} defaultChecked={i !== 5} className="accent-brand" />
                      {d}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-sm font-semibold">الخدمات التي تقدّمها</legend>
                <div className="flex flex-wrap gap-2">
                  {services.map((s) => (
                    <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-full border border-zinc-300 px-3 py-1.5 text-sm transition has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:font-bold has-[:checked]:text-brand">
                      <input type="checkbox" name="serviceIds" value={s.id} defaultChecked className="accent-brand" />
                      {s.name}
                    </label>
                  ))}
                </div>
              </fieldset>
              <button className={btnPrimary}>حفظ الموظفة</button>
            </form>
          )}
        </Card>
      )}

      {calendars.length === 0 ? (
        <EmptyState>أضيفي أول موظفة لتفعيل الحجوزات.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {calendars.map((c) => {
            const hours = parseWorkingHours(c.workingHours);
            return (
              <li key={c.id}>
                <Card className="flex flex-wrap items-center gap-4">
                  <div className="min-w-56 flex-1">
                    <Link href={`/dashboard/calendars/${c.id}`} className="font-bold text-brand hover:underline">{c.name}</Link>
                    <p className="text-sm text-zinc-600">
                      {hours.start} — {hours.end} · {hours.days.map((d) => DAY_NAMES[d]).join("، ")}
                      {commission && c.commissionBps > 0 && ` · عمولة ${c.commissionBps / 100}%`}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {c.services.length > 0 ? `${c.services.length} خدمة` : "لم تُربط بخدمات بعد"}
                    </p>
                  </div>
                  <Badge className={c.isActive ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"}>
                    {c.isActive ? "على رأس العمل" : "موقوفة"}
                  </Badge>
                  {canManage && (
                    <form action={toggleCalendarAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className={c.isActive ? btnDanger : `${btnGhost} px-4 py-2 text-xs`}>{c.isActive ? "إيقاف" : "تفعيل"}</button>
                    </form>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
