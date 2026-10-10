-- AlterTable
ALTER TABLE "users" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "verifyToken" TEXT;
ALTER TABLE "users" ADD COLUMN "verifyTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_verifyToken_key" ON "users"("verifyToken");
