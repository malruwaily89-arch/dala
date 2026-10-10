import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireDashboardUser, canUse } from "@/lib/guard";
import { formatLocalDate } from "@/lib/time";
import { displayPhone } from "@/lib/phone";
import { formatSar, sarFromHalalas } from "@/lib/money";
import { updateHealthNotesAction, sellSessionPackAction } from "@/app/actions/salon-extras";
import { Badge, Banner, Card, EmptyState, PageHeader, Stat, btnGhost, btnPrimary, inputCls, selectCls } from "@/components/ui";

export const metadata: Metadata = { title: "العميلات" };

const AVATAR_TONES = ["bg-rose-100 text-rose-800", "bg-amber-100 text-amber-800", "bg-emerald-100 text-emerald-800", "bg-sky-100 text-sky-800", "bg-violet-100 text-violet-800"];

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("");
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string; error?: string }>;
}) {
  const { user, salon, ctx } = await requireDashboardUser();
  if (!canUse(user, ctx, "customers.manage")) return <EmptyState>لا تملكين صلاحية عرض العميلات.</EmptyState>;

  const { q: rawQ, ok, error } = await searchParams;
  const q = (rawQ ?? "").trim().slice(0, 60);
  const digits = q.replace(/\D/g, "");
  // الرقم يُبحث عنه بدون الصفر أو رمز الدولة لأن التخزين بصيغة 9665...
  const phoneTerm = digits.length >= 3 ? (digits.startsWith("966") ? digits.slice(3) : digits.replace(/^0/, "")) : "";

  const or: Prisma.CustomerWhereInput[] = [];
  if (q && !digits) or.push({ name: { contains: q, mode: "insensitive" } });
  if (phoneTerm) or.push({ phone: { contains: phoneTerm } });

  const now = new Date();
  const [customers, services] = await Promise.all([
    db.customer.findMany({
      where: { salonId: salon.id, phone: { not: "internal" }, ...(or.length ? { OR: or } : {}) },
      include: {
        appointments: { select: { status: true, startsAt: true, priceHalalas: true } },
        sessionPacks: { include: { service: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
      },
      orderBy: { name: "asc" },
      take: 300,
    }),
    db.service.findMany({ where: { salonId: salon.id, isActive: true, kind: "STANDARD" }, orderBy: { name: "asc" } }),
  ]);

  const rows = customers
    .map((c) => {
      const completed = c.appointments.filter((a) => a.status === "COMPLETED");
      const upcoming = c.appointments.filter((a) => a.status === "CONFIRMED" && a.startsAt > now).length;
      const last = [...c.appointments].sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())[0];
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        healthNotes: c.healthNotes,
        visits: completed.length,
        spent: completed.reduce((sum, a) => sum + a.priceHalalas, 0),
        upcoming,
        noShows: c.noShowCount,
        lastAt: last?.startsAt ?? null,
        packs: c.sessionPacks.map((p) => ({
          id: p.id,
          service: p.service.name,
          total: p.totalSessions,
          used: p.usedSessions,
          paidSar: sarFromHalalas(p.priceHalalas),
        })),
      };
    })
    .sort((a, b) => (b.lastAt?.getTime() ?? 0) - (a.lastAt?.getTime() ?? 0));

  const totalSpent = rows.reduce((sum, r) => sum + r.spent, 0);
  const returning = rows.filter((r) => r.visits > 1).length;
  const withNotes = rows.filter((r) => r.healthNotes).length;
  const canEdit = canUse(user, ctx, "customers.manage");

  return (
    <div>
      <PageHeader title="العميلات" subtitle="ابحثي بالاسم أو رقم الجوال، وتابعي سجل كل عميلة وباقاتها." />
      {ok === "notes" && <Banner tone="success">تم حفظ الملاحظات.</Banner>}
      {ok === "pack" && <Banner tone="success">تم بيع الباقة وتسجيلها للعميلة.</Banner>}
      {error && <Banner>{error}</Banner>}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="عدد العميلات" value={String(rows.length)} tone="brand" />
        <Stat label="عميلات متكررات" value={String(returning)} tone="emerald" />
        <Stat label="لديهن ملاحظات صحية" value={String(withNotes)} tone={withNotes > 0 ? "rose" : "brand"} />
        <Stat label="إجمالي الإيراد من هذه القائمة" value={formatSar(totalSpent)} tone="gold" />
      </div>

      <form className="mb-6 flex flex-wrap items-center gap-3">
        <input
          name="q"
          aria-label="بحث في العميلات"
          defaultValue={q}
          placeholder="ابحثي بالاسم أو رقم الجوال (مثل 0512)"
          className={`${inputCls} max-w-md`}
        />
        <button className={btnPrimary}>بحث</button>
        {q && (
          <Link href="/dashboard/customers" className={`${btnGhost} px-4 py-2 text-xs`}>
            مسح البحث
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <EmptyState>{q ? `لا نتائج لـ "${q}".` : "لا عميلات بعد. تُضاف العميلة تلقائياً عند أول حجز."}</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r, i) => (
            <Card key={r.id} className="flex flex-col transition hover:shadow-md">
              <div className="flex items-start gap-4">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold ${AVATAR_TONES[i % AVATAR_TONES.length]}`}>
                  {initials(r.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{r.name}</p>
                  <p dir="ltr" className="text-xs text-zinc-500">{displayPhone(r.phone)}</p>
                </div>
                {r.noShows > 0 && <Badge className="bg-rose-100 text-rose-800">{r.noShows} غياب</Badge>}
              </div>

              {r.healthNotes && (
                <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                  ⚠️ {r.healthNotes}
                </p>
              )}

              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-emerald-50 p-2">
                  <dt className="text-[11px] text-emerald-700">زيارات</dt>
                  <dd className="font-bold text-emerald-900">{r.visits}</dd>
                </div>
                <div className="rounded-xl bg-sky-50 p-2">
                  <dt className="text-[11px] text-sky-700">قادمة</dt>
                  <dd className="font-bold text-sky-900">{r.upcoming}</dd>
                </div>
                <div className="rounded-xl bg-gold-soft p-2">
                  <dt className="text-[11px] text-brand-deep">الإنفاق</dt>
                  <dd className="text-sm font-bold text-brand-deep">{formatSar(r.spent)}</dd>
                </div>
              </dl>

              {r.packs.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {r.packs.map((p) => {
                    const left = p.total - p.used;
                    return (
                      <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl border border-gold/30 bg-white p-2.5 text-xs">
                        <span className="font-bold text-ink">{p.service}</span>
                        <Badge className={left > 0 ? "bg-gold-soft text-brand-deep" : "bg-zinc-200 text-zinc-600"}>
                          {left > 0 ? `متبقي ${left} من ${p.total}` : "مكتملة"}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              )}

              <p className="mt-3 text-xs text-zinc-500">
                {r.lastAt ? `آخر موعد: ${formatLocalDate(r.lastAt, salon.timezone)}` : "لا مواعيد بعد"}
              </p>

              {canEdit && (
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <details className="group w-full">
                    <summary className={`${btnGhost} w-full cursor-pointer list-none text-xs`}>ملاحظات صحية</summary>
                    <form action={updateHealthNotesAction} className="mt-3 space-y-2">
                      <input type="hidden" name="customerId" value={r.id} />
                      <textarea name="healthNotes" rows={2} defaultValue={r.healthNotes ?? ""} placeholder="مثال: حساسية من الأكريليك" className={inputCls} />
                      <button className={`${btnPrimary} w-full text-xs`}>حفظ الملاحظات</button>
                    </form>
                  </details>
                  {services.length > 0 && (
                    <details className="group w-full">
                      <summary className={`${btnGhost} w-full cursor-pointer list-none text-xs`}>بيع باقة جلسات</summary>
                      <form action={sellSessionPackAction} className="mt-3 grid gap-2">
                        <input type="hidden" name="customerId" value={r.id} />
                        <select name="serviceId" required className={selectCls}>
                          {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                          <input name="totalSessions" type="number" min={2} max={50} defaultValue={5} required className={inputCls} aria-label="عدد الجلسات" />
                          <input name="priceSar" type="number" min={0} step="0.01" required placeholder="السعر ر.س" className={inputCls} aria-label="السعر" />
                        </div>
                        <button className={`${btnPrimary} w-full text-xs`}>تسجيل الباقة</button>
                      </form>
                    </details>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
