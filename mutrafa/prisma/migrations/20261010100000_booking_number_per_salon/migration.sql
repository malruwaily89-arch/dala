-- أرقام الحجز: M + رقم متسلسل لكل صالون بدلاً من رمز عشوائي عالمي

-- AlterTable: عدّاد الأرقام لكل صالون
ALTER TABLE "salons" ADD COLUMN "bookingSeq" INTEGER NOT NULL DEFAULT 1000;

-- الحجوزات القديمة تُعاد تسميتها بالترتيب داخل كل صالون: M1001 فصاعداً
DROP INDEX IF EXISTS "appointments_code_key";
UPDATE "appointments" AS a
SET "code" = 'M' || (1000 + r.rn)::TEXT
FROM (
    SELECT "id", ROW_NUMBER() OVER (PARTITION BY "salonId" ORDER BY "createdAt", "id") AS rn
    FROM "appointments"
) AS r
WHERE a."id" = r."id";

-- العدّاد يبدأ بعد آخر رقم أُعطي فعلاً لكل صالون
UPDATE "salons" AS s
SET "bookingSeq" = 1000 + (SELECT COUNT(*) FROM "appointments" AS a WHERE a."salonId" = s."id");

-- CreateIndex: الرقم فريد داخل الصالون فقط
CREATE UNIQUE INDEX "appointments_salonId_code_key" ON "appointments"("salonId", "code");
