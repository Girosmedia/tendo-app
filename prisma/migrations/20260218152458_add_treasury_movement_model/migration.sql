-- CreateEnum
CREATE TYPE "TreasuryMovementType" AS ENUM ('INFLOW', 'OUTFLOW');

-- CreateEnum
CREATE TYPE "TreasuryMovementCategory" AS ENUM ('CAPITAL_INJECTION', 'OWNER_WITHDRAWAL', 'LOAN_IN', 'LOAN_OUT', 'ACCOUNT_PAYABLE_PAYMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "TreasuryMovementSource" AS ENUM ('CASH', 'BANK', 'TRANSFER', 'OTHER');

-- CreateTable
CREATE TABLE "treasury_movements" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "account_payable_id" TEXT,
    "type" "TreasuryMovementType" NOT NULL,
    "category" "TreasuryMovementCategory" NOT NULL DEFAULT 'OTHER',
    "source" "TreasuryMovementSource" NOT NULL DEFAULT 'OTHER',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treasury_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "treasury_movements_organization_id_idx" ON "treasury_movements"("organization_id");

-- CreateIndex
CREATE INDEX "treasury_movements_account_payable_id_idx" ON "treasury_movements"("account_payable_id");

-- CreateIndex
CREATE INDEX "treasury_movements_occurred_at_idx" ON "treasury_movements"("occurred_at");

-- CreateIndex
CREATE INDEX "treasury_movements_type_idx" ON "treasury_movements"("type");

-- CreateIndex
CREATE INDEX "treasury_movements_category_idx" ON "treasury_movements"("category");

-- AddForeignKey
ALTER TABLE "treasury_movements" ADD CONSTRAINT "treasury_movements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treasury_movements" ADD CONSTRAINT "treasury_movements_account_payable_id_fkey" FOREIGN KEY ("account_payable_id") REFERENCES "accounts_payable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
