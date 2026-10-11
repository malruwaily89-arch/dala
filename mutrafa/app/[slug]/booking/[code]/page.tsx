import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isBookingCode } from "@/lib/booking-code";
import { formatSar } from "@/lib/money";
import { formatLocalDateTime } from "@/lib/time";
import { APPOINTMENT_STATUS } from "@/lib/labels";
import { effectiveCancellationHours, isFreeCancellation } from "@/lib/cancellation";
import { loadSalonContext } from "@/lib/salon-context";
import { customerCancelAction, submitReviewAction } from "@/app/actions/public";
import { Banner, Badge, Card, btnPrimary, btnDanger, inputCls, selectCls } from "@/components/ui";

export const metadata: Metadata = { title: "حجزك" };

type Props = { params: Promise<{ slug: string; code: string }>; searchParams: Promise<{ ok?: string; error?: string; late?: string }> };

const OK_MESSAGES: Record<string, string> = {
  confirmed: "تم تأكيد حجزك 🌸 سنرسل لك التفاصيل والتذكير عبر واتساب.",
  deposit: "تم استلام العربون وتأكيد موعدك 🌸",
  cancelled: "تم إلغاء الحجز.",
  rated: "شكراً لتقييمك 🌸",
};

export default async function BookingStatusPage({ params, searchParams }: Props) {
  const { slug, code } = await params;
  const { ok, error, late } = await searchParams;
  if (!isBookingCode(code)) notFound();

  // الرقم فريد داخل الصالون فقط، لذا يُبحث عنه ضمن صالون الرابط
  const appt = await db.appointment.findFirst({
    where: { code, salon: { slug } },
    include: { salon: true, service: true, calendar: true, review: true },
  });
  if (!appt) notFound();

  const ctx = await loadSalonContext(appt.salonId);
  const hours = effectiveCancellationHours(appt.salon.cancellationHours, appt.service.cancellationHours, ctx.entitlements);
  const free = isFreeCancellation(appt.startsAt, new Date(), hours);
  const status = APPOINTMENT_STATUS[appt.status];
  const canCancel = appt.status === "CONFIRMED" || appt.status === "PENDING_DEPOSIT";

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      {ok && OK_MESSAGES[ok] && <Banner tone="success">{OK_MESSAGES[ok]}</Banner>}
      {ok === "cancelled" && late === "1" && (
        <Banner tone="info">تم الإلغاء بعد مهلة الإلغاء المجاني، وسيُحتفظ بالعربون وفق السياسة.</Banner>
      )}
      {error && <Banner>{error}</Banner>}

      <Card className="p-6 md:p-8">
        <p className="text-sm text-zinc-600">{appt.salon.name}</p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-brand">رقم الحجز {appt.code}</h1>
        <div className="mt-3"><Badge className={status.tone}>{status.label}</Badge></div>

        <dl className="mt-6 grid gap-3 text-sm">
          <Row label="الخدمة" value={appt.service.name} />
          <Row label="الموظفة" value={appt.calendar.name} />
          <Row label="الموعد" value={formatLocalDateTime(appt.startsAt, appt.salon.timezone)} />
          <Row label="السعر" value={formatSar(appt.priceHalalas)} />
          <Row label="العربون" value={formatSar(appt.depositHalalas)} />
        </dl>

        {appt.status === "PENDING_DEPOSIT" && (
          <form action={`/${slug}/pay/${appt.code}`} method="get" className="mt-6">
            <p className="mb-3 text-sm text-amber-800">
              حجزك بانتظار العربون{appt.holdUntil ? ` — يُحتفظ بالموعد حتى ${formatLocalDateTime(appt.holdUntil, appt.salon.timezone)}` : ""}.
            </p>
            <button className={`${btnPrimary} w-full`}>ادفعي العربون الآن</button>
          </form>
        )}

        {canCancel && (
          <form action={customerCancelAction} className="mt-8 border-t border-zinc-200 pt-6">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="code" value={appt.code} />
            <p className="mb-3 text-sm text-zinc-600">
              {free
                ? `يمكنك الإلغاء مجاناً حتى ${hours} ساعة قبل الموعد.`
                : `مهلة الإلغاء المجاني (${hours} ساعة) انتهت، والإلغاء الآن يعني احتفاظ الصالون بالعربون.`}
            </p>
            <button className={btnDanger}>إلغاء الحجز</button>
          </form>
        )}

        {appt.status === "COMPLETED" && !appt.review && (
          <form action={submitReviewAction} className="mt-8 space-y-3 border-t border-zinc-200 pt-6">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="code" value={appt.code} />
            <p className="font-bold text-ink">كيف كانت تجربتك؟</p>
            <select name="score" required defaultValue="5" className={selectCls}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)} ({n} من 5)</option>)}
            </select>
            <textarea name="comment" rows={3} maxLength={500} placeholder="ملاحظتك (اختياري)" className={inputCls} />
            <button className={btnPrimary}>إرسال التقييم</button>
          </form>
        )}
        {appt.review && <p className="mt-8 border-t border-zinc-200 pt-6 text-sm text-zinc-600">شكراً، تقييمك: {"★".repeat(appt.review.score)}</p>}
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}
