"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

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

  await db.messageLog.create({
    data: {
      tenantId: appt.tenantId,
      appointmentId: appt.id,
      direction: "out",
      waMessageId: `sim_${Date.now()}`,
      templateName: "deposit_confirmed",
      payload: JSON.stringify({
        to: appt.customer.phone,
        body: `تم تأكيد حجزك ✅ رقم الحجز: ${appt.bookingCode}`,
      }),
      status: "sent",
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/b/${slug}/pay/${code}`);
}
