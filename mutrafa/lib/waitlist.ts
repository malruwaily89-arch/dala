import { db } from "./db";
import { audit } from "./audit";
import { normalizeSaPhone } from "./phone";

/** إضافة عميلة لقائمة الانتظار (يدوياً من لوحة التحكم — الفضية وما فوق) */
export async function addToWaitlist(params: {
  salonId: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  preferredFrom: Date | null;
}): Promise<void> {
  const phone = normalizeSaPhone(params.customerPhone);
  if (!phone) throw new Error("رقم الجوال غير صالح.");
  const service = await db.service.findFirst({ where: { id: params.serviceId, salonId: params.salonId } });
  if (!service) throw new Error("الخدمة غير موجودة.");

  const customer = await db.customer.upsert({
    where: { salonId_phone: { salonId: params.salonId, phone } },
    update: { name: params.customerName.trim() },
    create: { salonId: params.salonId, phone, name: params.customerName.trim() },
  });
  const entry = await db.waitlistEntry.create({
    data: {
      salonId: params.salonId,
      customerId: customer.id,
      serviceId: service.id,
      preferredFrom: params.preferredFrom,
    },
  });
  await audit({ salonId: params.salonId, userId: params.userId, action: "waitlist.added", entityType: "waitlist", entityId: entry.id });
}
