-- AlterTable: job title for staff
ALTER TABLE "staff" ADD COLUMN "jobTitle" TEXT;

-- AlterTable: permanent sequential salon identity (D1, D2, ...)
ALTER TABLE "tenants" ADD COLUMN "sequenceNumber" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tenants_sequenceNumber_key" ON "tenants"("sequenceNumber");
