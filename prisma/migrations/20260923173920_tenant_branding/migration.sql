-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tenants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'trial',
    "planExpires" DATETIME,
    "bankName" TEXT,
    "bankIban" TEXT,
    "whatsappNumber" TEXT,
    "logoUrl" TEXT,
    "brandColor" TEXT NOT NULL DEFAULT '#be185d',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_tenants" ("bankIban", "bankName", "createdAt", "id", "name", "phone", "plan", "planExpires", "slug", "whatsappNumber") SELECT "bankIban", "bankName", "createdAt", "id", "name", "phone", "plan", "planExpires", "slug", "whatsappNumber" FROM "tenants";
DROP TABLE "tenants";
ALTER TABLE "new_tenants" RENAME TO "tenants";
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
