"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCan } from "@/lib/guard";
import { createBooking, BookingError, confirmDepositManually, markAppointmentOutcome, cancelAppointment } from "@/lib/booking";
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
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new BookingError("يرجى اختيار الوقت");
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
