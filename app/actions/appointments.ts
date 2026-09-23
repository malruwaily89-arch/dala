"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createAppointmentTx } from "@/lib/scheduling";
import { notifyWhatsApp } from "@/lib/whatsapp";
import { formatDateTime, formatSar } from "@/lib/utils";

/** تسجيل رسالة — يُرسل فعلياً عبر Meta Cloud API عند توفر المفاتيح، وإلا محاكاة */
async function logWhatsApp(tenantId: string, appointmentId: string | null, to: string, body: string) {
  await notifyWhatsApp({ tenantId, appointmentId, to, body });
}

/** تأكيد استلام العربون يدوياً (تحويل بنكي/STC Pay) */
export async function confirmDepositAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const appt = await db.appointment.findFirst({
    where: { id, tenantId: user.tenantId, status: "pending_deposit" },
    include: { customer: true, service: true },
  });
  if (!appt) return;
  await db.appointment.update({
    where: { id },
    data: { status: "confirmed", depositPaidAt: new Date(), paymentMethod: "manual_transfer" },
  });
  await logWhatsApp(
    appt.tenantId,
    appt.id,
    appt.customer.phone,
    `تم تأكيد حجزك ✅\nرقم الحجز: ${appt.bookingCode}\n${appt.service.name} — ${formatDateTime(appt.startsAt)}\nإلينا لقاءك!`
  );
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/appointments");
}

/** تعليم الموعد كمكتمل */
export async function completeAppointmentAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  await db.appointment.updateMany({
    where: { id, tenantId: user.tenantId, status: "confirmed" },
    data: { status: "done" },
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/appointments");
}

/** تعليم عدم الحضور (يرفع عداد العميل) */
export async function noShowAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const appt = await db.appointment.updateMany({
    where: { id, tenantId: user.tenantId, status: "confirmed" },
    data: { status: "no_show" },
  });
  if (appt.count > 0) {
    const updated = await db.appointment.findUnique({ where: { id }, select: { customerId: true } });
    if (updated) {
      await db.customer.update({
        where: { id: updated.customerId },
        data: { noShowCount: { increment: 1 } },
      });
    }
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/appointments");
}

/** إلغاء الموعد + إخطار قائمة الانتظار */
export async function cancelAppointmentAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const appt = await db.appointment.findFirst({
    where: { id, tenantId: user.tenantId, status: { in: ["pending_deposit", "confirmed"] } },
    include: { customer: true },
  });
  if (!appt) return;
  await db.appointment.update({ where: { id }, data: { status: "cancelled" } });
  await logWhatsApp(appt.tenantId, appt.id, appt.customer.phone, `تم إلغاء الحجز ${appt.bookingCode}. نعتذر عن الإزعاج.`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/appointments");
}

/** إنشاء موعد من لوحة التحكم */
export async function createAppointmentAdminAction(formData: FormData) {
  const user = await requireUser();
  const customerId = String(formData.get("customerId"));
  const staffId = String(formData.get("staffId"));
  const serviceId = String(formData.get("serviceId"));
  const dateStr = String(formData.get("date")); // yyyy-mm-dd
  const timeStr = String(formData.get("time")); // HH:mm

  if (!customerId || !staffId || !serviceId || !dateStr || !timeStr) {
    redirect("/dashboard/appointments?error=missing");
  }
  const startsAt = new Date(`${dateStr}T${timeStr}`);
  try {
    await createAppointmentTx({
      tenantId: user.tenantId,
      customerId,
      staffId,
      serviceId,
      startsAt,
      createdVia: "dashboard",
    });
  } catch (e) {
    redirect(`/dashboard/appointments?error=${encodeURIComponent(e instanceof Error ? e.message : "خطأ")}`);
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/appointments");
  redirect("/dashboard/appointments?ok=1");
}

/** إضافة عميلة سريعة */
export async function createCustomerAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (!name || !phone) redirect("/dashboard/customers?error=missing");
  await db.customer.upsert({
    where: { tenantId_phone: { tenantId: user.tenantId, phone } },
    update: { name },
    create: { tenantId: user.tenantId, name, phone },
  });
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/appointments");
}

/** إدارة الخدمات */
export async function createServiceAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") || "").trim();
  const durationMinutes = Number(formData.get("durationMinutes") || 60);
  const price = Number(formData.get("price") || 0);
  const depositAmount = Number(formData.get("depositAmount") || 0);
  if (!name) redirect("/dashboard/services?error=missing");
  await db.service.create({
    data: { tenantId: user.tenantId, name, durationMinutes, price, depositAmount },
  });
  revalidatePath("/dashboard/services");
}

export async function toggleServiceAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const service = await db.service.findFirst({ where: { id, tenantId: user.tenantId } });
  if (!service) return;
  await db.service.update({ where: { id }, data: { isActive: !service.isActive } });
  revalidatePath("/dashboard/services");
}

/** إدارة الموظفات */
export async function createStaffAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const start = String(formData.get("workStart") || "09:00");
  const end = String(formData.get("workEnd") || "21:00");
  if (!name) redirect("/dashboard/staff?error=missing");
  await db.staff.create({
    data: {
      tenantId: user.tenantId,
      name,
      phone,
      workingHours: JSON.stringify({ start, end, days: [0, 1, 2, 3, 4, 6] }),
    },
  });
  revalidatePath("/dashboard/staff");
}

export async function toggleStaffAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const staff = await db.staff.findFirst({ where: { id, tenantId: user.tenantId } });
  if (!staff) return;
  await db.staff.update({ where: { id }, data: { isActive: !staff.isActive } });
  revalidatePath("/dashboard/staff");
}

/** حجز عام من صفحة /b/{slug} */
export async function publicBookingAction(formData: FormData) {
  const slug = String(formData.get("slug"));
  const serviceId = String(formData.get("serviceId"));
  const staffId = String(formData.get("staffId"));
  const slotIso = String(formData.get("slotIso"));
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  if (!slug || !serviceId || !staffId || !slotIso || !name || !phone) {
    redirect(`/b/${slug}?error=missing`);
  }

  const tenant = await db.tenant.findUnique({ where: { slug } });
  if (!tenant) redirect("/");

  // عميلة موجود أو جديد
  const customer = await db.customer.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone } },
    update: { name },
    create: { tenantId: tenant.id, name, phone },
  });

  let appt;
  try {
    appt = await createAppointmentTx({
      tenantId: tenant.id,
      customerId: customer.id,
      staffId,
      serviceId,
      startsAt: new Date(slotIso),
      createdVia: "link",
    });
  } catch (e) {
    redirect(`/b/${slug}?error=${encodeURIComponent(e instanceof Error ? e.message : "خطأ")}`);
  }

  await logWhatsApp(
    tenant.id,
    appt.id,
    phone,
    appt.status === "pending_deposit"
      ? `حجزك تحت الرقم ${appt.bookingCode} بانتظار العربون (${formatSar(appt.depositAmount)}). أدفعي خلال ساعتين حتى لا يُلغى.\nرابط الدفع: /b/${slug}/pay/${appt.bookingCode}`
      : `تم تأكيد حجزك ✅ رقم الحجز: ${appt.bookingCode}`
  );

  revalidatePath("/dashboard");
  redirect(`/b/${slug}/pay/${appt.bookingCode}`);
}
