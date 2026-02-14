-- CreateEnum
CREATE TYPE "CashRegisterStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "cash_registers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "status" "CashRegisterStatus" NOT NULL DEFAULT 'OPEN',
    "opened_by" TEXT NOT NULL,
    "closed_by" TEXT,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "opening_cash" DECIMAL(10,2) NOT NULL,
    "expected_cash" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "actual_cash" DECIMAL(10,2),
    "difference" DECIMAL(10,2),
    "total_sales" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sales_count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_registers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_registers_organization_id_idx" ON "cash_registers"("organization_id");

-- CreateIndex
CREATE INDEX "cash_registers_opened_by_idx" ON "cash_registers"("opened_by");

-- CreateIndex
CREATE INDEX "cash_registers_status_idx" ON "cash_registers"("status");

-- CreateIndex
CREATE INDEX "cash_registers_opened_at_idx" ON "cash_registers"("opened_at");

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
