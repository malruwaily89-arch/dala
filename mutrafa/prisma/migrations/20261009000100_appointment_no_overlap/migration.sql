-- منع تعارض المواعيد على مستوى قاعدة البيانات (حتى مع الطلبات المتزامنة).
-- يُطبَّق فقط على الحجوزات النشطة: بانتظار العربون والمؤكدة.
-- الحجوزات المكتملة/الملغاة/المنتهية لا تحجز الوقت.
--
-- ملاحظة: أعمدة DateTime في Prisma هي TIMESTAMP(3) بدون منطقة زمنية،
-- والتطبيق يكتب دائماً بتوقيت UTC، لذلك نستخدم tsrange (غير المعتمد على المنطقة الزمنية).

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_no_calendar_overlap"
  EXCLUDE USING gist (
    "calendarId" WITH =,
    tsrange("startsAt", "endsAt", '[)') WITH &&
  )
  WHERE ("status" IN ('PENDING_DEPOSIT', 'CONFIRMED'));

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_end_after_start" CHECK ("endsAt" > "startsAt");

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_amount_non_negative" CHECK ("amountHalalas" >= 0);
