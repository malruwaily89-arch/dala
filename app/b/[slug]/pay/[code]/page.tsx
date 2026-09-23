import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatSar, formatDateTime, APPT_STATUS } from "@/lib/utils";
import { simulatePaymentAction } from "./actions";

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

  const status = APPT_STATUS[appt.status] ?? { label: appt.status, color: "bg-zinc-100" };

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <p className="text-3xl">{appt.status === "confirmed" ? "✅" : "⏳"}</p>
          <h1 className="mt-3 text-2xl font-extrabold">
            {appt.status === "confirmed"
              ? "حجزك مؤكد!"
              : "أكملي دفع العربون لتثبيت حجزك"}
          </h1>
          <span className={`mt-3 inline-block rounded-full px-4 py-1.5 text-xs font-bold ${status.color}`}>
            {status.label}
          </span>

          <dl className="mt-6 space-y-3 rounded-xl bg-zinc-50 p-5 text-start text-sm">
            <Row k="رقم الحجز" v={appt.bookingCode} mono />
            <Row k="الخدمة" v={`${appt.service.name} (${appt.service.durationMinutes} دقيقة)`} />
            <Row k="الموظفة" v={appt.staff.name} />
            <Row k="الوقت" v={formatDateTime(appt.startsAt)} />
            <Row k="سعر الخدمة" v={formatSar(appt.service.price)} />
            {appt.depositAmount > 0 && (
              <Row k="العربون المطلوب" v={formatSar(appt.depositAmount)} strong />
            )}
          </dl>

          {appt.status === "pending_deposit" && (
            <div className="mt-6 space-y-4">
              {appt.tenant.bankIban && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-start text-sm">
                  <p className="font-bold text-amber-800">تحويل بنكي على:</p>
                  <p className="mt-1 text-zinc-700">{appt.tenant.bankName}</p>
                  <p dir="ltr" className="mt-1 font-mono text-sm text-zinc-700">
                    {appt.tenant.bankIban}
                  </p>
                </div>
              )}
              <form action={simulatePaymentAction}>
                <input type="hidden" name="code" value={appt.bookingCode} />
                <input type="hidden" name="slug" value={slug} />
                <button className="w-full rounded-full bg-brand py-4 font-bold text-white shadow-lg shadow-pink-900/20 transition hover:opacity-90">
                  الدفع الإلكتروني — {formatSar(appt.depositAmount)}
                </button>
              </form>
              <p className="text-xs text-zinc-400">
                لديك ساعتان لإتمام الدفع حتى يُتاح الموعد لغيرك.
              </p>
            </div>
          )}

          {appt.status === "confirmed" && (
            <p className="mt-6 text-sm text-zinc-600">
              ستصلك رسالة تذكير قبل موعدك. نراك قريباً في {appt.tenant.name} 🌸
            </p>
          )}
        </div>
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
          strong ? "text-base font-extrabold text-brand" : "font-bold"
        }`}
      >
        {v}
      </dd>
    </div>
  );
}
