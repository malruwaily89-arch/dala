import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatSar } from "@/lib/utils";
import { publicBookingAction } from "@/app/actions/appointments";

export default async function PublicBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;

  const tenant = await db.tenant.findUnique({ where: { slug } });
  if (!tenant) notFound();

  const [services, staff] = await Promise.all([
    db.service.findMany({ where: { tenantId: tenant.id, isActive: true } }),
    db.staff.findMany({ where: { tenantId: tenant.id, isActive: true } }),
  ]);

  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <main className="flex-1 bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <header className="text-center">
          <h1 className="text-3xl font-extrabold text-brand">{tenant.name}</h1>
          <p className="mt-2 text-sm text-zinc-500">احجزي موعدك في دقيقة — والدفع لاحقاً في الصالون.</p>
        </header>

        {error && (
          <p className="mt-6 rounded-lg bg-rose-50 px-3 py-2 text-center text-sm text-rose-700">{error}</p>
        )}

        {services.length === 0 || staff.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
            الصالون يقوم بتحديث الخدمات حالياً — عودين قريباً.
          </div>
        ) : (
          <BookingForm
            slug={slug}
            services={services}
            staff={staff}
            days={days}
            tenantId={tenant.id}
          />
        )
        }
      </div>
    </main>
  );
}

import { PublicBookingSlots } from "./slots";

function BookingForm({
  slug,
  services,
  staff,
  days,
  tenantId,
}: {
  slug: string;
  services: { id: string; name: string; durationMinutes: number; price: number; depositAmount: number }[];
  staff: { id: string; name: string }[];
  days: Date[];
  tenantId: string;
}) {
  return (
    <form action={publicBookingAction} className="mt-8 space-y-6">
      <input type="hidden" name="slug" value={slug} />

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold">1. اختاري الخدمة</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {services.map((s, i) => (
            <label
              key={s.id}
              className="flex cursor-pointer items-start gap-2 rounded-xl border border-zinc-200 p-4 transition has-checked:border-brand has-checked:bg-pink-50"
            >
              <input
                type="radio"
                name="serviceId"
                value={s.id}
                defaultChecked={i === 0}
                className="mt-1 accent-pink-700"
                required
              />
              <span>
                <span className="block font-bold">{s.name}</span>
                <span className="block text-xs text-zinc-500">
                  {s.durationMinutes} دقيقة · {formatSar(s.price)}
                  {s.depositAmount > 0 && (
                    <span className="text-amber-700"> · عربون {formatSar(s.depositAmount)}</span>
                  )}
                </span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold">2. اختاري الموظفة</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {staff.map((st, i) => (
            <label
              key={st.id}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 p-4 transition has-checked:border-brand has-checked:bg-pink-50"
            >
              <input
                type="radio"
                name="staffId"
                value={st.id}
                defaultChecked={i === 0}
                className="accent-pink-700"
                required
              />
              <span className="font-bold">{st.name}</span>
            </label>
          ))}
        </div>
      </section>

      <PublicBookingSlots tenantId={tenantId} days={days} />

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold">4. بياناتك</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block flex-1">
            <span className="mb-1 block text-sm font-semibold">الاسم</span>
            <input
              name="name"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </label>
          <label className="block flex-1">
            <span className="mb-1 block text-sm font-semibold">رقم الجوال</span>
            <input
              name="phone"
              type="tel"
              dir="ltr"
              required
              placeholder="05xxxxxxxx"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </label>
        </div>
      </section>

      <button
        type="submit"
        className="w-full rounded-full bg-brand py-4 text-lg font-bold text-white shadow-lg shadow-pink-900/20 transition hover:opacity-90"
      >
        تأكيد الحجز
      </button>
    </form>
  );
}
