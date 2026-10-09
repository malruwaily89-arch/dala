"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { loadSalonContext } from "@/lib/salon-context";
import { createBooking, startDepositPayment, availableSlotsFor, cancelAppointment, appointmentConfirmedMessage, BookingError } from "@/lib/booking";
import { publicBookingSchema, firstIssue } from "@/lib/validation";
import { zonedToUtc, formatLocalTime, localDayKey } from "@/lib/time";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { bookingUrl } from "@/lib/env";
import { hasFeature } from "@/lib/plans";
import { normalizeSaPhone, isValidSaPhone } from "@/lib/phone";
import { formatSar } from "@/lib/money";
import { isBookingCode } from "@/lib/booking-code";
import { effectiveCancellationHours, isFreeCancellation } from "@/lib/cancellation";

async function salonBySlug(slug: string) {
  const salon = await db.salon.findUnique({ where: { slug } });
  if (!salon) throw new BookingError("الصالون غير موجود");
  return salon;
}

/** المواعيد المتاحة ليوم معين — تُستدعى من واجهة الحجز */
export async function getSlotsAction(slug: string, serviceId: string, calendarId: string, dayKey: string) {
  const salon = await salonBySlug(slug);
  const ctx = await loadSalonContext(salon.id);
  if (!ctx.bookingsOpen) return { open: false as const, slots: [] as { iso: string; label: string }[] };

  const valid = await db.calendar.findFirst({
    where: { id: calendarId, salonId: salon.id, isActive: true, services: { some: { serviceId } } },
    select: { id: true },
  });
  if (!valid) return { open: true as const, slots: [] };

  const slots = await availableSlotsFor({
    salonId: salon.id,
    calendarId,
    serviceId,
    dayKey,
    timeZone: salon.timezone,
  });
  return {
    open: true as const,
    slots: slots.map((s) => ({ iso: s.toISOString(), label: formatLocalTime(s, salon.timezone) })),
  };
}

/** حجز عام: الاسم والجوال والموعد، ثم العربون (إن وُجد) */
export async function publicBookingAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const parsed = publicBookingSchema.safeParse({
    slug,
    serviceId: formData.get("serviceId"),
    calendarId: formData.get("calendarId"),
    startsAtIso: formData.get("startsAtIso"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    policy: formData.get("policy") ?? undefined,
  });
  if (!parsed.success) redirect(`/${slug}?error=${encodeURIComponent(firstIssue(parsed.error))}`);
  const d = parsed.data;

  let redirectTo: string;
  try {
    const salon = await salonBySlug(slug);
    const ctx = await loadSalonContext(salon.id);
    const appt = await createBooking(
      {
        salonId: salon.id,
        serviceId: d.serviceId,
        calendarId: d.calendarId,
        startsAt: new Date(d.startsAtIso),
        customerName: d.name,
        customerPhone: d.phone,
        source: "LINK",
      },
      ctx
    );

    const checkout = await startDepositPayment(appt.id);
    if (checkout) {
      await sendWhatsAppText({
        salonId: salon.id,
        appointmentId: appt.id,
        toPhone: appt.customer.phone,
        body: `حجزك تحت الرقم ${appt.code} بانتظار العربون (${formatSar(appt.depositHalalas)}). ادفعي خلال ساعتين حتى يُثبَّت الموعد.\n${checkout.url}`,
      });
      redirectTo = checkout.url;
    } else {
      await sendWhatsAppText({
        salonId: salon.id,
        appointmentId: appt.id,
        toPhone: appt.customer.phone,
        body: appointmentConfirmedMessage(appt, salon.timezone),
      });
      redirectTo = `/${slug}/booking/${appt.code}?ok=confirmed`;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "حدث خطأ غير متوقع";
    redirect(`/${slug}?error=${encodeURIComponent(message)}`);
  }
  redirect(redirectTo);
}

/** إلغاء من العميلة عبر رابط حجزها */
export async function customerCancelAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const code = String(formData.get("code") ?? "");
  let freeCancellation = true;
  try {
    const salon = await salonBySlug(slug);
    const appt = await db.appointment.findFirst({ where: { code, salonId: salon.id } });
    if (!appt) throw new BookingError("الحجز غير موجود");
    const result = await cancelAppointment({
      salonId: salon.id,
      appointmentId: appt.id,
      byCustomer: true,
      reason: "أُلغي من العميلة",
    });
    freeCancellation = result.freeCancellation;
  } catch (e) {
    redirect(`/${slug}/booking/${code}?error=${encodeURIComponent(e instanceof Error ? e.message : "خطأ")}`);
  }
  revalidatePath(`/${slug}/booking/${code}`);
  redirect(`/${slug}/booking/${code}?ok=cancelled${freeCancellation ? "" : "&late=1"}`);
}

