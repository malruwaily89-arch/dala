import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatSar } from "@/lib/utils";
import { publicBookingAction } from "@/app/actions/appointments";
import { PublicBookingSlots } from "./slots";

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
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-rose-50 via-pink-50 to-white"
      style={{ ["--brand"]: tenant.brandColor } as React.CSSProperties}
    >
      {/* زخارف ناعمة بالخلفية */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-pink-200/50 blur-3xl" />
        <div className="absolute top-1/2 -left-24 h-64 w-64 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="absolute -bottom-20 right-1/3 h-56 w-56 rounded-full bg-fuchsia-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl px-6 py-12">
        {/* هوية الصالون */}
        <header className="flex flex-col items-center text-center">
          <div className="rounded-[28px] border-2 border-white bg-white p-1.5 shadow-lg shadow-pink-200/60">
            {tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="h-20 w-20 rounded-[22px] object-cover"
              />
            ) : (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-[22px] text-3xl font-extrabold text-white"
                style={{ backgroundColor: tenant.brandColor }}
              >
                {tenant.name.replace(/^(صالون|مركز)\s*/, "").charAt(0)}
              </div>
            )}
          </div>
          <h1 className="mt-5 text-3xl font-extrabold text-brand">{tenant.name}</h1>
          <p className="mt-2 text-sm text-zinc-500">
            احجزي موعدك في دقيقة 🌸 والدفع لاحقاً في الصالون
          </p>
        </header>

        {error && (
          <p className="mt-8 rounded-2xl bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">
            {error}
          </p>
        )}

        {services.length === 0 || staff.length === 0 ? (
          <div className="mt-10 rounded-[32px] border border-dashed border-pink-200 bg-white/70 p-14 text-center text-sm text-zinc-500 backdrop-blur">
            الصالون يقوم بتحديث خدماته حالياً — عودين قريباً 🌸
          </div>
        ) : (
          <BookingForm slug={slug} services={services} staff={staff} days={days} tenantId={tenant.id} />
        )}

        <footer className="mt-16 pb-6 text-center text-xs text-zinc-400">
          مدعوم بـ <span className="font-bold text-zinc-500">دلال</span> — نظام حجوزات الصالونات
        </footer>
      </div>
    </main>
  );
}

function SectionTitle({ n, title }: { n: string; title: string }) {
  return (
    <h2 className="flex items-center gap-3 text-base font-extrabold text-zinc-800">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: "var(--brand)" }}
      >
        {n}
      </span>
      {title}
    </h2>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-[32px] border border-pink-100 bg-white/80 p-7 shadow-md shadow-pink-100/50 backdrop-blur-sm">
      {children}
    </section>
  );
}

function ServiceIcon({ name }: { name: string }) {
  const emoji = name.includes("شعر")
    ? "✂️"
    : name.includes("صبغة")
      ? "🎨"
      : name.includes("مانيكير") || name.includes("بديكير")
        ? "💅"
        : name.includes("بشرة")
          ? "✨"
          : name.includes("مكياج")
            ? "💄"
            : name.includes("عروس")
              ? "👰"
              : "🌸";
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl"
      style={{ backgroundColor: "color-mix(in srgb, var(--brand) 12%, white)" }}
    >
      {emoji}
    </span>
  );
}

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
    <form action={publicBookingAction} className="mt-10 space-y-7">
      <input type="hidden" name="slug" value={slug} />

      {/* 1. الخدمة */}
      <Section>
        <SectionTitle n="١" title="اختاري خدمتك" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {services.map((s, i) => (
            <label
              key={s.id}
              className="flex cursor-pointer items-center gap-3.5 rounded-[24px] border-2 border-pink-100 bg-white p-4 transition hover:border-pink-200 hover:shadow-sm has-checked:border-[var(--brand)] has-checked:shadow-sm"
            >
              <input
                type="radio"
                name="serviceId"
                value={s.id}
                defaultChecked={i === 0}
                required
                style={{ accentColor: "var(--brand)" }}
                className="peer sr-only"
              />
              <ServiceIcon name={s.name} />
              <span className="min-w-0">
                <span className="block text-sm font-extrabold text-zinc-800">{s.name}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">
                  {s.durationMinutes} دقيقة · {formatSar(s.price)}
                  {s.depositAmount > 0 && (
                    <span style={{ color: "var(--brand)" }}> · عربون {formatSar(s.depositAmount)}</span>
                  )}
                </span>
              </span>
            </label>
          ))}
        </div>
      </Section>

      {/* 2. الموظفة */}
      <Section>
        <SectionTitle n="٢" title="مع من تحبين جلسك" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {staff.map((st, i) => (
            <label
              key={st.id}
              className="flex cursor-pointer items-center gap-3.5 rounded-[24px] border-2 border-pink-100 bg-white p-4 transition hover:border-pink-200 has-checked:border-[var(--brand)]"
            >
              <input
                type="radio"
                name="staffId"
                value={st.id}
                defaultChecked={i === 0}
                required
                style={{ accentColor: "var(--brand)" }}
                className="sr-only"
              />
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-extrabold text-white"
                style={{ backgroundColor: "var(--brand)" }}
              >
                {st.name.charAt(0)}
              </span>
              <span className="text-sm font-extrabold text-zinc-800">{st.name}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* 3. اليوم والوقت */}
      <div className="rounded-[32px] border border-pink-100 bg-white/80 p-7 shadow-md shadow-pink-100/50 backdrop-blur-sm">
        <SectionTitle n="٣" title="اليوم والوقت المناسب" />
        <div className="mt-5">
          <PublicBookingSlots tenantId={tenantId} days={days} />
        </div>
      </div>

      {/* 4. البيانات */}
      <Section>
        <SectionTitle n="٤" title="بياناتك للتواصل" />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-zinc-700">اسمك الكريم</span>
            <input
              name="name"
              required
              placeholder="مثال: نوف"
              className="w-full rounded-[20px] border-2 border-pink-100 bg-white px-4 py-3.5 text-sm transition focus:border-[var(--brand)] focus:outline-none focus:ring-4"
              style={{ "--tw-ring-color": "color-mix(in srgb, var(--brand) 15%, transparent)" } as React.CSSProperties}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-zinc-700">رقم جوالك</span>
            <input
              name="phone"
              type="tel"
              dir="ltr"
              required
              placeholder="05xxxxxxxx"
              className="w-full rounded-[20px] border-2 border-pink-100 bg-white px-4 py-3.5 text-sm transition focus:border-[var(--brand)] focus:outline-none focus:ring-4"
              style={{ "--tw-ring-color": "color-mix(in srgb, var(--brand) 15%, transparent)" } as React.CSSProperties}
            />
          </label>
        </div>
      </Section>

      <button
        type="submit"
        className="w-full rounded-full py-4.5 text-lg font-extrabold text-white transition hover:opacity-90"
        style={{
          backgroundColor: "var(--brand)",
          boxShadow: "0 12px 30px -8px color-mix(in srgb, var(--brand) 45%, transparent)",
        }}
      >
        تأكيد الحجز 🌸
      </button>
    </form>
  );
}
