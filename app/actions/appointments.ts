"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createAppointmentTx, getAvailableSlots } from "@/lib/scheduling";
import { canCancelAppointments, canAddAppointments, canManageStaffSchedules, canManageServices } from "@/lib/permissions";
import { notifyWhatsApp } from "@/lib/whatsapp";
import { formatDateTime, formatSar, normalizeMoney, staffLimitForPlan } from "@/lib/utils";
import { sendRatingRequestWhatsApp } from "@/app/b/[slug]/booking/[code]/actions";

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
  const updated = await db.appointment.updateMany({
    where: { id, tenantId: user.tenantId, status: "confirmed" },
    data: { status: "done" },
  });
  if (updated.count > 0) {
    await sendRatingRequestWhatsApp(id);
  }
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
  if (!canCancelAppointments(user)) redirect("/dashboard/appointments?error=forbidden");
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

/** يجلب الأوقات المتاحة فعلياً (موظفة+خدمة+يوم) لقائمة الحجز اليدوي المنسدلة — نطاق البيانات مقيّد بمستأجر المستخدم الحالي */
export async function fetchAdminSlotsAction(params: { staffId: string; serviceId: string; dateIso: string }): Promise<string[]> {
  const user = await requireUser();
  const { staffId, serviceId, dateIso } = params;
  if (!staffId || !serviceId || !dateIso) return [];
  const slots = await getAvailableSlots({ tenantId: user.tenantId, staffId, serviceId, date: new Date(dateIso) });
  return slots.map((s) => s.toISOString());
}

/** إنشاء موعد من لوحة التحكم */
export async function createAppointmentAdminAction(formData: FormData) {
  const user = await requireUser();
  if (!canAddAppointments(user)) redirect("/dashboard/appointments?error=forbidden");
  const customerId = String(formData.get("customerId"));
  const staffId = String(formData.get("staffId"));
  const serviceId = String(formData.get("serviceId"));
  const slotIso = String(formData.get("slotIso") || "");

  if (!customerId || !staffId || !serviceId || !slotIso) {
    redirect("/dashboard/appointments?error=missing");
  }
  const startsAt = new Date(slotIso);
  if (!Number.isFinite(startsAt.getTime())) {
    redirect("/dashboard/appointments?error=invalid_time");
  }
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
  const requestedReturnTo = String(formData.get("returnTo") || "");
  const returnTo = requestedReturnTo.startsWith("/dashboard/") && !requestedReturnTo.startsWith("//") && !requestedReturnTo.includes("\\")
    ? requestedReturnTo
    : "/dashboard/customers";
  if (!name || !phone) redirect(`${returnTo}?error=missing`);

  const existing = await db.customer.findUnique({
    where: { tenantId_phone: { tenantId: user.tenantId, phone } },
  });
  if (existing) redirect(`${returnTo}?error=phone_exists`);

  await db.customer.create({ data: { tenantId: user.tenantId, name, phone } });
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/appointments");
  redirect(returnTo);
}

/** إدارة الخدمات */
export async function createServiceAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageServices(user)) redirect("/dashboard/services?error=forbidden");
  const name = String(formData.get("name") || "").trim();
  const durationMinutes = Number(formData.get("durationMinutes") || 60);
  const rawPrice = Number(formData.get("price") || 0);
  const rawDepositAmount = Number(formData.get("depositAmount") || 0);
  if (!name) redirect("/dashboard/services?error=missing");
  if (!Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 1_440) {
    redirect("/dashboard/services?error=invalid_duration");
  }
  let price: number;
  let depositAmount: number;
  try {
    price = normalizeMoney(rawPrice, "السعر");
    depositAmount = normalizeMoney(rawDepositAmount, "العربون");
  } catch {
    redirect("/dashboard/services?error=invalid_money");
  }
  if (depositAmount > price) redirect("/dashboard/services?error=deposit_too_high");
  await db.service.create({
    data: {
      tenantId: user.tenantId,
      name,
      durationMinutes,
      price: price.toFixed(2),
      depositAmount: depositAmount.toFixed(2),
    },
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

/** حذف خدمة نهائياً — يُرفض لو عندها مواعيد سابقة (نقترح الإيقاف بدلاً من الحذف حينها) */
export async function deleteServiceAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const service = await db.service.findFirst({ where: { id, tenantId: user.tenantId } });
  if (!service) redirect("/dashboard/services?error=1");

  const appointmentCount = await db.appointment.count({ where: { serviceId: id } });
  if (appointmentCount > 0) redirect("/dashboard/services?error=has_appointments");

  await db.service.delete({ where: { id } });
  revalidatePath("/dashboard/services");
  redirect("/dashboard/services?deleted=1");
}

/** إدارة الموظفات */
/** يقرأ أيام العمل المختارة (checkboxes باسم day) — الأحد=0 ... السبت=6. بدون اختيار = كل أيام الأسبوع */
function parseSelectedDays(formData: FormData): number[] {
  const values = formData.getAll("day").map((d) => Number(d)).filter((d) => d >= 0 && d <= 6 && !Number.isNaN(d));
  return values.length > 0 ? values.sort() : [0, 1, 2, 3, 4, 5, 6];
}

export async function createStaffAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageStaffSchedules(user)) redirect("/dashboard/staff?error=forbidden");
  const name = String(formData.get("name") || "").trim();
  const jobTitle = String(formData.get("jobTitle") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const start = String(formData.get("workStart") || "00:00");
  const end = String(formData.get("workEnd") || "23:59");
  const days = parseSelectedDays(formData);
  if (!name) redirect("/dashboard/staff?error=missing");
  const staffLimit = staffLimitForPlan(user.tenant.plan);
  if (staffLimit !== null) {
    const activeStaffCount = await db.staff.count({ where: { tenantId: user.tenantId, isActive: true } });
    if (activeStaffCount >= staffLimit) redirect("/dashboard/staff?error=staff_limit");
  }
  await db.staff.create({
    data: {
      tenantId: user.tenantId,
      name,
      jobTitle,
      phone,
      workingHours: JSON.stringify({ start, end, days }),
    },
  });
  revalidatePath("/dashboard/staff");
}

/** تعديل ساعات وأيام عمل موظفة موجودة */
export async function updateStaffScheduleAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageStaffSchedules(user)) redirect("/dashboard/staff?error=forbidden");
  const id = String(formData.get("id"));
  const jobTitle = String(formData.get("jobTitle") || "").trim() || null;
  const start = String(formData.get("workStart") || "00:00");
  const end = String(formData.get("workEnd") || "23:59");
  const days = parseSelectedDays(formData);

  const staff = await db.staff.findFirst({ where: { id, tenantId: user.tenantId } });
  if (!staff) redirect("/dashboard/staff?error=1");

  await db.staff.update({
    where: { id },
    data: { jobTitle, workingHours: JSON.stringify({ start, end, days }) },
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
