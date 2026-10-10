"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCan } from "@/lib/guard";
import { createBooking, BookingError, confirmDepositManually, markAppointmentOutcome, cancelAppointment, createFreeformBooking } from "@/lib/booking";
import { addToWaitlist } from "@/lib/waitlist";
import { zonedToUtc } from "@/lib/time";
import { isValidSaPhone } from "@/lib/phone";

const APPT = "/dashboard/appointments";

function fail(path: string, error: unknown): never {
  const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function requireDate(value: FormDataEntryValue | null, label: string): string {
  const v = String(value ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new BookingError(`يرجى اختيار ${label}`);
  return v;
}

/** حجز من لوحة التحكم (مكالمة/زيارة) — يمر بنفس فحوصات الحجز العام */
export async function createDashboardBookingAction(formData: FormData) {
  let ok = false;
  try {
    const { salon, ctx } = await requireCan("appointments.manage");
    const date = requireDate(formData.get("date"), "التاريخ");
    const time = String(formData.get("time") ?? "");
    if (!/^([01]\d|2[0-3]):(00|15|30|45)$/.test(time)) {
      throw new BookingError("يرجى اختيار الوقت من المواعيد كل ربع ساعة (مثل 9:00 و9:15 و9:30)");
    }
    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    await createBooking(
      {
        salonId: salon.id,
        serviceId: String(formData.get("serviceId") ?? ""),
        calendarId: String(formData.get("calendarId") ?? ""),
        startsAt: zonedToUtc(y, m, d, hh, mm, salon.timezone),
        customerName: String(formData.get("customerName") ?? ""),
        customerPhone: String(formData.get("customerPhone") ?? ""),
        source: "DASHBOARD",
      },
      ctx
    );
    ok = true;
  } catch (e) {
    fail(APPT, e);
  }
  if (ok) {
    revalidatePath(APPT);
    redirect(`${APPT}?ok=created`);
  }
}

async function outcomeAction(formData: FormData, outcome: "COMPLETED" | "NO_SHOW") {
  let done = false;
  try {
    const { user, salon } = await requireCan("appointments.manage");
    await markAppointmentOutcome({
      salonId: salon.id,
      appointmentId: String(formData.get("id") ?? ""),
      outcome,
      userId: user.id,
    });
    done = true;
  } catch (e) {
    fail(APPT, e);
  }
  if (done) revalidatePath(APPT);
}

export async function completeAppointmentAction(formData: FormData) {
  await outcomeAction(formData, "COMPLETED");
}

export async function noShowAppointmentAction(formData: FormData) {
  await outcomeAction(formData, "NO_SHOW");
}

export async function confirmDepositAction(formData: FormData) {
  let done = false;
  try {
    const { user, salon } = await requireCan("appointments.manage");
    await confirmDepositManually(salon.id, user.id, String(formData.get("id") ?? ""));
    done = true;
  } catch (e) {
    fail(APPT, e);
  }
  if (done) revalidatePath(APPT);
}

export async function cancelAppointmentAction(formData: FormData) {
  let done = false;
  try {
    const { user, salon } = await requireCan("appointments.manage");
    await cancelAppointment({
      salonId: salon.id,
      appointmentId: String(formData.get("id") ?? ""),
      byCustomer: false,
      reason: "أُلغي من الصالون",
      userId: user.id,
    });
    done = true;
  } catch (e) {
    fail(APPT, e);
  }
  if (done) revalidatePath(APPT);
}

export async function addWaitlistAction(formData: FormData) {
  let done = false;
  try {
    const { user, salon } = await requireCan("waitlist.manage");
    const phone = String(formData.get("customerPhone") ?? "");
    if (!isValidSaPhone(phone)) throw new BookingError("رقم الجوال غير صالح.");
    const preferred = String(formData.get("preferredDate") ?? "");
    await addToWaitlist({
      salonId: salon.id,
      userId: user.id,
      customerName: String(formData.get("customerName") ?? ""),
      customerPhone: phone,
      serviceId: String(formData.get("serviceId") ?? ""),
      preferredFrom: preferred ? new Date(preferred) : null,
    });
    done = true;
  } catch (e) {
    fail("/dashboard/waitlist", e);
  }
  if (done) {
    revalidatePath("/dashboard/waitlist");
    redirect("/dashboard/waitlist?ok=added");
  }
}

/** حجز سريع من جدول الموظفة: يبقى المستخدم في الجدول بعد الحفظ */
export async function createCalendarBookingAction(formData: FormData) {
  const calendarId = String(formData.get("calendarId") ?? "");
  const dayKey = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const back = `/dashboard/calendars/${encodeURIComponent(calendarId)}?date=${encodeURIComponent(dayKey)}`;
  let done = false;
  try {
    const { salon, ctx } = await requireCan("appointments.manage");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) throw new BookingError("التاريخ غير صالح");
    if (!/^([01]\d|2[0-3]):(00|15|30|45)$/.test(time)) {
      throw new BookingError("يرجى اختيار وقت من المواعيد كل ربع ساعة");
    }
    const [y, m, d] = dayKey.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    await createBooking(
      {
        salonId: salon.id,
        serviceId: String(formData.get("serviceId") ?? ""),
        calendarId,
        startsAt: zonedToUtc(y, m, d, hh, mm, salon.timezone),
        customerName: String(formData.get("customerName") ?? ""),
        customerPhone: String(formData.get("customerPhone") ?? ""),
        source: "DASHBOARD",
      },
      ctx
    );
    done = true;
  } catch (e) {
    const message = e instanceof Error ? e.message : "حدث خطأ غير متوقع";
    redirect(`${back}&error=${encodeURIComponent(message)}`);
  }
  if (done) {
    revalidatePath(back);
    redirect(`${back}&ok=booked`);
  }
}

/** حجز خدمة غير مسجلة أو وقت داخلي (استراحة/تنظيف) من جدول الموظفة */
export async function createFreeformBookingAction(formData: FormData) {
  const calendarId = String(formData.get("calendarId") ?? "");
  const dayKey = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const back = `/dashboard/calendars/${encodeURIComponent(calendarId)}?date=${encodeURIComponent(dayKey)}`;
  let done = false;
  try {
    const { user, salon } = await requireCan("appointments.manage");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) throw new BookingError("التاريخ غير صالح");
    if (!/^([01]\d|2[0-3]):(00|15|30|45)$/.test(time)) throw new BookingError("الوقت يجب أن يكون كل ربع ساعة");
    const kind = String(formData.get("kind") ?? "") === "BLOCK" ? "BLOCK" : "CUSTOM";
    const [y, m, d] = dayKey.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    const priceSar = kind === "BLOCK" ? 0 : Number(String(formData.get("priceSar") ?? "0").replace(",", "."));
    if (!Number.isFinite(priceSar)) throw new BookingError("السعر غير صالح");
    await createFreeformBooking({
      salonId: salon.id,
      userId: user.id,
      calendarId,
      startsAt: zonedToUtc(y, m, d, hh, mm, salon.timezone),
      durationMinutes: Number(formData.get("durationMinutes")),
      kind,
      label: kind === "BLOCK" ? String(formData.get("blockLabel") ?? "استراحة") : String(formData.get("label") ?? ""),
      priceHalalas: Math.round(priceSar * 100),
      customerName: String(formData.get("customerName") ?? ""),
      customerPhone: String(formData.get("customerPhone") ?? ""),
    });
    done = true;
  } catch (e) {
    const message = e instanceof Error ? e.message : "حدث خطأ غير متوقع";
    redirect(`${back}&error=${encodeURIComponent(message)}`);
  }
  if (done) {
    revalidatePath(back);
    redirect(`${back}&ok=freeform`);
  }
}
