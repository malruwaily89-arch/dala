import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatSar } from "@/lib/utils";
import { createServiceAction, toggleServiceAction } from "@/app/actions/appointments";
import { EmptyState, Banner } from "../ui";

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;

  const services = await db.service.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { isActive: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-extrabold">الخدمات</h1>
      <p className="mt-1 text-sm text-zinc-500">
        حددي مدة كل خدمة بدقة — حماية جدولك تعتمد عليها، والعربون يمنع التأجيل.
      </p>

      {error && <Banner>{error}</Banner>}

      <details className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer font-bold text-brand">+ خدمة جديدة</summary>
        <form action={createServiceAction} className="mt-4 flex flex-wrap items-end gap-3">
          <Field name="name" label="اسم الخدمة" type="text" />
          <Field name="durationMinutes" label="المدة (دقيقة)" type="number" />
          <Field name="price" label="السعر (ر.س)" type="number" />
          <Field name="depositAmount" label="العربون (ر.س)" type="number" />
          <button className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:opacity-90">
            حفظ
          </button>
        </form>
      </details>

      {services.length === 0 ? (
        <EmptyState text="أضيفي أول خدمة لتبدأ الحجوزات." />
      ) : (
        <ul className="mt-4 space-y-3">
          {services.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="min-w-44 flex-1">
                <p className="font-bold">{s.name}</p>
                <p className="text-sm text-zinc-600">
                  {s.durationMinutes} دقيقة · السعر {formatSar(s.price)} · العربون{" "}
                  {formatSar(s.depositAmount)}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {s.isActive ? "مفعلة" : "موقوفة"}
              </span>
              <form action={toggleServiceAction}>
                <input type="hidden" name="id" value={s.id} />
                <button className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50">
                  {s.isActive ? "إيقاف" : "تفعيل"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({ name, label, type }: { name: string; label: string; type: string }) {
  return (
    <label className="block flex-1">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      <input
        name={name}
        type={type}
        required
        min={type === "number" ? 0 : undefined}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
      />
    </label>
  );
}
