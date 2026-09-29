-- Preserve existing Riyal values while moving financial fields away from binary floating point.
ALTER TABLE "services"
  ALTER COLUMN "price" TYPE DECIMAL(12, 2) USING ROUND("price"::numeric, 2),
  ALTER COLUMN "depositAmount" TYPE DECIMAL(12, 2) USING ROUND("depositAmount"::numeric, 2);

ALTER TABLE "appointments"
  ALTER COLUMN "depositAmount" TYPE DECIMAL(12, 2) USING ROUND("depositAmount"::numeric, 2);

ALTER TABLE "payments"
  ALTER COLUMN "amount" TYPE DECIMAL(12, 2) USING ROUND("amount"::numeric, 2);
