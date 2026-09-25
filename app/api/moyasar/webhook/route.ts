import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature, MOYASAR_DEMO_MODE, type MoyasarPayment } from "@/lib/moyasar";
import { notifyWhatsApp } from "@/lib/whatsapp";

/**
 * Webhook من Moyasar — إشعارات حالة الدفع (وضع الاختبار)
 *
 * إعداد الـ URL في لوحة Moyasar (Dashboard → Webhooks):
 *   URL: https://<نطاقك>/api/moyasar/webhook
 *   Secret: نفس قيمة MOYASAR_WEBHOOK_SECRET في .env
 *   الأحداث: payment_paid, payment_faild (تسمية Moyasar الرسمية لحدث الفشل)
 *
 * التوثيق: https://docs.moyasar.com/api/other/webhooks/webhook-reference
 */

interface MoyasarWebhookPayload {
  id: string;
  type: string; // payment_paid | payment_faild | payment_failed | ...
  created_at?: string;
  secret_token?: string;
  live?: boolean;
  data: MoyasarPayment;
}

export async function POST(request: NextRequest) {
  const ts = new Date().toISOString();

  // DEMO MODE: re-enable for production — اقبل أي طلب وأرجع 200 دائماً أثناء التجربة.
  // المنطق الأصلي (التحقق + المعالجة) محفوظ أدناه دون حذف ويعمل عند تعطيل وضع التجربة.
  if (MOYASAR_DEMO_MODE) {
    console.log(`[moyasar webhook] ${ts} DEMO MODE — accepting request, returning 200`);
    return NextResponse.json({ ok: true, demo: true }, { status: 200 });
  }

  let payload: MoyasarWebhookPayload;

  try {
    payload = (await request.json()) as MoyasarWebhookPayload;
  } catch {
    console.log(`[moyasar webhook] ${ts} تعذّر قراءة جسم الطلب`);
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  if (!verifyWebhookSignature(payload)) {
    console.log(`[moyasar webhook] ${ts} توقيع غير صالح — تم رفض الطلب`);
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  const payment = payload.data;
  console.log(
    `[moyasar webhook] ${ts} event=${payload.type} payment_id=${payment?.id} status=${payment?.status}`
  );

  try {
    if (payload.type === "payment_paid" || payment?.status === "paid") {
      await handlePaid(payment);
    } else if (
      payload.type === "payment_faild" ||
      payload.type === "payment_failed" ||
      payment?.status === "failed"
    ) {
      await handleFailed(payment);
    }
  } catch (e) {
    // Moyasar تعيد المحاولة عند أي استجابة غير 2xx — نسجّل الخطأ فقط دون فشل الاستجابة
    console.log(`[moyasar webhook] ${ts} خطأ في المعالجة:`, e instanceof Error ? e.message : e);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

async function handlePaid(payment: MoyasarPayment) {
  const existingPayment = await db.payment.findFirst({ where: { providerRef: payment.id } });
  if (existingPayment) {
    await db.payment.update({
      where: { id: existingPayment.id },
      data: { status: "paid", paidAt: existingPayment.paidAt ?? new Date() },
    });
  }

  const appt = await db.appointment.findFirst({
    where: { paymentRef: payment.id },
    include: { customer: true },
  });
  if (!appt || appt.depositPaidAt) return; // غير مرتبط بعربون، أو تم تأكيده مسبقاً (idempotent)

  const updated = await db.appointment.update({
    where: { id: appt.id },
    data: { status: "confirmed", depositPaidAt: new Date(), paymentMethod: "gateway" },
    include: { customer: true },
  });

  await notifyWhatsApp({
    tenantId: updated.tenantId,
    appointmentId: updated.id,
    to: updated.customer.phone,
    body: `تم تأكيد حجزك ✅ رقم الحجز: ${updated.bookingCode}`,
  });
}

async function handleFailed(payment: MoyasarPayment) {
  const existingPayment = await db.payment.findFirst({ where: { providerRef: payment.id } });
  if (existingPayment) {
    await db.payment.update({ where: { id: existingPayment.id }, data: { status: "failed" } });
  }
}
