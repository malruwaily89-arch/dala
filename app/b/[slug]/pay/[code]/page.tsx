import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatSar, formatDateTime, APPT_STATUS } from "@/lib/utils";

export default async function PayPage({
  params,
}: {
  params: Promise<{ slug: string; code: string }>;
}) {
  const { slug, code } = await params;

  const appt = await db.appointment.findUnique({
    where: { bookingCode: code },
    include: { customer: true, service: true, staff: true, tenant: true },
  });
  if (!appt || appt.tenant.slug !== slug) notFound();

  const tenant = appt.tenant;
  const status = APPT_STATUS[appt.status] ?? { label: appt.status, color: "bg-zinc-100" };
  const confirmed = appt.status === "confirmed";

  return (
    <main
      dir="rtl"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-rose-50 via-pink-50 to-white px-6 py-12"
      style={{ ["--brand"]: tenant.brandColor } as React.CSSProperties}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 right-1/3 h-64 w-64 rounded-full bg-pink-200/50 blur-3xl" />
        <div className="absolute -bottom-16 left-1/4 h-56 w-56 rounded-full bg-rose-200/40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* هوية الصالون */}
        <header className="mb-6 flex flex-col items-center text-center">
          <div className="rounded-[24px] border-2 border-white bg-white p-1.5 shadow-lg shadow-pink-200/60">
            {tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logoUrl} alt={tenant.name} className="h-14 w-14 rounded-[18px] object-cover" />
            ) : (
              <div
                className="flex h-14 w-14 items-center justify-center rounded-[18px] text-xl font-extrabold text-white"
                style={{ backgroundColor: tenant.brandColor }}
              >
                {tenant.name.replace(/^(صالون|مركز)\s*/, "").charAt(0)}
              </div>
            )}
          </div>
          <p className="mt-3 text-sm font-bold text-zinc-700">{tenant.name}</p>
        </header>

        <div className="rounded-[36px] border border-pink-100 bg-white/90 p-9 text-center shadow-xl shadow-pink-100/60 backdrop-blur">
          <p className="text-4xl">{confirmed ? "✅" : "⏳"}</p>
          <h1 className="mt-4 text-2xl font-extrabold text-zinc-800">
            {confirmed ? "حجزك مؤكد!" : "أكملي دفع العربون لتثبيت حجزك"}
          </h1>
          <span className={`mt-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold ${status.color}`}>
            {status.label}
          </span>

          <dl className="mt-7 space-y-3.5 rounded-[28px] bg-pink-50/70 p-6 text-start text-sm">
            <Row k="رقم الحجز" v={appt.bookingCode} mono />
            <Row k="الخدمة" v={`${appt.service.name} (${appt.service.durationMinutes} دقيقة)`} />
            <Row k="الموظفة" v={appt.staff.name} />
            <Row k="الوقت" v={formatDateTime(appt.startsAt)} />
            <Row k="سعر الخدمة" v={formatSar(appt.service.price)} />
            {appt.depositAmount > 0 && <Row k="العربون المطلوب" v={formatSar(appt.depositAmount)} strong />}
          </dl>

          {!confirmed && (
            <div className="mt-8 space-y-5">
              <div className="rounded-[24px] border-2 border-zinc-200 bg-zinc-50 p-5 text-center">
                <p className="text-lg font-extrabold text-zinc-700">الدفع معطّل في النسخة التجريبية</p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  هذه نسخة تجريبية بدون دفع حقيقي. سيتواصل معك {tenant.name} لتأكيد حجزك.
                </p>
              </div>
            </div>
          )}

          {confirmed && (
            <>
              <p className="mt-8 text-sm leading-6 text-zinc-600">
                ستصلك رسالة تذكير قبل موعدك.
                <br />
                نراك قريباً في {tenant.name} 🌸
              </p>
              <a
                href={`/b/${slug}/booking/${code}`}
                className="mt-5 inline-block text-sm font-bold underline"
                style={{ color: "var(--brand)" }}
              >
                عرض تفاصيل الحجز أو تعديل الموعد
              </a>
            </>
          )}
        </div>

        <footer className="mt-8 text-center text-xs text-zinc-400">
          مدعوم بـ <span className="font-bold text-zinc-500">دلال</span>
        </footer>
      </div>
    </main>
  );
}

function Row({
  k,
  v,
  mono = false,
  strong = false,
}: {
  k: string;
  v: string;
  mono?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-zinc-500">{k}</dt>
      <dd
        className={`${mono ? "font-mono" : ""} ${
          strong ? "text-base font-extrabold" : "font-bold"
        }`}
        style={strong ? { color: "var(--brand)" } : undefined}
      >
        {v}
      </dd>
    </div>
  );
}
