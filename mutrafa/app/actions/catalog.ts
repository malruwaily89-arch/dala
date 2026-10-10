"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireCan } from "@/lib/guard";
import { audit } from "@/lib/audit";
import { halalasFromSar } from "@/lib/money";
import { serviceSchema, firstIssue } from "@/lib/validation";
import { parseWorkingHours } from "@/lib/availability";
import { hasFeature } from "@/lib/plans";
import { BookingError } from "@/lib/booking";

function fail(path: string, error: unknown): never {
  const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

// ─── الخدمات ───────────────────────────────────────────────

export async function createServiceAction(formData: FormData) {
  const path = "/dashboard/services";
  let done = false;
  try {
    const { user, salon, ctx } = await requireCan("services.manage");
    const parsed = serviceSchema.safeParse({
      name: formData.get("name"),
      durationMinutes: formData.get("durationMinutes"),
      priceSar: formData.get("priceSar"),
      depositSar: formData.get("depositSar"),
    });
    if (!parsed.success) throw new BookingError(firstIssue(parsed.error));
    const d = parsed.data;
    const priceHalalas = halalasFromSar(d.priceSar);
    const depositHalalas = halalasFromSar(d.depositSar);
    if (depositHalalas > priceHalalas) throw new BookingError("العربون لا يتجاوز سعر الخدمة");

    // سياسة الإلغاء لكل خدمة متاحة من الذهبية فقط
    const cancelRaw = String(formData.get("cancellationHours") ?? "");
    const cancellationHours =
      cancelRaw && hasFeature(ctx.entitlements, "cancellation.perService") ? Math.min(168, Math.max(0, Number(cancelRaw))) : null;

    const service = await db.service.create({
      data: {
        salonId: salon.id,
        name: d.name,
        durationMinutes: d.durationMinutes,
        priceHalalas,
        depositHalalas,
        cancellationHours,
      },
    });
    await audit({ salonId: salon.id, userId: user.id, action: "service.created", entityType: "service", entityId: service.id });
    done = true;
  } catch (e) {
    fail(path, e);
  }
  if (done) {
    revalidatePath(path);
    redirect(`${path}?ok=created`);
  }
}

export async function toggleServiceAction(formData: FormData) {
  const path = "/dashboard/services";
  let done = false;
  try {
    const { user, salon } = await requireCan("services.manage");
    const service = await db.service.findFirst({ where: { id: String(formData.get("id")), salonId: salon.id } });
    if (!service) throw new BookingError("الخدمة غير موجودة");
    await db.service.update({ where: { id: service.id }, data: { isActive: !service.isActive } });
    await audit({
      salonId: salon.id,
      userId: user.id,
      action: service.isActive ? "service.deactivated" : "service.activated",
      entityType: "service",
      entityId: service.id,
    });
    done = true;
  } catch (e) {
    fail(path, e);
  }
  if (done) revalidatePath(path);
}

// ─── الموظفات (التقويمات) ───────────────────────────────────

export async function createCalendarAction(formData: FormData) {
  const path = "/dashboard/calendars";
  let done = false;
  try {
    const { user, salon, ctx } = await requireCan("calendars.manage");
    if (ctx.remaining.calendars <= 0) {
      throw new BookingError(`بلغتِ الحد الأقصى للتقويمات في باقتك (${ctx.entitlements.calendars}). رقّي باقتك أو أضيفي تقويماً إضافياً.`);
    }
    const name = String(formData.get("name") ?? "").trim();
    if (name.length < 2) throw new BookingError("يرجى إدخال اسم الموظفة");

    const days = formData.getAll("days").map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
    const start = String(formData.get("start") ?? "09:00");
    const end = String(formData.get("end") ?? "21:00");
    const workingHours = parseWorkingHours({ start, end, days: days.length ? days : [0, 1, 2, 3, 4, 5, 6] });

    // العمولة متاحة من الذهبية فقط
    const commissionPercent = hasFeature(ctx.entitlements, "commission")
      ? Math.min(50, Math.max(0, Number(formData.get("commissionPercent") ?? 0)))
      : 0;

    const serviceIds = formData.getAll("serviceIds").map(String);
    const allowed = await db.service.findMany({
      where: { salonId: salon.id, id: { in: serviceIds }, isActive: true },
      select: { id: true },
    });

    const calendar = await db.calendar.create({
      data: {
        salonId: salon.id,
        name,
        phone: String(formData.get("phone") ?? "").trim() || null,
        workingHours,
        commissionBps: Math.round(commissionPercent * 100),
        services: { create: allowed.map((s) => ({ serviceId: s.id })) },
      },
    });
    await audit({ salonId: salon.id, userId: user.id, action: "calendar.created", entityType: "calendar", entityId: calendar.id });
    done = true;
  } catch (e) {
    fail(path, e);
  }
  if (done) {
    revalidatePath(path);
    redirect(`${path}?ok=created`);
  }
}

export async function toggleCalendarAction(formData: FormData) {
  const path = "/dashboard/calendars";
  let done = false;
  try {
    const { user, salon, ctx } = await requireCan("calendars.manage");
    const calendar = await db.calendar.findFirst({ where: { id: String(formData.get("id")), salonId: salon.id } });
    if (!calendar) throw new BookingError("التقويم غير موجود");
    // إعادة التفعيل تخضع لحد الباقة
    if (!calendar.isActive && ctx.remaining.calendars <= 0) {
      throw new BookingError("بلغتِ الحد الأقصى للتقويمات النشطة في باقتك.");
    }
    await db.calendar.update({ where: { id: calendar.id }, data: { isActive: !calendar.isActive } });
    await audit({ salonId: salon.id, userId: user.id, action: "calendar.toggled", entityType: "calendar", entityId: calendar.id });
    done = true;
  } catch (e) {
    fail(path, e);
  }
  if (done) revalidatePath(path);
}

/** ضبط الخدمات التي تقدمها الموظفة ومدة كل خدمة عندها (فارغة = المدة الافتراضية للخدمة) */
export async function updateCalendarServicesAction(formData: FormData) {
  const calendarId = String(formData.get("calendarId") ?? "");
  const path = `/dashboard/calendars/${encodeURIComponent(calendarId)}`;
  let done = false;
  try {
    const { user, salon } = await requireCan("calendars.manage");
    const calendar = await db.calendar.findFirst({ where: { id: calendarId, salonId: salon.id }, select: { id: true } });
    if (!calendar) throw new BookingError("التقويم غير موجود");

    const services = await db.service.findMany({ where: { salonId: salon.id, isActive: true } });
    const selected = new Set(formData.getAll("serviceIds").map(String));
    const rows: { calendarId: string; serviceId: string; durationMinutes: number | null }[] = [];
    for (const svc of services) {
      if (!selected.has(svc.id)) continue;
      const raw = String(formData.get(`duration_${svc.id}`) ?? "").trim();
      let duration: number | null = null;
      if (raw) {
        const n = Number(raw);
        if (!Number.isInteger(n) || n < 15 || n > 480 || n % 5 !== 0) {
          throw new BookingError(`مدة "${svc.name}" يجب أن تكون بين 15 و480 دقيقة، وبخطوة 5 دقائق`);
        }
        duration = n;
      }
      rows.push({ calendarId, serviceId: svc.id, durationMinutes: duration });
    }

    await db.$transaction([
      db.calendarService.deleteMany({ where: { calendarId } }),
      db.calendarService.createMany({ data: rows }),
    ]);
    await audit({ salonId: salon.id, userId: user.id, action: "calendar.services_updated", entityType: "calendar", entityId: calendarId, meta: { count: rows.length } });
    done = true;
  } catch (e) {
    fail(path, e);
  }
  if (done) {
    revalidatePath(path);
    redirect(`${path}?ok=services`);
  }
}
