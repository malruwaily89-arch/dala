-- شعار الصالون، أيام الإغلاق، ملاحظات صحية للعميلة، باقات الجلسات

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "sessionPackId" TEXT;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "healthNotes" TEXT;

-- CreateTable
CREATE TABLE "closed_days" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "closed_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_packs" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "totalSessions" INTEGER NOT NULL,
    "usedSessions" INTEGER NOT NULL DEFAULT 0,
    "priceHalalas" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salon_logos" (
    "salonId" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "salon_logos_pkey" PRIMARY KEY ("salonId")
);

-- CreateIndex
CREATE UNIQUE INDEX "closed_days_salonId_dayKey_key" ON "closed_days"("salonId", "dayKey");

-- CreateIndex
CREATE INDEX "session_packs_salonId_customerId_idx" ON "session_packs"("salonId", "customerId");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_sessionPackId_fkey" FOREIGN KEY ("sessionPackId") REFERENCES "session_packs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "closed_days" ADD CONSTRAINT "closed_days_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "salons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_packs" ADD CONSTRAINT "session_packs_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "salons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_packs" ADD CONSTRAINT "session_packs_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_packs" ADD CONSTRAINT "session_packs_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salon_logos" ADD CONSTRAINT "salon_logos_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "salons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

