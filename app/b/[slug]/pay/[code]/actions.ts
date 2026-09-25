"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { notifyWhatsApp } from "@/lib/whatsapp";
import { fetchPayment } from "@/lib/moyasar";

/** محاكاة بوابة الدفع — تُستبدل بـ Moyasar/Tap في الإنتاج */
export async function simulatePaymentAction(formData: FormData) {
  const code = String(formData.get("code"));
  const slug = String(formData.get("slug"));

  const appt = await db.appointment.findUnique({
    where: { bookingCode: code },
    include: { customer: true },
  });
  if (!appt || appt.status !== "pending_deposit") return;

  await db.appointment.update({
    where: { id: appt.id },
    data: {
      status: "confirmed",
      depositPaidAt: new Date(),
      paymentMethod: "gateway",
      paymentRef: `sim_pay_${Date.now()}`,
    },
  });

  await notifyWhatsApp({
    tenantId: appt.tenantId,
    appointmentId: appt.id,
    to: appt.customer.phone,
    body: `تم تأكيد حجزك ✅ رقم الحجز: ${appt.bookingCode}`,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/b/${slug}/pay/${code}`);
}

/**
 * تُستدعى من نموذج Moyasar (on_completed) فور إنشاء الدفعة في المتصفح.
 * تحفظ رقم عملية الدفع في Appointment.paymentRef قبل التحويل النهائي —
 * موصى بها من Moyasar للحماية من انقطاع الاتصال، وتُسهّل مطابقة الـ webhook.
 */
export async function savePaymentIdAction(code: string, paymentId: string) {
  const appt = await db.appointment.findUnique({ where: { bookingCode: code } });
  if (!appt || appt.depositPaidAt) return;

  await db.appointment.update({
    where: { id: appt.id },
    data: { paymentRef: paymentId, paymentMethod: "gateway" },
  });

  const existing = await db.payment.findFirst({ where: { providerRef: paymentId } });
  if (!existing) {
    await db.payment.create({
      data: {
        tenantId: appt.tenantId,
        amount: appt.depositAmount,
        currency: "SAR",
        status: "pending",
        provider: "moyasar",
        providerRef: paymentId,
      },
    });
  }
}

/**
 * تُستدعى من صفحة الدفع بعد إعادة توجيه Moyasar (?id=...) — تتحقق من حالة
 * الدفعة مباشرة من خادم Moyasar (لا نثق باستعلام الرابط وحده)، وتؤكد الحجز
 * عند النجاح. تعمل بشكل idempotent، وتُكمّل الـ webhook كخط دفاع ثانٍ.
 */
export async function reconcileMoyasarPaymentAction(code: string, paymentId: string) {
  const appt = await db.appointment.findUnique({
    where: { bookingCode: code },
    include: { customer: true },
  });
  if (!appt) return;

  let payment;
  try {
    payment = await fetchPayment(paymentId);
  } catch (e) {
    console.log(`[moyasar] فشل التحقق من الدفعة ${paymentId}:`, e instanceof Error ? e.message : e);
    return;
  }

  const paidNow = payment.status === "paid";
  const failedNow = payment.status === "failed";

  const existing = await db.payment.findFirst({ where: { providerRef: paymentId } });
  if (existing) {
    await db.payment.update({
      where: { id: existing.id },
      data: {
        status: paidNow ? "paid" : failedNow ? "failed" : existing.status,
        paidAt: paidNow ? existing.paidAt ?? new Date() : existing.paidAt,
      },
    });
  } else {
    await db.payment.create({
      data: {
        tenantId: appt.tenantId,
        amount: appt.depositAmount,
        currency: "SAR",
        status: paidNow ? "paid" : failedNow ? "failed" : "pending",
        provider: "moyasar",
        providerRef: paymentId,
        paidAt: paidNow ? new Date() : null,
      },
    });
  }

  if (paidNow && !appt.depositPaidAt) {
    await db.appointment.update({
      where: { id: appt.id },
      data: {
        status: "confirmed",
        depositPaidAt: new Date(),
        paymentMethod: "gateway",
        paymentRef: paymentId,
      },
    });

    await notifyWhatsApp({
      tenantId: appt.tenantId,
      appointmentId: appt.id,
      to: appt.customer.phone,
      body: `تم تأكيد حجزك ✅ رقم الحجز: ${appt.bookingCode}`,
    });

    revalidatePath("/dashboard");
  }
}
