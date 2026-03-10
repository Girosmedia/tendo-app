-- AlterEnum: add new TreasuryMovementCategory values
ALTER TYPE "TreasuryMovementCategory" ADD VALUE IF NOT EXISTS 'SALE_INCOME';
ALTER TYPE "TreasuryMovementCategory" ADD VALUE IF NOT EXISTS 'CREDIT_PAYMENT';
ALTER TYPE "TreasuryMovementCategory" ADD VALUE IF NOT EXISTS 'OPERATIONAL_EXPENSE';
ALTER TYPE "TreasuryMovementCategory" ADD VALUE IF NOT EXISTS 'CASH_REGISTER_DIFF';

-- AlterTable: add FK columns to treasury_movements
ALTER TABLE "treasury_movements"
  ADD COLUMN IF NOT EXISTS "document_id" TEXT,
  ADD COLUMN IF NOT EXISTS "credit_payment_id" TEXT;

-- CreateIndex: unique on credit_payment_id (1-1 relation with Payment)
CREATE UNIQUE INDEX IF NOT EXISTS "treasury_movements_credit_payment_id_key"
  ON "treasury_movements"("credit_payment_id");

-- CreateIndex: regular index on document_id (1-many relation with Document)
CREATE INDEX IF NOT EXISTS "treasury_movements_document_id_idx"
  ON "treasury_movements"("document_id");

-- AddForeignKey
ALTER TABLE "treasury_movements"
  ADD CONSTRAINT "treasury_movements_document_id_fkey"
  FOREIGN KEY ("document_id") REFERENCES "documents"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treasury_movements"
  ADD CONSTRAINT "treasury_movements_credit_payment_id_fkey"
  FOREIGN KEY ("credit_payment_id") REFERENCES "payments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
