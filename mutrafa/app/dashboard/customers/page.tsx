import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireDashboardUser, canUse } from "@/lib/guard";
import { formatLocalDate } from "@/lib/time";
import { displayPhone } from "@/lib/phone";
import { formatSar } from "@/lib/money";
import { Badge, Card, EmptyState, PageHeader, inputCls, btnPrimary } from "@/components/ui";

export const metadata: Metadata = { title: "العميلات" };

const AVATAR_TONES = ["bg-rose-100 text-rose-800", "bg-amber-100 text-amber-800", "bg-emerald-100 text-emerald-800", "bg-sky-100 text-sky-800", "bg-violet-100 text-violet-800"];

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("");
}

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { user, salon, ctx } = await requireDashboardUser();
  if (!canUse(user, ctx, "customers.manage")) return <EmptyState>لا تملكين صلاحية عرض العميلات.</EmptyState>;

  const { q: rawQ } = await searchParams;
  const q = (rawQ ?? "").trim().slice(0, 60);
  const digits = q.replace(/\D/g, "");
  // الرقم يُبحث عنه بدون الصفر أو رمز الدولة لأن التخزين بصيغة 9665...
  const phoneTerm = digits.length >= 3 ? (digits.startsWith("966") ? digits.slice(3) : digits.replace(/^0/, "")) : "";

  const or: Prisma.CustomerWhereInput[] = [];
  if (q && !digits) or.push({ name: { contains: q, mode: "insensitive" } });
  if (phoneTerm) or.push({ phone: { contains: phoneTerm } });

  const now = new Date();
  const customers = await db.customer.findMany({
    where: { salonId: salon.id, phone: { not: "internal" }, ...(or.length ? { OR: or } : {}) },
    include: { appointments: { select: { status: true, startsAt: true, priceHalalas: true } } },
    orderBy: { name: "asc" },
    take: 300,
  });

  const rows = customers
    .map((c) => {
      const completed = c.appointments.filter((a) => a.status === "COMPLETED");
      const upcoming = c.appointments.filter((a) => a.status === "CONFIRMED" && a.startsAt > now).length;
      const last = [...c.appointments].sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())[0];
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        visits: completed.length,
        spent: completed.reduce((sum, a) => sum + a.priceHalalas, 0),
        upcoming,
        noShows: c.noShowCount,
        lastAt: last?.startsAt ?? null,
      };
    })
    .sort((a, b) => (b.lastAt?.getTime() ?? 0) - (a.lastAt?.getTime() ?? 0));

  const totalSpent = rows.reduce((sum, r) => sum + r.spent, 0);
  const returning = rows.filter((r) => r.visits > 1).length;

  return (
    <div>
      <PageHeader title="العميلات" subtitle="ابحثي بالاسم أو رقم الجوال، وتابعي سجل كل عميلة." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm font-semibold text-zinc-600">عدد العميلات</p>
          <p className="mt-1 font-serif text-2xl font-bold">{rows.length}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-zinc-600">عميلات متكررات</p>
          <p className="mt-1 font-serif text-2xl font-bold text-emerald-700">{returning}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-zinc-600">إجمالي الإيراد من هذه القائمة</p>
          <p className="mt-1 font-serif text-2xl font-bold">{formatSar(totalSpent)}</p>
        </Card>
      </div>

      <form className="mb-6 flex flex-wrap items-center gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="ابحثي بالاسم أو رقم الجوال (مثل 0512)"
          className={`${inputCls} max-w-md`}
        />
        <button className={btnPrimary}>بحث</button>
        {q && (
          <Link href="/dashboard/customers" className="text-sm font-semibold text-brand underline">
            مسح البحث
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <EmptyState>{q ? `لا نتائج لـ "${q}".` : "لا عميلات بعد. تُضاف العميلة تلقائياً عند أول حجز."}</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r, i) => (
            <Card key={r.id} className="transition hover:shadow-md">
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

              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-zinc-50 p-2">
                  <dt className="text-[11px] text-zinc-500">زيارات</dt>
                  <dd className="font-bold">{r.visits}</dd>
                </div>
                <div className="rounded-xl bg-zinc-50 p-2">
                  <dt className="text-[11px] text-zinc-500">قادمة</dt>
                  <dd className="font-bold">{r.upcoming}</dd>
                </div>
                <div className="rounded-xl bg-zinc-50 p-2">
                  <dt className="text-[11px] text-zinc-500">الإنفاق</dt>
                  <dd className="text-sm font-bold">{formatSar(r.spent)}</dd>
                </div>
              </dl>

              <p className="mt-3 text-xs text-zinc-500">
                {r.lastAt ? `آخر موعد: ${formatLocalDate(r.lastAt, salon.timezone)}` : "لا مواعيد بعد"}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
