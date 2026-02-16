-- CreateEnum
CREATE TYPE "OperationalExpensePaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'OTHER');

-- CreateTable
CREATE TABLE "operational_expenses" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "cash_register_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_method" "OperationalExpensePaymentMethod" NOT NULL DEFAULT 'CASH',
    "expense_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operational_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "operational_expenses_organization_id_idx" ON "operational_expenses"("organization_id");

-- CreateIndex
CREATE INDEX "operational_expenses_cash_register_id_idx" ON "operational_expenses"("cash_register_id");

-- CreateIndex
CREATE INDEX "operational_expenses_expense_date_idx" ON "operational_expenses"("expense_date");

-- CreateIndex
CREATE INDEX "operational_expenses_category_idx" ON "operational_expenses"("category");

-- AddForeignKey
ALTER TABLE "operational_expenses" ADD CONSTRAINT "operational_expenses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_expenses" ADD CONSTRAINT "operational_expenses_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
