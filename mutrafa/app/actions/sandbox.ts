"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { markPaymentPaid } from "@/lib/payments";
import { sandboxPaymentsAllowed } from "@/lib/env";

/**
 * صفحة الدفع التجريبية (وضع sandbox) — تحاكي نتيجة بوابة الدفع.
 * لا تُحصّل أي مبلغ حقيقي. تمر عبر markPaymentPaid نفسها التي يستخدمها webhook الحقيقي.
 */
export async function sandboxResultAction(formData: FormData) {
  if (!sandboxPaymentsAllowed()) redirect("/");
  const providerRef = String(formData.get("ref") ?? "");
  const outcome = String(formData.get("outcome") ?? "");
  const method = String(formData.get("method") ?? "mada");

  const payment = await db.payment.findUnique({
    where: { providerRef },
    include: { appointment: { include: { salon: true } } },
  });
  if (!payment) redirect("/");

  const success = outcome === "paid";
  if (success) {
    await markPaymentPaid(providerRef, method);
  } else if (payment.status === "PENDING") {
    await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED", method } });
  }

  if (payment.appointment) {
    const { slug } = payment.appointment.salon;
    const code = payment.appointment.code;
    redirect(success ? `/${slug}/booking/${code}?ok=deposit` : `/${slug}/pay/${code}?error=payment_failed`);
  }
  redirect(success ? "/dashboard/billing?ok=paid" : "/dashboard/billing?error=payment_failed");
}
