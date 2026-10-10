import type { Prisma } from "@prisma/client";

/**
 * رقم الحجز المعروض: M ثم رقم متسلسل خاص بكل صالون (M1001، M1002، ...).
 * التسلسل مخزّن في Salon.bookingSeq ويُزاد داخل نفس معاملة إنشاء الحجز،
 * فلا يتكرر رقم داخل الصالون ولا يُعرف حجم الصالونات الأخرى.
 */
export const BOOKING_CODE_PREFIX = "M";
/** أول رقم يُعطى لصالون جديد = bookingSeq الافتراضي + 1 */
export const FIRST_BOOKING_NUMBER = 1001;

export function formatBookingCode(number: number): string {
  return `${BOOKING_CODE_PREFIX}${number}`;
}

export function isBookingCode(value: string): boolean {
  return /^M\d{1,9}$/.test(value);
}

/**
 * يحجز الرقم التالي للصالون. يجب استدعاؤه داخل معاملة (tx) ليكون التحديث
 * الذري مع إنشاء الحجز: إن فشل الحجز يتراجع الرقم أيضاً.
 */
export async function allocateBookingCode(db: Pick<Prisma.TransactionClient, "salon">, salonId: string): Promise<string> {
  const salon = await db.salon.update({
    where: { id: salonId },
    data: { bookingSeq: { increment: 1 } },
    select: { bookingSeq: true },
  });
  return formatBookingCode(salon.bookingSeq);
}
