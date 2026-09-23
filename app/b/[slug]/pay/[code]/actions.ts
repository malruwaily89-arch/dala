"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { notifyWhatsApp } from "@/lib/whatsapp";

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