/** تقييم بعد إتمام الخدمة (مرة واحدة لكل حجز) */
export async function submitReviewAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const code = String(formData.get("code") ?? "");
  const score = Number(formData.get("score"));
  const comment = String(formData.get("comment") ?? "").trim().slice(0, 500) || null;
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    redirect(`/${slug}/booking/${code}?error=${encodeURIComponent("يرجى اختيار تقييم من 1 إلى 5")}`);
  }
  try {
    const salon = await salonBySlug(slug);
    const appt = await db.appointment.findFirst({ where: { code, salonId: salon.id }, include: { review: true } });
    if (!appt || appt.status !== "COMPLETED") throw new BookingError("لا يمكن التقييم قبل إتمام الخدمة");
    if (appt.review) throw new BookingError("تم تقييم هذا الحجز مسبقاً");
    await db.review.create({
      data: { salonId: salon.id, appointmentId: appt.id, customerId: appt.customerId, score, comment },
    });
  } catch (e) {
    redirect(`/${slug}/booking/${code}?error=${encodeURIComponent(e instanceof Error ? e.message : "خطأ")}`);
  }
  revalidatePath(`/${slug}/booking/${code}`);
  redirect(`/${slug}/booking/${code}?ok=rated`);
}

/** انضمام عميلة لقائمة الانتظار من صفحة الحجز — الذهبية وما فوق (إشعار تلقائي عند تحرّر موعد) */
export async function joinWaitlistAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  let done = false;
  try {
    const salon = await salonBySlug(slug);
    const ctx = await loadSalonContext(salon.id);
    if (!hasFeature(ctx.entitlements, "waitlist.auto")) throw new BookingError("قائمة الانتظار غير متاحة لهذا الصالون.");
    const serviceId = String(formData.get("serviceId") ?? "");
    const phone = String(formData.get("phone") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    if (!isValidSaPhone(phone)) throw new BookingError("رقم الجوال غير صالح.");
    if (name.length < 2) throw new BookingError("يرجى إدخال الاسم.");
    const service = await db.service.findFirst({ where: { id: serviceId, salonId: salon.id, isActive: true } });
    if (!service) throw new BookingError("الخدمة غير متاحة.");

    const normalized = normalizeSaPhone(phone)!;
    const customer = await db.customer.upsert({
      where: { salonId_phone: { salonId: salon.id, phone: normalized } },
      update: { name },
      create: { salonId: salon.id, phone: normalized, name },
    });
    await db.waitlistEntry.create({ data: { salonId: salon.id, customerId: customer.id, serviceId: service.id } });
    done = true;
  } catch (e) {
    redirect(`/${slug}?error=${encodeURIComponent(e instanceof Error ? e.message : "خطأ")}`);
  }
  if (done) redirect(`/${slug}?waitlist=1`);
}

/** إعادة توجيه صفحة الدفع: تُنشئ checkout جديداً لعربون حجز ما زال بانتظار الدفع */
export async function resumeDepositAction(slug: string, code: string): Promise<string> {
  if (!isBookingCode(code)) throw new BookingError("رقم الحجز غير صالح");
  const salon = await salonBySlug(slug);
  const appt = await db.appointment.findFirst({ where: { code, salonId: salon.id } });
  if (!appt || appt.status !== "PENDING_DEPOSIT") throw new BookingError("هذا الحجز لا يحتاج عربوناً الآن");
  const checkout = await startDepositPayment(appt.id);
  if (!checkout) throw new BookingError("لا يوجد عربون مستحق لهذا الحجز");
  return checkout.url;
}

export { zonedToUtc, localDayKey, bookingUrl, effectiveCancellationHours, isFreeCancellation };
