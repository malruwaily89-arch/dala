"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { rescheduleAppointmentTx } from "@/lib/scheduling";
import { notifyWhatsApp } from "@/lib/whatsapp";
import { formatDateTime } from "@/lib/utils";

const MIN_HOURS_BEFORE_RESCHEDULE = 24;

/** تعديل موعد الحجز إلى وقت جديد — يشترط تبقّي أكثر من 24 ساعة على الموعد الحالي */
export async function rescheduleAppointmentAction(formData: FormData) {
  const slug = String(formData.get("slug"));
  const code = String(formData.get("code"));
  const slotIso = String(formData.get("slotIso"));

  if (!slug || !code || !slotIso) {
    redirect(`/b/${slug}/booking/${code}?error=missing`);
  }

  const appt = await db.appointment.findUnique({
    where: { bookingCode: code },
    include: { customer: true, service: true, tenant: true },
  });
  if (!appt || appt.tenant.slug !== slug) redirect(`/b/${slug}`);

  const hoursLeft = (appt.startsAt.getTime() - Date.now()) / 3_600_000;
  if (appt.status !== "confirmed" || hoursLeft <= MIN_HOURS_BEFORE_RESCHEDULE) {
    redirect(`/b/${slug}/booking/${code}?error=${encodeURIComponent("لا يمكن تعديل الموعد الآن")}`);
  }

  try {
    const updated = await rescheduleAppointmentTx({
      appointmentId: appt.id,
      tenantId: appt.tenantId,
      newStartsAt: new Date(slotIso),
    });
    await notifyWhatsApp({
      tenantId: appt.tenantId,
      appointmentId: appt.id,
      to: appt.customer.phone,
      body: `تم تعديل موعد حجزك ${appt.bookingCode} إلى: ${formatDateTime(updated.startsAt)} 🌸`,
    });
  } catch (e) {
    redirect(`/b/${slug}/booking/${code}?error=${encodeURIComponent(e instanceof Error ? e.message : "خطأ")}`);
  }

  revalidatePath(`/b/${slug}/booking/${code}`);
  revalidatePath("/dashboard/appointments");
  redirect(`/b/${slug}/booking/${code}?ok=reschedule`);
}

/** إرسال تقييم الزبونة بعد إتمام الخدمة */
export async function submitRatingAction(formData: FormData) {
  const slug = String(formData.get("slug"));
  const code = String(formData.get("code"));
  const score = Number(formData.get("score"));
  const comment = String(formData.get("comment") || "").trim() || null;

  if (!slug || !code || !score || score < 1 || score > 5) {
    redirect(`/b/${slug}/booking/${code}?error=${encodeURIComponent("يرجى اختيار تقييم صحيح")}`);
  }

  const appt = await db.appointment.findUnique({
    where: { bookingCode: code },
    include: { tenant: true },
  });
  if (!appt || appt.tenant.slug !== slug) redirect(`/b/${slug}`);
  if (appt.status !== "done") {
    redirect(`/b/${slug}/booking/${code}?error=${encodeURIComponent("لا يمكن التقييم قبل إتمام الخدمة")}`);
  }

  const existing = await db.rating.findUnique({ where: { appointmentId: appt.id } });
  if (!existing) {
    await db.rating.create({
      data: {
        appointmentId: appt.id,
        tenantId: appt.tenantId,
        customerId: appt.customerId,
        score,
        comment,
      },
    });
  }

  revalidatePath(`/b/${slug}/booking/${code}`);
  redirect(`/b/${slug}/booking/${code}?ok=rated`);
}

/**
 * إرسال طلب تقييم عبر واتساب — تُستدعى عند تحويل الحجز إلى "مكتمل" من لوحة التحكم
 * (اختياري — يعمل فقط عند تفعيل واتساب، وإلا يبقى في وضع المحاكاة).
 */
export async function sendRatingRequestWhatsApp(appointmentId: string) {
  const appt = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { customer: true, tenant: true },
  });
  if (!appt) return;

  await notifyWhatsApp({
    tenantId: appt.tenantId,
    appointmentId: appt.id,
    to: appt.customer.phone,
    body: `نتمنى أن نالت الخدمة إعجابك 🌸 شاركينا رأيك:\n/b/${appt.tenant.slug}/booking/${appt.bookingCode}`,
  });
}
