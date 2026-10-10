"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireCan } from "@/lib/guard";
import { audit } from "@/lib/audit";
import { BookingError } from "@/lib/booking";
import { halalasFromSar } from "@/lib/money";

const SETTINGS = "/dashboard/settings";
const CUSTOMERS = "/dashboard/customers";
const LOGO_MAX_BYTES = 512 * 1024;
const LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function fail(path: string, error: unknown): never {
  redirect(`${path}?error=${encodeURIComponent(error instanceof Error ? error.message : "خطأ")}`);
}

/** رفع شعار الصالون — يُحفظ في قاعدة البيانات ويُعرض في الحجز وفي رسائل واتساب */
export async function uploadLogoAction(formData: FormData) {
  let done = false;
  try {
    const { user, salon } = await requireCan("settings.manage");
    const file = formData.get("logo");
    if (!(file instanceof File) || file.size === 0) throw new BookingError("اختاري صورة الشعار أولاً");
    if (!LOGO_TYPES.has(file.type)) throw new BookingError("صيغة الشعار يجب أن تكون PNG أو JPG أو WEBP");
    if (file.size > LOGO_MAX_BYTES) throw new BookingError("حجم الشعار يتجاوز 512 كيلوبايت");
    const bytes = Buffer.from(await file.arrayBuffer());
    await db.salonLogo.upsert({
      where: { salonId: salon.id },
      update: { mime: file.type, data: bytes },
      create: { salonId: salon.id, mime: file.type, data: bytes },
    });
    await audit({ salonId: salon.id, userId: user.id, action: "salon.logo_updated", entityType: "salon", entityId: salon.id });
    done = true;
  } catch (e) {
    fail(SETTINGS, e);
  }
  if (done) {
    revalidatePath(SETTINGS);
    redirect(`${SETTINGS}?ok=logo`);
  }
}

export async function removeLogoAction() {
  const { user, salon } = await requireCan("settings.manage");
  await db.salonLogo.deleteMany({ where: { salonId: salon.id } });
  await audit({ salonId: salon.id, userId: user.id, action: "salon.logo_removed", entityType: "salon", entityId: salon.id });
  revalidatePath(SETTINGS);
  redirect(`${SETTINGS}?ok=logo`);
}

/** إضافة يوم إغلاق: لا تُقبل فيه حجوزات، ولا تظهر فيه فتحات */
export async function addClosedDayAction(formData: FormData) {
  let done = false;
  try {
    const { user, salon } = await requireCan("settings.manage");
    const dayKey = String(formData.get("dayKey") ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) throw new BookingError("يرجى اختيار تاريخ صحيح");
    const reason = String(formData.get("reason") ?? "").trim().slice(0, 80) || null;
    await db.closedDay.upsert({
      where: { salonId_dayKey: { salonId: salon.id, dayKey } },
      update: { reason },
      create: { salonId: salon.id, dayKey, reason },
    });
    await audit({ salonId: salon.id, userId: user.id, action: "salon.closed_day_added", entityType: "salon", entityId: salon.id, meta: { dayKey } });
    done = true;
  } catch (e) {
    fail(SETTINGS, e);
  }
  if (done) {
    revalidatePath(SETTINGS);
    redirect(`${SETTINGS}?ok=closed`);
  }
}

export async function removeClosedDayAction(formData: FormData) {
  const { salon } = await requireCan("settings.manage");
  const id = String(formData.get("id") ?? "");
  await db.closedDay.deleteMany({ where: { id, salonId: salon.id } });
  revalidatePath(SETTINGS);
  redirect(`${SETTINGS}?ok=closed`);
}

/** ملاحظات الصحة والحساسية — تظهر للموظفات قبل كل خدمة */
export async function updateHealthNotesAction(formData: FormData) {
  let done = false;
  try {
    const { salon } = await requireCan("customers.manage");
    const customerId = String(formData.get("customerId") ?? "");
    const notes = String(formData.get("healthNotes") ?? "").trim().slice(0, 500) || null;
    const updated = await db.customer.updateMany({ where: { id: customerId, salonId: salon.id }, data: { healthNotes: notes } });
    if (updated.count === 0) throw new BookingError("العميلة غير موجودة");
    done = true;
  } catch (e) {
    fail(CUSTOMERS, e);
  }
  if (done) {
    revalidatePath(CUSTOMERS);
    redirect(`${CUSTOMERS}?ok=notes`);
  }
}

/** بيع باقة جلسات لعميلة: مثلاً 5 جلسات لخدمة بسعر مخفّض */
export async function sellSessionPackAction(formData: FormData) {
  let done = false;
  try {
    const { salon } = await requireCan("customers.manage");
    const customerId = String(formData.get("customerId") ?? "");
    const serviceId = String(formData.get("serviceId") ?? "");
    const totalSessions = Math.round(Number(formData.get("totalSessions") ?? 0));
    if (!Number.isFinite(totalSessions) || totalSessions < 2 || totalSessions > 50) {
      throw new BookingError("عدد الجلسات بين 2 و50");
    }
    const priceSar = Number(formData.get("priceSar") ?? 0);
    if (!Number.isFinite(priceSar) || priceSar < 0) throw new BookingError("السعر غير صالح");
    const [customer, service] = await Promise.all([
      db.customer.findFirst({ where: { id: customerId, salonId: salon.id }, select: { id: true } }),
      db.service.findFirst({ where: { id: serviceId, salonId: salon.id, isActive: true }, select: { id: true } }),
    ]);
    if (!customer) throw new BookingError("العميلة غير موجودة");
    if (!service) throw new BookingError("الخدمة غير متاحة");
    await db.sessionPack.create({
      data: { salonId: salon.id, customerId, serviceId, totalSessions, priceHalalas: halalasFromSar(priceSar) },
    });
    done = true;
  } catch (e) {
    fail(CUSTOMERS, e);
  }
  if (done) {
    revalidatePath(CUSTOMERS);
    redirect(`${CUSTOMERS}?ok=pack`);
  }
}
