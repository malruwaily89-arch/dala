-- AlterTable: staff login accounts + granular permissions
ALTER TABLE "users" ADD COLUMN "staffId" TEXT;
ALTER TABLE "users" ADD COLUMN "canCancelAppointments" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "canAddAppointments" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "canViewAppointmentStatus" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "canManageStaffSchedules" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "users_staffId_key" ON "users"("staffId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
